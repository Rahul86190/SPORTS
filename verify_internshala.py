import requests
from bs4 import BeautifulSoup
import random

def verify():
    url = "https://internshala.com/internships/computer-science-internship/"
    # Use a real browser UA to avoid immediate block
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }
    
    print(f"Fetching {url}...")
    try:
        r = requests.get(url, headers=headers)
        print(f"Status: {r.status_code}")
        if r.status_code != 200:
            return
        
        soup = BeautifulSoup(r.text, 'html.parser')
        # Check for internship containers
        # Internshala usually uses id="internship_list_container_1" or class="internship_meta"
        containers = soup.find_all('div', class_='individual_internship')
        print(f"Found {len(containers)} internships.")
        
        for c in containers[:1]:
            print("--- Link Dump ---")
            for a in c.find_all('a'):
                print(f"Text: {a.get_text().strip()} | Href: {a.get('href')}")
            print("-----------------")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
