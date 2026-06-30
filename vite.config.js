import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Firebase project ID for Firestore REST API calls
const FIREBASE_PROJECT_ID = 'prooflayer-3cc7b';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

/**
 * Vite Plugin: ProofLayer Widget Data API
 * 
 * Intercepts GET /api/widget-data?token=xxx and returns
 * widget config + testimonials from Firestore via the public REST API.
 * No Firebase Admin SDK needed — uses public read rules.
 */
function proofLayerApiPlugin() {
  return {
    name: 'prooflayer-widget-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Serve Demo website
        if (req.url?.startsWith('/demo')) {
          const fs = await import('node:fs');
          const path = await import('node:path');
          
          // Remove query params and mapping /demo to /
          const requestPath = req.url.split('?')[0].replace(/^\/demo\/?/, '') || 'index.html';
          const demoDir = path.resolve(process.cwd(), '../Demo');
          const filePath = path.join(demoDir, requestPath);
          
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            
            const mimeTypes = {
              '.html': 'text/html',
              '.css': 'text/css',
              '.js': 'application/javascript',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.svg': 'image/svg+xml'
            };
            
            res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
            res.statusCode = 200;
            return res.end(content);
          }
        }

        // Only handle our specific endpoint
        if (!req.url?.startsWith('/api/widget-data')) {
          return next();
        }

        // Set CORS + JSON headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        // Parse token from query string
        const url = new URL(req.url, 'http://localhost');
        const token = url.searchParams.get('token');

        if (!token) {
          res.statusCode = 400;
          return res.end(JSON.stringify({
            success: false,
            error: 'Missing required "token" query parameter.',
          }));
        }

        try {
          // 1. Fetch widget config from Firestore REST API
          const config = await fetchWidgetConfig(token);

          // 2. Fetch testimonials from Firestore REST API
          const reviews = await fetchDistributedReviews(config.sourceFilter, config.limit);

          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            config,
            data: reviews,
          }));
        } catch (error) {
          console.error('[ProofLayer API] Error:', error.message);

          // Return defaults + static fallback data on error
          const fallbackData = await fetchStaticFallback();
          res.statusCode = 200;
          res.end(JSON.stringify({
            success: false,
            error: error.message,
            config: getDefaultConfig(),
            data: fallbackData,
          }));
        }
      });
    },
  };
}

// Default widget configuration
function getDefaultConfig() {
  return {
    template: 'slider',
    theme: 'glass',
    limit: 5,
    position: 'bottom-right',
    interval: 6000,
    sourceFilter: '',
    alignment: 'center',
    offsetX: 0,
    offsetY: 0,
  };
}

/**
 * Fetch widget config from Firestore REST API (public read, no auth needed).
 * Falls back to defaults if the document doesn't exist.
 */
async function fetchWidgetConfig(token) {
  try {
    const url = `${FIRESTORE_BASE}/widgetConfigs/${token}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[ProofLayer API] No config found for token "${token}", using defaults.`);
      return getDefaultConfig();
    }

    const doc = await response.json();
    const fields = doc.fields?.config?.mapValue?.fields;

    if (!fields) {
      return getDefaultConfig();
    }

    // Parse Firestore REST field format into a clean object
    return {
      template:     fields.template?.stringValue     || 'slider',
      theme:        fields.theme?.stringValue         || 'glass',
      limit:        fields.limit?.integerValue ? parseInt(fields.limit.integerValue) : 5,
      position:     fields.position?.stringValue      || 'bottom-right',
      interval:     fields.interval?.integerValue ? parseInt(fields.interval.integerValue) : 6000,
      sourceFilter: fields.sourceFilter?.stringValue  || '',
      alignment:    fields.alignment?.stringValue     || 'center',
      offsetX:      fields.offsetX?.integerValue ? parseInt(fields.offsetX.integerValue) : 0,
      offsetY:      fields.offsetY?.integerValue ? parseInt(fields.offsetY.integerValue) : 0,
    };
  } catch (error) {
    console.warn('[ProofLayer API] Config fetch failed:', error.message);
    return getDefaultConfig();
  }
}

/**
 * Fetch distributed testimonials from Firestore REST API.
 * Queries the `testimonials` collection where isDistributed == true and status == 'active'.
 */
async function fetchDistributedReviews(sourceFilter, limit = 5) {
  try {
    // Use Firestore's structured query via REST (runQuery endpoint)
    const queryUrl = `${FIRESTORE_BASE}:runQuery`;

    // Build composite filter conditions
    const filters = [
      {
        fieldFilter: {
          field: { fieldPath: 'isDistributed' },
          op: 'EQUAL',
          value: { booleanValue: true },
        },
      },
      {
        fieldFilter: {
          field: { fieldPath: 'status' },
          op: 'EQUAL',
          value: { stringValue: 'active' },
        },
      },
    ];

    // Add source filter if specified
    if (sourceFilter) {
      filters.push({
        fieldFilter: {
          field: { fieldPath: 'source' },
          op: 'EQUAL',
          value: { stringValue: sourceFilter },
        },
      });
    }

    const body = {
      structuredQuery: {
        from: [{ collectionId: 'testimonials' }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters,
          },
        },
        limit: limit,
      },
    };

    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Firestore query failed: ${response.status}`);
    }

    const results = await response.json();

    // Parse Firestore documents into clean review objects
    const reviews = results
      .filter(r => r.document) // skip empty results
      .map(r => {
        const fields = r.document.fields;
        const docPath = r.document.name;
        const docId = docPath.split('/').pop();

        return {
          id: docId,
          author:  fields.author?.stringValue    || 'Anonymous',
          role:    fields.role?.stringValue       || '',
          content: fields.content?.stringValue    || '',
          rating:  fields.rating?.doubleValue ?? fields.rating?.integerValue ?? 5,
          source:  fields.source?.stringValue     || '',
          date:    fields.date?.stringValue       || '',
        };
      });

    // If Firestore returned nothing, fall back to static JSON
    if (reviews.length === 0) {
      return await fetchStaticFallback(sourceFilter, limit);
    }

    return reviews;
  } catch (error) {
    console.warn('[ProofLayer API] Reviews query failed, using static fallback:', error.message);
    return await fetchStaticFallback(sourceFilter, limit);
  }
}

/**
 * Fallback: Read from the static public/api/reviews.json file.
 */
async function fetchStaticFallback(sourceFilter, limit = 5) {
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const filePath = path.resolve(process.cwd(), 'public/api/reviews.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    let reviews = JSON.parse(raw);

    if (sourceFilter) {
      reviews = reviews.filter(r => r.source?.toLowerCase() === sourceFilter.toLowerCase());
    }

    return reviews.slice(0, limit);
  } catch {
    return [];
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), proofLayerApiPlugin()],
  server: {
    cors: true,
    proxy: {
      '/api/scrape': {
        target: 'https://api.scrape.do',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/scrape/, '')
      }
    }
  }
})
