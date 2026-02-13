from .base import BaseScraper
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import time
import random

class LinkedInScraper(BaseScraper):
    def __init__(self):
        super().__init__()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def scrape_guest_jobs(self):
        # Search for "Software Engineer" in "India"
        # We can make this dynamic later, but sticking to requested "Computer Science" / "Software" focus
        keywords = "Software Engineer Intern"
        location = "India"
        url = f"https://www.linkedin.com/jobs/search?keywords={keywords}&location={location}&geoId=102713980&trk=public_jobs_jobs-search-bar_search-submit&position=1&pageNum=0"
        
        print(f"Scraping LinkedIn Guest: {url}")
        
        try:
            response = requests.get(url, headers=self.headers)
            if response.status_code != 200:
                print(f"Failed to fetch LinkedIn: {response.status_code}")
                return

            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Cards are usually 'li' with class 'base-card' or div 'job-search-card'
            # Based on verification dump: <div class="base-card ...">
            cards = soup.find_all('div', class_='base-card')
            if not cards:
                cards = soup.find_all('li')
            
            print(f"Found {len(cards)} LinkedIn items.")
            
            for card in cards:
                try:
                    # Title
                    title_elem = card.find('h3', class_='base-search-card__title')
                    if not title_elem: continue
                    title = title_elem.get_text().strip()
                    
                    # Company
                    company_elem = card.find('h4', class_='base-search-card__subtitle')
                    company = company_elem.get_text().strip() if company_elem else "Unknown"
                    
                    # Location
                    loc_elem = card.find('span', class_='job-search-card__location')
                    location = loc_elem.get_text().strip() if loc_elem else "India"
                    
                    # URL
                    link_elem = card.find('a', class_='base-card__full-link')
                    if not link_elem: continue
                    job_url = link_elem['href']
                    
                    # Date
                    date_elem = card.find('time', class_='job-search-card__listdate')
                    posted_at = datetime.now().strftime("%Y-%m-%d")
                    if date_elem and date_elem.has_attr('datetime'):
                        posted_at = date_elem['datetime']
                    
                    job_data = {
                        "title": title,
                        "company": company,
                        "location": location,
                        "type": "Full-time" if "intern" not in title.lower() else "Internship", 
                        "salary_range": "N/A", # LinkedIn guest doesn't usually show salary cleanly
                        "url": job_url,
                        "source": "LinkedIn",
                        "posted_at": posted_at
                    }
                    
                    print(f"Found: {title} at {company}")
                    self.save_job(job_data)
                    
                except Exception as e:
                    print(f"Error parsing LinkedIn item: {e}")
                    
        except Exception as e:
            print(f"Error scraping LinkedIn: {e}")

    def run(self):
        self.scrape_guest_jobs()

if __name__ == "__main__":
    LinkedInScraper().run()
