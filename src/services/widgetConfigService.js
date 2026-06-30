import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';

/**
 * Widget Configuration Service
 * 
 * Handles saving and loading widget display settings for the distribution layer.
 * Configs are stored in the `widgetConfigs` collection, keyed by project token.
 * These configs are publicly readable so pixel.js can fetch them from any domain.
 */

// Default widget configuration — used when no config exists yet
export const DEFAULT_WIDGET_CONFIG = {
  template: 'slider',    // slider | grid | popup | badge
  theme: 'glass',        // light | dark | glass | glowing
  limit: 5,              // 1-10
  position: 'bottom-right', // bottom-right | bottom-left | top-right | top-left (popup only)
  interval: 6000,        // popup rotation interval in ms
  sourceFilter: '',      // '' (all) | 'G2' | 'Capterra' | 'TrustRadius'
  alignment: 'center',   // left | center | right
  offsetX: 0,            // horizontal nudge in px
  offsetY: 0,            // vertical nudge in px
};

/**
 * Generate a deterministic token from a project ID.
 * @param {string} projectId - The Firestore document ID of the project
 * @returns {string} Token string like "pl_proj_abc123"
 */
export const generateToken = (projectId) => {
  if (!projectId) return 'pl_proj_demo';
  return `pl_proj_${projectId}`;
};

/**
 * Save widget configuration to Firestore.
 * Creates or overwrites the config document for the given token.
 * 
 * @param {string} token - The project token (document ID in widgetConfigs)
 * @param {Object} config - The widget config object (template, theme, limit, etc.)
 * @param {string} projectId - The originating project ID
 * @returns {Promise<boolean>} true on success
 */
export const saveWidgetConfig = async (token, config, projectId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to save widget config.');
    }

    const docRef = doc(db, 'widgetConfigs', token);
    await setDoc(docRef, {
      token,
      projectId: projectId || '',
      createdBy: user.uid,
      updatedAt: serverTimestamp(),
      config: {
        ...DEFAULT_WIDGET_CONFIG,
        ...config,
      },
    }, { merge: true });

    console.log(`Widget config saved for token: ${token}`);
    return true;
  } catch (error) {
    console.error('Failed to save widget config:', error);
    throw error;
  }
};

/**
 * Load widget configuration from Firestore.
 * Returns the saved config or defaults if none exists.
 * 
 * @param {string} token - The project token (document ID in widgetConfigs)
 * @returns {Promise<{config: Object, exists: boolean}>}
 */
export const getWidgetConfig = async (token) => {
  try {
    const docRef = doc(db, 'widgetConfigs', token);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        config: { ...DEFAULT_WIDGET_CONFIG, ...data.config },
        exists: true,
        updatedAt: data.updatedAt,
      };
    }

    return {
      config: { ...DEFAULT_WIDGET_CONFIG },
      exists: false,
      updatedAt: null,
    };
  } catch (error) {
    console.warn('Failed to load widget config, using defaults:', error);
    return {
      config: { ...DEFAULT_WIDGET_CONFIG },
      exists: false,
      updatedAt: null,
    };
  }
};
