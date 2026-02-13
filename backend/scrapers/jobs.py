from .base import BaseScraper
from .internshala import InternshalaScraper
from .linkedin import LinkedInScraper
from .unstop import UnstopScraper
from .aicte import AictScraper
import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime
import os
from pathlib import Path
import re
from urllib.parse import urlparse

class JobScraper(BaseScraper):
    def __init__(self):
        super().__init__()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def scrape_vikash_india(self):
        print("Scraping VikashPR Global Internship List (India) - Cached...")
        # Path to local file
        file_path = Path(__file__).parent / 'vikash_india.txt'
        
        if not file_path.exists():
            print(f"Cached file not found at {file_path}")
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        print(f"Processing {len(lines)} internships from cache...")
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            # Format: [🔗](url)
            # Regex to extract url
            match = re.search(r'\((https?://[^)]+)\)', line)
            if not match:
                continue
            
            course_url = match.group(1)
            title = ""
            
            # Generate Title from Domain
            try:
                domain = urlparse(course_url).netloc
                domain = domain.replace("www.", "")
                title = f"Research Intern at {domain}"
            except:
                title = "Research Internship"

            # Setup Company Name
            company = "Research Institution" 
            lower_url = course_url.lower()
            if "iit" in lower_url:
                company = "IIT"
                if "bombay" in lower_url or "iitb" in lower_url: company = "IIT Bombay"
                elif "delhi" in lower_url or "iitd" in lower_url: company = "IIT Delhi"
                elif "madras" in lower_url or "iitm" in lower_url: company = "IIT Madras"
                elif "kanpur" in lower_url or "iitk" in lower_url: company = "IIT Kanpur"
                elif "kharagpur" in lower_url or "iitkgp" in lower_url: company = "IIT Kharagpur"
                elif "roorkee" in lower_url or "iitr" in lower_url: company = "IIT Roorkee"
                elif "guwahati" in lower_url or "iitg" in lower_url: company = "IIT Guwahati"
            elif "nit" in lower_url:
                company = "NIT"
            elif "iisc" in lower_url:
                company = "IISc Bangalore"
            elif "tifr" in lower_url:
                company = "TIFR"
            elif "iiit" in lower_url:
                company = "IIIT"
            elif "isro" in lower_url:
                company = "ISRO"
            elif "niti" in lower_url:
                company = "NITI Aayog"
            elif "google" in lower_url:
                company = "Google"

            job_data = {
                "title": title,
                "company": company,
                "location": "India", # Explicitly set to India
                "type": "Research Internship",
                "salary_range": "Stipend (Varies)", 
                "url": course_url,
                "source": "VikashPR (GitHub)",
                "posted_at": datetime.now().strftime("%Y-%m-%d")
            }
            
            # print(f"Found: {company} - {title}")
            self.save_job(job_data)

    def run(self):
        print("Starting Job Scraping Pipeline...")
        
        # 1. VikashPR (Research Interns)
        self.scrape_vikash_india()
        
        # 2. Internshala (Internships & Jobs)
        try:
            InternshalaScraper().run()
        except Exception as e:
            print(f"Error running Internshala scraper: {e}")

        # 3. LinkedIn (Guest Search)
        try:
            LinkedInScraper().run()
        except Exception as e:
            print(f"Error running LinkedIn scraper: {e}")

        # 4. Unstop (Jobs)
        try:
            UnstopScraper().scrape_jobs()
        except Exception as e:
            print(f"Error running Unstop Jobs scraper: {e}")

        # 5. AICTE (Govt Internships)
        try:
            AictScraper().run()
        except Exception as e:
            print(f"Error running AICTE scraper: {e}")
            
        print("Job Scraping Pipeline Completed.")

if __name__ == "__main__":
    JobScraper().run()
