const SCRAPEDO_TOKEN = "67696a8b2e184a81a5141666ae1a9404d70e9e5aa79";
const SCRAPEDO_ENDPOINT = "/api/scrape";
const MAX_PAGES = 2;

/**
 * Detects whether a Scrapedo response indicates an API limit / auth failure.
 */
const detectScrapedoError = async (response) => {
    const status = response.status;
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
        console.error([Scrapedo] ❌ Unexpected error(HTTP ${ status }).);
        throw new Error(Scrape.do failed with status: ${ status });
    }
    const text = await response.text();
    try {
        const json = JSON.parse(text);
        const msg = (json?.message || json?.error || '').toLowerCase();
        if (msg.includes('limit') || msg.includes('quota') || msg.includes('exceeded') || msg.includes('credit')) {
            console.error([Scrapedo] ❌ API limit reached(JSON body): ${ json.message || json.error });
            throw Object.assign(new Error('Scrapedo API limit reached.'), { code: 'SCRAPEDO_QUOTA_EXCEEDED' });
        }
        if (msg.includes('unauthorized') || msg.includes('invalid token') || msg.includes('forbidden')) {
            console.error([Scrapedo] ❌ API auth error(JSON body): ${ json.message || json.error });
            throw Object.assign(new Error('Scrapedo API auth error.'), { code: 'SCRAPEDO_AUTH_FAILED' });
        }
    } catch (parseErr) {
        if (parseErr.code) throw parseErr;
    }
    return text;
};

/**
 * Fetches HTML from Scrape.do with API limit detection
 */
const fetchWithScrapeDo = async (targetUrl, signal) => {
    const params = new URLSearchParams({
        token: SCRAPEDO_TOKEN,
        url: targetUrl,
        render: "true",
        geoCode: "us",
        super: "true",
        playgroundV2: "true"
    });

    // Add signal to fetch options for aborting
    const fetchOptions = signal ? { signal } : {};
    const response = await fetch(${ SCRAPEDO_ENDPOINT } ? ${ params.toString() }, fetchOptions);
    return await detectScrapedoError(response);
};

/**
 * Scraper for Capterra reviews
 * @param {string} baseUrl - The Capterra product URL
 * @param {function} onProgress - Callback to update progress (optional)
 * @param {AbortSignal} signal - Signal to abort the fetch
 */
export const scrapeCapterraReviews = async (baseUrl, onProgress, signal) => {
    let allReviews = [];

    // Standard pagination for Capterra is usually ?page=X
    const cleanBaseUrl = baseUrl.split('#')[0];
    const separator = cleanBaseUrl.includes('?') ? '&' : '?';
    const pagingBase = ${ cleanBaseUrl }${ separator }page =;

    for (let page = 1; page <= MAX_PAGES; page++) {
        // If aborted before we even start a page
        if (signal && signal.aborted) {
            console.log("Capterra scraping aborted by user.");
            break;
        }

        const pageUrl = ${ pagingBase }${ page };

        if (onProgress) onProgress(Scraping Capterra page ${ page } of ${ MAX_PAGES }...);

        try {
            const html = await fetchWithScrapeDo(pageUrl, signal);
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            // Try multiple container selectors for robustness
            let reviewBlocks = Array.from(doc.querySelectorAll("[data-testid='review-card']"));
            if (reviewBlocks.length === 0) {
                reviewBlocks = Array.from(doc.querySelectorAll("[data-test-id='review-card']"));
            }
            if (reviewBlocks.length === 0) {
                reviewBlocks = Array.from(doc.querySelectorAll(".review-card"));
            }
            if (reviewBlocks.length === 0) {
                reviewBlocks = Array.from(doc.querySelectorAll("div[class*='ReviewCard']"));
            }
            if (reviewBlocks.length === 0) {
                reviewBlocks = Array.from(doc.querySelectorAll("article"));
            }
            if (reviewBlocks.length === 0) {
                // New DOM structure fallback
                reviewBlocks = Array.from(doc.querySelectorAll(".bg-card.shadow-elevation-2.p-6"));
            }

            if (reviewBlocks.length === 0) {
                console.warn(No Capterra reviews found on page ${ page }.URL: ${ pageUrl });
                break;
            }

            reviewBlocks.forEach(block => {
                let titleTag = block.querySelector("h3.fs-3") || block.querySelector(".review-card__title") || block.querySelector("h3");
                let nameTag = block.querySelector("div.fw-600") || block.querySelector("[data-test-id='reviewer-name']") || block.querySelector("[data-testid='reviewer-name']");
                let roleTag = block.querySelector("div.fs-4.text-neutral-90") || block.querySelector(".review-card__author-job-title") || block.querySelector("[data-test-id='reviewer-job-title']") || block.querySelector("[data-testid='reviewer-job-title']") || block.querySelector("[data-test-id='reviewer-role']") || block.querySelector("[data-testid='reviewer-role']");
                let dateTag = block.querySelector("div.fs-5") || block.querySelector(".review-card__review-date") || block.querySelector("[data-test-id='review-date']") || block.querySelector("[data-testid='review-date']");
                let ratingTag = block.querySelector("span.star-rating-component span.ms-1") || block.querySelector("[data-test-id='review-rating']") || block.querySelector("[data-testid='review-rating']") || block.querySelector("[data-test-id='rating']") || block.querySelector("[data-testid='rating']");
                let contentTag = block.querySelector("div.fs-4.lh-2") || block.querySelector(".review-card__review-body") || block.querySelector(".formatted-text") || block.querySelector("[data-test-id='review-text']") || block.querySelector("[data-testid='review-text']");

                // Check for new DOM structure tags if old ones aren't found
                if (!nameTag) nameTag = block.querySelector("p.text-typo-30.font-semibold") || block.querySelector(".reviewer-name");
                if (!roleTag) {
                    const roles = Array.from(block.querySelectorAll("p.text-typo-10.text-neutral-80"));
                    if (roles.length > 0) roleTag = { textContent: roles.map(r => r.textContent.trim()).filter(Boolean).join(" - ") };
                }
                if (!dateTag) dateTag = block.querySelector("p.text-typo-0.text-neutral-90");

                if (!contentTag) {
                    const mainContent = block.querySelector("div.mb-4 > p.text-typo-10.text-neutral-99") || block.querySelector(".review-body");
                    const prosCons = block.querySelectorAll(".space-y-4.mb-4 > div");
                    let combinedContent = "";
                    if (mainContent) combinedContent += mainContent.textContent.trim() + "\n\n";

                    prosCons.forEach(pc => {
                        const label = pc.querySelector("span.font-semibold");
                        const val = pc.querySelector("p.text-typo-20");
                        if (label && val) {
                            combinedContent += ${ label.textContent.trim() }: ${ val.textContent.trim() } \n;
                        }
                    });

                    if (combinedContent) {
                        contentTag = { textContent: combinedContent.trim() };
                    }
                }

                if (!ratingTag) {
                    const ratingSpan = Array.from(block.querySelectorAll("span.font-bold")).find(span => /^\d(\.\d)?$/.test(span.textContent.trim()));
                    if (ratingSpan) {
                        ratingTag = ratingSpan;
                    }
                }

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
            if (error.name === 'AbortError') {
                console.log('Capterra scraping aborted.');
                break;
            }
            if (error.code === 'SCRAPEDO_RATE_LIMIT' || error.code === 'SCRAPEDO_QUOTA_EXCEEDED' || error.code === 'SCRAPEDO_AUTH_FAILED') {
                throw error;
            }
            console.error(Error scraping Capterra page ${ page }:, error);
        }
    }

    return allReviews;
};

export default scrapeCapterraReviews;