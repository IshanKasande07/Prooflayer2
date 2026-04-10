
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
 * Scraper for Capterra reviews
 * @param {string} baseUrl - The Capterra product URL
 * @param {function} onProgress - Callback to update progress (optional)
 */
export const scrapeCapterraReviews = async (baseUrl, onProgress) => {
    let allReviews = [];
    
    // Standard pagination for Capterra is usually ?page=X
    const separator = baseUrl.includes('?') ? '&' : '?';
    const pagingBase = `${baseUrl}${separator}page=`;

    for (let page = 1; page <= MAX_PAGES; page++) {
        const pageUrl = `${pagingBase}${page}`;
        
        if (onProgress) onProgress(`Scraping Capterra page ${page} of ${MAX_PAGES}...`);
        
        try {
            const html = await fetchWithScrapeDo(pageUrl);
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            
            // Try multiple container selectors for robustness
            let reviewBlocks = Array.from(doc.querySelectorAll(".review-card"));
            if (reviewBlocks.length === 0) {
                reviewBlocks = Array.from(doc.querySelectorAll("div[class*='ReviewCard']"));
            }
            if (reviewBlocks.length === 0) {
                reviewBlocks = Array.from(doc.querySelectorAll("article"));
            }
            
            if (reviewBlocks.length === 0) {
                console.warn(`No Capterra reviews found on page ${page}. URL: ${pageUrl}`);
                break; 
            }

            reviewBlocks.forEach(block => {
                let titleTag = block.querySelector("h3.fs-3") || block.querySelector(".review-card__title");
                let nameTag = block.querySelector("div.fw-600") || block.querySelector("[data-test-id='reviewer-name']");
                let roleTag = block.querySelector("div.fs-4.text-neutral-90") || block.querySelector(".review-card__author-job-title");
                let dateTag = block.querySelector("div.fs-5") || block.querySelector(".review-card__review-date");
                let ratingTag = block.querySelector("span.star-rating-component span.ms-1") || block.querySelector("[data-test-id='review-rating']");
                let contentTag = block.querySelector("div.fs-4.lh-2") || block.querySelector(".review-card__review-body") || block.querySelector(".formatted-text");

                const name = nameTag ? nameTag.textContent.trim() : "Capterra User";
                const title = titleTag ? titleTag.textContent.trim() : "";
                const role = roleTag ? roleTag.textContent.trim() : "";
                const description = contentTag ? contentTag.textContent.trim() : "";
                const date = dateTag ? dateTag.textContent.trim() : new Date().toISOString();
                
                let rating = 0;
                if (ratingTag) {
                    const ratingText = ratingTag.textContent.trim().split('/')[0];
                    rating = parseFloat(ratingText) || 0;
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

                if (name || title || description) {
                    allReviews.push({
                        author: name,         
                        role: role || title,          
                        content: description, 
                        rating: rating,
                        source: 'Capterra',
                        date: date,
                        avatar: avatarUrl,
                        importedAt: new Date().toISOString()
                    });
                }
            });

        } catch (error) {
            console.error(`Error scraping Capterra page ${page}:`, error);
        }
    }

    return allReviews;
};

export default scrapeCapterraReviews;
