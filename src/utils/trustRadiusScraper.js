
const SCRAPEDO_TOKEN = "550e4ddb55b94844a55810dfb2717d4e1d6a5865a95";
const SCRAPEDO_ENDPOINT = "https://api.scrape.do";
const MAX_PAGES = 3;

/**
 * Fetches HTML from Scrape.do
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
    if (!response.ok) {
        throw new Error(`Scrape.do failed with status: ${response.status}`);
    }
    return await response.text();
};

/**
 * Scraper for TrustRadius reviews
 * @param {string} baseUrl - The TrustRadius product URL
 * @param {function} onProgress - Callback to update progress (optional)
 */
export const scrapeTrustRadiusReviews = async (baseUrl, onProgress) => {
    let allReviews = [];
    
    const separator = baseUrl.includes('?') ? '&' : '?';
    const pagingBase = `${baseUrl}${separator}page=`;

    for (let page = 1; page <= MAX_PAGES; page++) {
        const pageUrl = `${pagingBase}${page}`;
        
        if (onProgress) onProgress(`Scraping TrustRadius page ${page} of ${MAX_PAGES}...`);
        
        try {
            const html = await fetchWithScrapeDo(pageUrl);
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            
            // Try multiple container selectors
            let reviewBlocks = Array.from(doc.querySelectorAll('article[class*="Review_review"]'));
            if (reviewBlocks.length === 0) {
                reviewBlocks = Array.from(doc.querySelectorAll('[data-testid="review-card"]'));
            }
            if (reviewBlocks.length === 0) {
                reviewBlocks = Array.from(doc.querySelectorAll('.review-card'));
            }
            
            if (reviewBlocks.length === 0) {
                console.warn(`No TrustRadius reviews found on page ${page}. URL: ${pageUrl}`);
                break; 
            }

            reviewBlocks.forEach(block => {
                let titleTag = block.querySelector('h2[class*="Header_heading"] a') || block.querySelector('.review-title');
                let nameTag = block.querySelector('[data-testid="byline"] div[class*="_name_"]') || block.querySelector('.reviewer-name');
                let roleTag = block.querySelector('[data-testid="byline"] div[class*="_job_"]') || block.querySelector('.reviewer-job-title');
                let dateTag = block.querySelector('time[class*="Header_date"]') || block.querySelector('.review-date');
                let ratingTag = block.querySelector('[data-testid="stars-container"]');
                
                // Content extraction (TrustRadius specific "Use Cases" logic)
                let content = "";
                const headers = block.querySelectorAll('h3');
                for (const h3 of headers) {
                    if (h3.textContent.includes("Use Cases") || h3.textContent.includes("What do you like")) {
                        const nextP = h3.nextElementSibling;
                        if (nextP && (nextP.tagName === 'P' || nextP.tagName === 'DIV')) {
                            content = nextP.textContent.trim();
                            break;
                        }
                    }
                }

                // Fallback for content
                if (!content) {
                    const fallbackContent = block.querySelector('p[class*="Review_description"]') || block.querySelector('.review-body') || block.querySelector('.formatted-text');
                    if (fallbackContent) content = fallbackContent.textContent.trim();
                }

                const name = nameTag ? nameTag.textContent.trim() : "TrustRadius User";
                const title = titleTag ? titleTag.textContent.trim() : "";
                const role = roleTag ? roleTag.textContent.trim() : "";
                const date = dateTag ? (dateTag.getAttribute('datetime') || dateTag.textContent.trim()) : new Date().toISOString();
                
                let rating = 0;
                if (ratingTag) {
                    rating = parseFloat(ratingTag.getAttribute('data-rating')) || 0;
                }

                // Avatar extraction
                const imgTag = block.querySelector("img");
                let avatarUrl = "";
                if (imgTag) {
                    avatarUrl = imgTag.getAttribute('data-src') || imgTag.getAttribute('src') || "";
                    if (avatarUrl.includes('spacer') || avatarUrl.includes('data:image')) {
                        avatarUrl = "";
                    }
                }

                if (name || title || content) {
                    allReviews.push({
                        author: name,         
                        role: role || title,          
                        content: content, 
                        rating: rating,
                        source: 'TrustRadius',
                        date: date,
                        avatar: avatarUrl,
                        importedAt: new Date().toISOString()
                    });
                }
            });

        } catch (error) {
            console.error(`Error scraping TrustRadius page ${page}:`, error);
        }
    }

    return allReviews;
};

export default scrapeTrustRadiusReviews;
