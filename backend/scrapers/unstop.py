from .base import BaseScraper
import requests
from datetime import datetime
import time
import random

class UnstopScraper(BaseScraper):
    def __init__(self):
        super().__init__()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        }

    def scrape_hackathons(self):
        # Unstop API
        url = "https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page=20&oppstatus=open"
        print(f"Scraping Unstop Hackathons: {url}")
        
        try:
            response = requests.get(url, headers=self.headers)
            if response.status_code != 200:
                print(f"Failed to fetch Unstop: {response.status_code}")
                return

            data = response.json()
            if 'data' not in data or 'data' not in data['data']:
                print("Unstop: Unexpected structure")
                return

            items = data['data']['data']
            print(f"Found {len(items)} Unstop opportunities.")

            for item in items:
                try:
                    title = item.get('title')
                    if not title: continue
                    
                    organizer = item.get('organisation', {}).get('name', 'Unstop')
                    
                    # Location
                    # Unstop items usually have region/city
                    # or 'filters' -> 'locations'
                    location = "Online" # Default
                    if item.get('region'):
                         location = item.get('region')
                    
                    # Dates
                    start_date = item.get('start_date', '')
                    end_date = item.get('end_date', '')
                    dates = f"{start_date[:10]} - {end_date[:10]}"
                    
                    # Logo
                    logo = item.get('logoUrl2', '')
                    
                    # URL
                    slug = item.get('slug', '')
                    item_url = f"https://unstop.com/{slug}" if slug else "https://unstop.com"

                    # Tags
                    tags = ["Hackathon", "Unstop"]
                    if item.get('is_paid'): tags.append("Paid")
                    else: tags.append("Free")
                    
                    filters = item.get('filters', [])
                    for f in filters:
                        tags.append(f.get('name', ''))

                    hackathon_data = {
                        "name": title,
                        "organizer": organizer,
                        "description": item.get('seo_description', 'Hackathon on Unstop'),
                        "dates": dates,
                        "location": location,
                        "url": item_url,
                        "source": "Unstop",
                        "tags": tags[:5], # Limit tags
                        "prizes": "See Details"
                    }
                    
                    print(f"Found: {title} by {organizer}")
                    self.save_hackathon(hackathon_data)

                except Exception as e:
                    print(f"Error parsing Unstop item: {e}")

        except Exception as e:
            print(f"Error scraping Unstop: {e}")

    def scrape_jobs(self):
        # Unstop API for Jobs
        url = "https://unstop.com/api/public/opportunity/search-result?opportunity=jobs&per_page=20&oppstatus=open"
        print(f"Scraping Unstop Jobs: {url}")
        
        try:
            response = requests.get(url, headers=self.headers)
            if response.status_code != 200:
                print(f"Failed to fetch Unstop Jobs: {response.status_code}")
                return

            data = response.json()
            if 'data' not in data or 'data' not in data['data']:
                print("Unstop Jobs: Unexpected structure")
                return

            items = data['data']['data']
            print(f"Found {len(items)} Unstop Jobs.")

            for item in items:
                try:
                    title = item.get('title')
                    if not title: continue
                    
                    company = item.get('organisation', {}).get('name', 'Unstop')
                    
                    # Location
                    location = "India" # Default
                    if item.get('region'):
                         location = item.get('region')
                    
                    # URL
                    slug = item.get('slug', '')
                    item_url = f"https://unstop.com/{slug}" if slug else "https://unstop.com"

                    job_data = {
                        "title": title,
                        "company": company,
                        "location": location,
                        "type": "Job" if "intern" not in title.lower() else "Internship",
                        "salary_range": "See Details", 
                        "url": item_url,
                        "source": "Unstop",
                        "posted_at": datetime.now().strftime("%Y-%m-%d")
                    }
                    
                    print(f"Found Job: {title} at {company}")
                    self.save_job(job_data)

                except Exception as e:
                    print(f"Error parsing Unstop Job item: {e}")

        except Exception as e:
            print(f"Error scraping Unstop Jobs: {e}")

    def run(self):
        self.scrape_hackathons()
        self.scrape_jobs()

if __name__ == "__main__":
    UnstopScraper().run()
