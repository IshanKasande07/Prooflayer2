
const SCRAPEDO_TOKEN = "67696a8b2e184a81a5141666ae1a9404d70e9e5aa79";
const SCRAPEDO_ENDPOINT = "https://api.scrape.do";
const MAX_PAGES = 2;

/**
 * Converts a class string like "stars-9" to a rating number (4.5)
*/
const convertRating = (classString) => {
    if (!classString) return 0;
    const match = classString.match(/stars-(\d+)/);
    if (match) {
        return parseInt(match[1]) / 2;
    }
    return 0;
};

/**
 * Detects whether a Scrapedo response indicates an API limit / auth failure.
 * Scrapedo returns 429 for rate limits, 402 for quota exceeded, 401 for bad token.
 * It can also return 200 with a JSON error body like { "message": "Usage limit exceeded" }.
 */
const detectScrapedoError = async (response) => {
    const status = response.status;

    // Hard HTTP error codes
    if (status === 429) {
        console.error('[Scrapedo] ❌ API rate limit reached (HTTP 429 – Too Many Requests). Slow down or upgrade your plan.');
        throw Object.assign(new Error('Scrapedo API rate limit reached.'), { code: 'SCRAPEDO_RATE_LIMIT' });
    }
    if (status === 402) {
        console.error('[Scrapedo] ❌ API usage quota exceeded (HTTP 402 – Payment Required). Your monthly/daily credits are used up.');
        throw Object.assign(new Error('Scrapedo API quota exceeded.'), { code: 'SCRAPEDO_QUOTA_EXCEEDED' });
    }
    if (status === 401) {
        console.error('[Scrapedo] ❌ API token invalid or expired (HTTP 401 – Unauthorized). Check your SCRAPEDO_TOKEN.');
        throw Object.assign(new Error('Scrapedo API token invalid.'), { code: 'SCRAPEDO_AUTH_FAILED' });
    }
    if (!response.ok) {
        console.error(`[Scrapedo] ❌ Unexpected error (HTTP ${status}).`);
        throw new Error(`Scrape.do failed with status: ${status}`);
    }

    // Scrapedo sometimes returns 200 with a JSON error body
    const text = await response.text();
    try {
        const json = JSON.parse(text);
        const msg = (json?.message || json?.error || '').toLowerCase();
        if (msg.includes('limit') || msg.includes('quota') || msg.includes('exceeded') || msg.includes('credit')) {
            console.error(`[Scrapedo] ❌ API limit reached (JSON body): ${json.message || json.error}`);
            throw Object.assign(new Error('Scrapedo API limit reached.'), { code: 'SCRAPEDO_QUOTA_EXCEEDED' });
        }
        if (msg.includes('unauthorized') || msg.includes('invalid token') || msg.includes('forbidden')) {
            console.error(`[Scrapedo] ❌ API auth error (JSON body): ${json.message || json.error}`);
            throw Object.assign(new Error('Scrapedo API auth error.'), { code: 'SCRAPEDO_AUTH_FAILED' });
        }
    } catch (parseErr) {
        if (parseErr.code) throw parseErr; // re-throw typed errors
        // Not JSON — that's fine, it's the HTML we want
    }
    return text;
};

/**
 * Fetches HTML from Scrape.do with API limit detection
 */
const fetchWithScrapeDo = async (targetUrl) => {
    const params = new URLSearchParams({
        token: SCRAPEDO_TOKEN,
        url: targetUrl,
        render: "true",
        geoCode: "us",
        super: "true"
    });

    const response = await fetch(`${SCRAPEDO_ENDPOINT}?${params.toString()}`);
    return await detectScrapedoError(response);
};

/**
 * Main scraper function
 * @param {string} baseUrl - The G2 product URL (e.g., "https://www.g2.com/products/druva/reviews")
 * @param {function} onProgress - Callback to update progress (optional)
 */
