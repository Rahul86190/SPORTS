from .base import BaseScraper
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import time
import random

class InternshalaScraper(BaseScraper):
    def __init__(self):
        super().__init__()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }

    def scrape_url(self, url, job_type="Internship"):
        print(f"Scraping Internshala ({job_type}): {url}")
        try:
            # Add random delay
            time.sleep(random.uniform(1, 3))
            
            response = requests.get(url, headers=self.headers)
            if response.status_code != 200:
                print(f"Failed to fetch {url}: {response.status_code}")
                return

            soup = BeautifulSoup(response.text, 'html.parser')
            containers = soup.find_all('div', class_='individual_internship')
            
            print(f"Found {len(containers)} items.")
            count = 0
            
            for c in containers:
                try:
                    # Skip adds if any
                    if 'result-alert' in c.get('class', []): continue

                    # Title
                    title_elem = c.find('h3', class_='job-internship-name')
                    if not title_elem: continue
                    title = title_elem.get_text().strip()
                    
                    # Link
                    link_elem = title_elem.find('a')
                    job_url = "https://internshala.com" + link_elem['href'] if link_elem else ""

                    # Company
                    company_elem = c.find('p', class_='company-name') or c.find('div', class_='company_name')
                    company = company_elem.get_text().strip() if company_elem else "Unknown"

                    # Location Heuristic: Find all links. Check if href has 'location' or match known cities.
                    # Or check text of 'locations' div if it exists.
                    location = "India" # Default
                    
                    # Method 1: Link Analysis (Corrected)
                    # The location link might be missing href or malformed.
                    # But the JOB LINK often contains location: ...-internship-in-gurgaon-at-india-accelerator...
                    
                    # Try to find location text in a tags first (if text matches city names)
                    # Actually, let's use the URL regex as primary fallback if explicit tag fails.
                    
                    loc_container = c.find('div', id='location_names')
                    if loc_container:
                        location = loc_container.get_text().strip()
                    else:
                        # Try to get it from the URL
                        # URL format: https://internshala.com/internship/detail/product-management-internship-in-gurgaon-at-india-accelerator1770441074
                        import re
                        match = re.search(r'-in-([a-zA-Z0-9-]+)-at-', job_url)
                        if match:
                            loc_slug = match.group(1)
                            location = loc_slug.replace('-', ' ').title()
                        else:
                            # Fallback: Check text of all 'a' tags, if one is not Title or Company, assume Location
                            all_links = c.find_all('a')
                            for l in all_links:
                                text = l.get_text().strip()
                                href = l.get('href', '')
                                # Heuristic: match common cities or just exclude knowns
                                if text and text != title and text != company and text != "View Details":
                                     # Verify it looks like a location (no numbers, short)
                                     if len(text) < 30 and not any(char.isdigit() for char in text):
                                         location = text
                                         break

                    # Stipend / Salary
                    stipend = "N/A"
                    stipend_elem = c.find('span', class_='stipend') or c.find('div', class_='stipend') or c.find('span', class_='salary')
                    if stipend_elem:
                        stipend = stipend_elem.get_text().strip()

                    # ID
                    item_id = c.get('data-id') or job_url

                    job_data = {
                        "title": title,
                        "company": company,
                        "location": location,
                        "type": job_type,
                        "salary_range": stipend,
                        "url": job_url,
                        "source": "Internshala",
                        "posted_at": datetime.now().strftime("%Y-%m-%d")
                    }
                    
                    # Filter for active/relevant?
                    # User wants "Current and Live". Internshala search results ARE active.
                    # User wants "Student surrounding". 
                    # If location is 'Work From Home', map to Remote.
                    if "work from home" in location.lower():
                        job_data['location'] = "Remote"
                    
                    print(f"Found: {company} - {title} ({location})")
                    self.save_job(job_data)
                    count += 1
                    
                except Exception as e:
                    print(f"Error parsing item: {e}")
                    continue
            
            print(f"Scraped {count} items from {url}")

        except Exception as e:
            print(f"Error scraping Internshala: {e}")

    def run(self):
        # Internships
        self.scrape_url("https://internshala.com/internships/computer-science-internship/", "Internship")
        # Jobs (Junior/Fresher)
        self.scrape_url("https://internshala.com/jobs/computer-science-jobs/", "Job")

if __name__ == "__main__":
    InternshalaScraper().run()
