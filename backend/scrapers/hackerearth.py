from .base import BaseScraper
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import time
import random

class HackerEarthScraper(BaseScraper):
    def __init__(self):
        super().__init__()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
             'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }

    def scrape_hackathons(self):
        url = "https://www.hackerearth.com/challenges/hackathon/"
        print(f"Scraping HackerEarth: {url}")
        
        try:
            response = requests.get(url, headers=self.headers)
            if response.status_code != 200:
                print(f"Failed to fetch HackerEarth: {response.status_code}")
                return

            soup = BeautifulSoup(response.text, 'html.parser')
            # Try specific modern card class first, then generic
            cards = soup.find_all('div', class_='challenge-card-modern')
            if not cards:
                cards = soup.find_all('div', class_='challenge-card')

            print(f"Found {len(cards)} items.")
            
            for c in cards:
                try:
                    # Title & Link
                    # Usually in an 'a' tag with class 'challenge-card-link' or similar wrapper
                    # Or just find the first 'a' with href containing /challenges/
                    link_elem = c.find('a', href=True)
                    url_suffix = link_elem['href'] if link_elem else ""
                    
                    # If relative URL
                    if url_suffix.startswith("/"):
                        item_url = f"https://www.hackerearth.com{url_suffix}"
                    else:
                        item_url = url_suffix # Might be full URL
                    
                    # Title often in a div with specific class or just text of link
                    title = "Hackathon"
                    # Try to find specific title class - typically 'large weight-600'
                    title_elem = c.find(lambda tag: tag.name in ['div', 'span'] and tag.get('class') and 'large' in tag.get('class') and 'weight-600' in tag.get('class'))
                    
                    if title_elem:
                        title = title_elem.get_text().strip()
                    else:
                        # Fallback: Link text
                         if link_elem:
                             title = link_elem.get_text().strip()
                    
                    # If title is still generic or empty, skip or mark
                    if not title: title = "Upcoming Hackathon"

                    # Organizer
                    organizer_elem = c.find('div', class_='company-name') or c.find('div', class_='organizer')
                    organizer = organizer_elem.get_text().strip() if organizer_elem else "HackerEarth"
                    
                    # Type
                    type_elem = c.find('div', class_='challenge-type')
                    tag = type_elem.get_text().strip() if type_elem else "Hackathon"
                    
                    # Dates / Status
                    # Usually "STARTS IN..." or dates. 
                    # status_elem = c.find('div', class_='challenge-status')
                    
                    # Location -> Online usually
                    location = "Online"
                    
                    hackathon_data = {
                        "name": title,
                        "organizer": organizer,
                        "description": "HackerEarth Challenge",
                        "dates": "Upcoming", # Parse if possible
                        "location": location,
                        "url": item_url,
                        "source": "HackerEarth",
                        "tags": ["Hackathon", tag.upper()],
                        "prizes": "See Details"
                    }
                    
                    print(f"Found: {title} ({organizer})")
                    self.save_hackathon(hackathon_data)
                    
                except Exception as e:
                    print(f"Error parsing HackerEarth item: {e}")

        except Exception as e:
            print(f"Error scraping HackerEarth: {e}")

    def run(self):
        self.scrape_hackathons()

if __name__ == "__main__":
    HackerEarthScraper().run()