export const scrapeG2Reviews = async (baseUrl, onProgress) => {
    let allReviews = [];

    // Ensure URL has query param key if needed, or handle pagination manually
    // The python script appended "?survey_responses_page={page}"
    // We need to support base URLs that might or might not have query params.

    // Strictly follow Python script pagination: BASE_URL + page
    // The Python script used "?survey_responses_page=" 
    // 1. Determine paging parameter (Product pages use ?page, Sellers use ?survey_responses_page)
    const separator = baseUrl.includes('?') ? '&' : '?';
    let pagingParam = 'page'; // default for products
    if (baseUrl.includes('/sellers/') || baseUrl.includes('survey_responses_page')) {
        pagingParam = 'survey_responses_page';
    }
    const pagingBase = `${baseUrl}${separator}${pagingParam}=`;

    for (let page = 1; page <= MAX_PAGES; page++) {
        const pageUrl = `${pagingBase}${page}`;

        if (onProgress) onProgress(`Scraping G2 page ${page} of ${MAX_PAGES}...`);

        try {
            const html = await fetchWithScrapeDo(pageUrl);
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            // 2. Try multiple container selectors
            // Selector A: Seller pages (from your Python script)
            let reviewBlocks = Array.from(doc.querySelectorAll("#reviews-result .elv-border"));

            // Selector B: Product pages (itemprop is the standard now)
            if (reviewBlocks.length === 0) {
                reviewBlocks = Array.from(doc.querySelectorAll("div[itemprop='review']"));
            }

            // Selector C: Modern Product cards
            if (reviewBlocks.length === 0) {
                reviewBlocks = Array.from(doc.querySelectorAll(".paper.paper--white.paper--wheel"));
            }

            if (reviewBlocks.length === 0) {
                console.warn(`No G2 reviews found on page ${page}. URL: ${pageUrl}`);
                break;
            }

            reviewBlocks.forEach(block => {
                // Try Seller-page selectors (Python)
                let nameTag = block.querySelector("h5.elv-font-semibold");
                let titleTag = block.querySelector("h4 a");
                let descTag = block.querySelector("div.elv-my-4");
                let ratingTag = block.querySelector("div.stars");
                let dateTag = block.querySelector("div.elv-flex.elv-justify-between > span");

                // If not found, try Product-page selectors (itemprop)
                if (!nameTag) nameTag = block.querySelector("[itemprop='author']") || block.querySelector(".customer-info__author-name");
                if (!titleTag) titleTag = block.querySelector("[itemprop='name']") || block.querySelector(".review-list-item__title");
                if (!descTag) descTag = block.querySelector("[itemprop='reviewBody']") || block.querySelector(".review-list-item__body") || block.querySelector(".formatted-text");
                if (!dateTag) dateTag = block.querySelector("[itemprop='datePublished']") || block.querySelector(".review-list-item__date");
                if (!ratingTag) ratingTag = block.querySelector("[itemprop='reviewRating'] meta[itemprop='ratingValue']");

                const name = nameTag ? nameTag.textContent.trim() : "G2 User";
                const title = titleTag ? titleTag.textContent.trim() : "";
                const description = descTag ? descTag.textContent.trim() : "";
                let date = dateTag ? (dateTag.getAttribute('datetime') || dateTag.textContent.trim()) : new Date().toISOString();

                let rating = 0;
                if (ratingTag) {
                    if (ratingTag.tagName === 'META') {
                        rating = parseFloat(ratingTag.getAttribute('content'));
                    } else {
                        rating = convertRating(ratingTag.className);
                    }
                }

                // Avatar extraction (extra benefit for JS version)
                const imgTag = block.querySelector("img");
                let avatarUrl = "";
                if (imgTag) {
                    const possibleUrl = imgTag.getAttribute('data-src') || imgTag.getAttribute('src');
                    if (possibleUrl && !possibleUrl.includes('spacer')) {
                        avatarUrl = possibleUrl;
                    }
                }

                if (name || title || description) {
                    allReviews.push({
                        author: name,
                        role: title,
                        content: description,
                        rating: rating,
                        source: 'G2',
                        date: date,
                        avatar: avatarUrl,
                        importedAt: new Date().toISOString()
                    });
                }
            });

        } catch (error) {
            if (error.code === 'SCRAPEDO_RATE_LIMIT' || error.code === 'SCRAPEDO_QUOTA_EXCEEDED' || error.code === 'SCRAPEDO_AUTH_FAILED') {
                // Bubble up — no point retrying other pages
                throw error;
            }
            console.error(`Error scraping G2 page ${page}:`, error);
        }
    }

    return allReviews;
};

export default scrapeG2Reviews;
