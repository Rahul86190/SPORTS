import requests
from bs4 import BeautifulSoup
from typing import List, Dict

def scrape_jobs() -> List[Dict]:
    """
    Scrapes jobs from aggregator APIs or specific career pages.
    """
    results = []
    
    # Example structure
    # {
    #     "title": "Software Engineer",
    #     "company": "TechCorp",
    #     "location": "Remote",
    #     "link": "https://..."
    # }
    
    results.append({
        "title": "Frontend Developer",
        "company": "StartupX",
        "location": "Remote",
        "link": "http://localhost/job/1"
    })
    
    return results
