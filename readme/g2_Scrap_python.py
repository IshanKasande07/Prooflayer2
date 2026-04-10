

import requests
from bs4 import BeautifulSoup
import re
import json

# ==============================
# CONFIG (Same as n8n)
# ==============================

SCRAPEDO_TOKEN = "40ed158f960244e1955bf94c8f9ce6a27ceb2b8cd3f"
BASE_URL = "https://www.g2.com/sellers/druva?survey_responses_page="
MAX_PAGES = 5

SCRAPEDO_ENDPOINT = "https://api.scrape.do"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}


# ==============================
# Convert stars-X → rating/2
# ==============================

def convert_rating(class_string):
    match = re.search(r"stars-(\d+)", class_string)
    if match:
        return int(match.group(1)) / 2
    return None


# ==============================
# Call Scrape.do (Same as n8n HTTP Node)
# ==============================

def fetch_with_scrapedo(page_url):
    params = {
        "token": SCRAPEDO_TOKEN,
        "url": page_url,
        "render": "true",
        "geoCode": "us",
        "super": "true"
    }

    print(f"Calling Scrape.do → {page_url}")

    response = requests.get(
        SCRAPEDO_ENDPOINT,
        params=params,
        headers=HEADERS,
        timeout=180
    )

    return response.text


# ==============================
# Main Scraper (Same Flow As n8n)
# ==============================

def scrape_g2():
    all_reviews = []

    # 1️⃣ Generate Page URLs (like your Code node)
    for page in range(1, MAX_PAGES + 1):

        page_url = f"{BASE_URL}{page}"

        # 2️⃣ HTTP Request via Scrape.do
        html = fetch_with_scrapedo(page_url)

        soup = BeautifulSoup(html, "html.parser")

        # 3️⃣ Extract Review Blocks
        review_blocks = soup.select("#reviews-result .elv-border")

        # 4️⃣ Loop Over Reviews
        for block in review_blocks:

            # Extract Fields (same selectors as n8n HTML2)

            name_tag = block.select_one("h5.elv-font-semibold")
            title_tag = block.select_one("h4 a")
            desc_tag = block.select_one("div.elv-my-4")
            rating_tag = block.select_one("div.stars")
            date_tag = block.select_one("div.elv-flex.elv-justify-between > span")

            name = name_tag.get_text(strip=True) if name_tag else ""
            title = title_tag.get_text(strip=True) if title_tag else ""
            description = desc_tag.get_text(" ", strip=True) if desc_tag else ""
            review_date = date_tag.get_text(strip=True) if date_tag else ""

            rating_class = ""
            if rating_tag:
                rating_class = " ".join(rating_tag.get("class", []))

            rating = convert_rating(rating_class)

            # Avoid empty broken blocks
            if name or title:
                all_reviews.append({
                    "name": name,
                    "title": title,
                    "description": description,
                    "rating": rating,
                    "review_date": review_date
                })

    return {"reviews": all_reviews}


# ==============================
# Run
# ==============================

if __name__ == "__main__":
    import csv
    import os

    print("🚀 Starting G2 Scraper...")
    data = scrape_g2()
    
    reviews = data.get("reviews", [])
    
    if reviews:
        filename = "g2_reviews.csv"
        # Define CSV headers
        fieldnames = ["name", "title", "description", "rating", "review_date"]
        
        try:
            with open(filename, mode="w", newline="", encoding="utf-8") as file:
                writer = csv.DictWriter(file, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(reviews)
            
            print(f"\n✅ Success! Scraped {len(reviews)} reviews.")
            print(f"📁 Data saved to: {os.path.abspath(filename)}")
            print("\n👉 Now go to ProofLayer Dashboard -> Import -> Upload Spreadsheet and upload this file!")
        except Exception as e:
            print(f"\n❌ Error saving CSV: {e}")
    else:
        print("\n⚠️ No reviews found. Check your token or URL.")

