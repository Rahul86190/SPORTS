from .base import BaseScraper
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from .unstop import UnstopScraper
from .hackerearth import HackerEarthScraper

class HackathonScraper(BaseScraper):
    def __init__(self):
        super().__init__()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
        }

    def scrape_devpost(self):
        print("Scraping Devpost (Simplified via MLH)...")
        # MLH schedule page
        url = "https://mlh.io/seasons/2025/events"
        
        try:
            response = requests.get(url, headers=self.headers)
            if response.status_code != 200:
                print(f"Failed to fetch MLH: {response.status_code}")
                return

            soup = BeautifulSoup(response.text, 'html.parser')
            events = soup.find_all('div', class_='event-wrapper')

            for event in events:
                title_elem = event.find('h3', class_='event-name')
                if not title_elem: continue
                
                title = title_elem.get_text().strip()
                link = event.find('a', class_='event-link')['href']
                date_elem = event.find('p', class_='event-date')
                date_str = date_elem.get_text().strip() if date_elem else "Upcoming"
                
                location_elem = event.find('div', class_='event-location')
                location = location_elem.get_text().strip().replace('\n', ' ') if location_elem else "Online"

                # Filter for Indian Students (Online or India)
                loc_lower = location.lower()
                is_relevant = False
                if "online" in loc_lower: is_relevant = True
                elif "india" in loc_lower: is_relevant = True
                elif "bangalore" in loc_lower or "bengaluru" in loc_lower: is_relevant = True
                elif "delhi" in loc_lower or "ncr" in loc_lower: is_relevant = True
                elif "mumbai" in loc_lower: is_relevant = True
                
                if not is_relevant:
                    continue

                tags = ["Hackathon", "MLH"]
                if "High School" in title:
                    tags.append("High School")
                
                hackathon_data = {
                    "name": title,
                    "organizer": "MLH / Various",
                    "dates": date_str,
                    "location": location,
                    "prizes": "See Details", 
                    "url": link,
                    "source": "MLH",
                    "tags": tags,
                    "created_at": datetime.now().isoformat()
                }
                
                print(f"Found relevant hackathon: {title} ({location})")
                self.save_hackathon(hackathon_data)

        except Exception as e:
            print(f"Error scraping MLH: {e}")

    def run(self):
        self.scrape_devpost()
        try:
            UnstopScraper().scrape_hackathons()
        except Exception as e:
            print(f"Error running Unstop scraper: {e}")
        try:
            HackerEarthScraper().run()
        except Exception as e:
            print(f"Error running HackerEarth scraper: {e}")

if __name__ == "__main__":
    # hackathons.py import UnstopScraper, HackerEarthScraper
    # Need to make sure they are importable as modules
    # Run with: python -m backend.scrapers.hackathons
    HackathonScraper().run()
