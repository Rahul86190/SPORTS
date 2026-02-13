from .base import BaseScraper
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import urllib3

# Suppress SSL warnings for AICTE
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class AictScraper(BaseScraper):
    def __init__(self):
        super().__init__()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def scrape_internships(self):
        # AICTE Internship Portal
        # Main page lists some, but we might need to search or browse. 
        # For now, let's try the recently posted or similar section if accessible via simple GET.
        # Actually, AICTE is often dynamic. Let's try to get the landing page content as verified.
        url = "https://internship.aicte-india.org/"
        print(f"Scraping AICTE: {url}")
        
        try:
            response = requests.get(url, headers=self.headers, verify=False)
            if response.status_code != 200:
                print(f"Failed to fetch AICTE: {response.status_code}")
                return

            soup = BeautifulSoup(response.text, 'html.parser')
            
            # AICTE structure is complex and changes. 
            # We'll look for generic internship cards or list items.
            # Based on typical govt sites, might be table rows or divs with specific classes.
            # Without a detailed dump, we'll try a heuristic approach looking for "Internship" keywords in links.
            
            links = soup.find_all('a', href=True)
            count = 0
            
            for link in links:
                text = link.get_text().strip()
                href = link['href']
                
                # Filter for internship-like links that aren't nav links
                if "internship" in text.lower() and len(text) > 10 and len(text) < 100:
                    title = text
                    company = "AICTE / Govt"
                    location = "India"
                    
                    full_url = href if href.startswith("http") else f"https://internship.aicte-india.org/{href}"
                    
                    job_data = {
                        "title": title,
                        "company": company,
                        "location": location,
                        "type": "Govt Internship",
                        "salary_range": "Stipend (Govt Norms)",
                        "url": full_url,
                        "source": "AICTE",
                        "posted_at": datetime.now().strftime("%Y-%m-%d")
                    }
                    
                    print(f"Found AICTE Opportunity: {title}")
                    self.save_job(job_data)
                    count += 1
                    if count >= 10: break # Limit for now as heuristic might be noisy
            
            if count == 0:
                print("No obvious internship links found on AICTE home. Might need deeper navigation.")

        except Exception as e:
            print(f"Error scraping AICTE: {e}")

    def run(self):
        self.scrape_internships()

if __name__ == "__main__":
    AictScraper().run()
