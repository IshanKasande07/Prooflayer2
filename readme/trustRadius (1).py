#pip install requests beautifulsoup4

import requests
from bs4 import BeautifulSoup
import json

SCRAPED_REVIEWS = []

# ----------------------------
# 1. Generate Page URLs
# ----------------------------
BASE_URL = "https://www.trustradius.com/products/druva-cloud-platform/reviews/all"
MAX_PAGES = 4

page_urls = [f"{BASE_URL}?page={i}" for i in range(1, MAX_PAGES + 1)]

# ----------------------------
# 2. Scrape.do Request
# ----------------------------
SCRAPEDO_TOKEN = "63cd0b2b4a0a40ef81c9a3d6f1d041d3c048fc35f09"

def fetch_page(url):
    """Fetch an HTML page through Scrape.do"""
    api_url = "https://api.scrape.do"
    params = {
        "url": url,
        "render": "true",
        "geoCode": "us",
        "super": "true",
        "token": SCRAPEDO_TOKEN
    }

    response = requests.get(api_url, params=params, timeout=180)
    response.raise_for_status()
    return response.text


# ----------------------------
# 3. Extract review blocks
# ----------------------------
def extract_review_blocks(html_text):
    soup = BeautifulSoup(html_text, "lxml")
    # Same selector as n8n: article[class*="Review_review"]
    return soup.select('article[class*="Review_review"]')


# ----------------------------
# 4. Extract individual fields
# ----------------------------
def safe_select(soup, selector, attr=None):
    """Helper function to avoid errors"""
    try:
        element = soup.select_one(selector)
        if not element:
            return ""
        if attr:
            return element.get(attr, "").strip()
        return element.get_text(strip=True)
    except:
        return ""


def extract_review_data(html_block):
    soup = BeautifulSoup(html_block, "lxml")

    return {
        "review_title": safe_select(soup, 'h2[class*="Header_heading"] a'),
        "reviewer_name": safe_select(soup, '[data-testid="byline"] div[class*="_name_"]'),
        "reviewer_details": safe_select(soup, '[data-testid="byline"] div[class*="_job_"]'),
        "review_date": safe_select(soup, 'time[class*="Header_date"]'),

        # Rating is stored in: <div data-rating="9" data-testid="stars-container">
        "rating": safe_select(soup, '[data-testid="stars-container"]', attr="data-rating"),

        # Extract the first paragraph after "Use Cases"
        "overall_experience": safe_select(soup, 'h3:contains("Use Cases") + p'),
    }


# ----------------------------
# 5. Main scraping loop
# ----------------------------
for url in page_urls:
    #print(f"Scraping: {url}")
    html = fetch_page(url)

    review_cards = extract_review_blocks(html)

    for card in review_cards:
        review_html = str(card)
        review_data = extract_review_data(review_html)
        SCRAPED_REVIEWS.append(review_data)


# ----------------------------
# 6. Output JSON
# ----------------------------
print(json.dumps(SCRAPED_REVIEWS, indent=4, ensure_ascii=False))