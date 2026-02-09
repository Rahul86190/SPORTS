import requests
from bs4 import BeautifulSoup
from typing import List, Dict

def scrape_hackathons() -> List[Dict]:
    """
    Scrapes hackathons from major platforms.
    Currently targeting: Unstop (mock/placeholder as efficient scraping requires rigorous headers)
    """
    results = []
    
    # Example structure for results
    # {
    #     "title": "AI Hackathon 2024",
    #     "platform": "Unstop",
    #     "date": "2024-10-15",
    #     "link": "https://unstop.com/..."
    # }
    
    # TODO: Implement actual scraping logic with proper headers and error handling
    # For now, returning a sample to verify API integration
    results.append({
        "title": "Sample Hackathon",
        "platform": "Internal",
        "date": "2024-12-01",
        "link": "http://localhost"
    })
    
    return results
