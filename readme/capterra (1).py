#pip install requests beautifulsoup4

import requests
from bs4 import BeautifulSoup

SCRAPED_REVIEWS = []

# ----------------------------
# 1. Generate Page URLs
# ----------------------------
BASE_URL = "https://www.capterra.in/software/179251/paypal"
MAX_PAGES = 4

page_urls = [f"{BASE_URL}?page={i}" for i in range(1, MAX_PAGES + 1)]

# ----------------------------
# 2. Scrape.do Configuration
# ----------------------------
SCRAPEDO_TOKEN = "63cd0b2b4a0a40ef81c9a3d6f1d041d3c048fc35f09"

def fetch_page(url):
    """Fetch a page using Scrape.do"""
    api_url = "https://api.scrape.do"
    params = {
        "url": url,
        "render": "true",
        "geoCode": "us",
        "super": "true",
        "token": SCRAPEDO_TOKEN,
    }

    response = requests.get(api_url, params=params, timeout=180)
    response.raise_for_status()
    return response.text


# ----------------------------
# 3. Parse Review Cards
# ----------------------------
def extract_review_blocks(html_text):
    soup = BeautifulSoup(html_text, "html.parser")
    return soup.select(".review-card")  # same as n8n selector


# ----------------------------
# 4. Extract individual fields
# ----------------------------
def extract_review_data(card):
    soup = BeautifulSoup(card, "html.parser")

    def safe_select(selector, attr=None):
        element = soup.select_one(selector)
        if element:
            return element.get(attr).strip() if attr else element.get_text(strip=True)
        return ""

    return {
        "review_title": safe_select("h3.fs-3"),
        "reviewer_name": safe_select("div.fw-600"),
        "reviewer_details": safe_select("div.fs-4.text-neutral-90"),
        "review_date": safe_select("div.fs-5"),
        "rating": safe_select("span.star-rating-component span.ms-1"),
        "overall_experience": safe_select("div.fs-4.lh-2"),
    }


# ----------------------------
# 5. Main Loop
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
# 6. Show Results
# ----------------------------
import json
print(json.dumps(SCRAPED_REVIEWS, indent=4))