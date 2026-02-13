import requests
from bs4 import BeautifulSoup
import json

def verify_unstop():
    print("\n--- Verifying Unstop API ---")
    url = "https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page=10&oppstatus=open"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
    }
    try:
        r = requests.get(url, headers=headers)
        print(f"Unstop API Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            if 'data' in data and 'data' in data['data']:
                items = data['data']['data']
                print(f"Found {len(items)} Unstop opportunities.")
                if len(items) > 0:
                    print("Sample:", items[0].get('title', 'No Title'))
            else:
                print("Unexpected JSON structure:", data.keys())
    except Exception as e:
        print(f"Unstop Error: {e}")

def verify_devfolio():
    print("\n--- Verifying Devfolio API ---")
    # Devfolio often uses POST for search or complex filters
    # Trying a known open endpoint `https://api.devfolio.co/api/hackathons` with different params
    url = "https://api.devfolio.co/api/hackathons?filter=open&page=1&limit=10"
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://devfolio.co'
    }
    
    try:
        r = requests.get(url, headers=headers)
        print(f"Devfolio API Status: {r.status_code}")
        # If 422, maybe it needs a POST request?
        if r.status_code != 200:
             print("Retrying with POST...")
             r = requests.post("https://api.devfolio.co/api/search/hackathons", json={"type": "offline_online"}, headers=headers)
             print(f"Devfolio POST Status: {r.status_code}")
             
    except Exception as e:
        print(f"Devfolio Error: {e}")

def verify_hackerearth():
    print("\n--- Verifying HackerEarth ---")
    url = "https://www.hackerearth.com/challenges/hackathon/"
    headers = {
         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        r = requests.get(url, headers=headers)
        print(f"HackerEarth HTML Status: {r.status_code}")
        # print(r.text[:500])
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Check for challenge cards
        cards = soup.find_all('div', class_='challenge-card-modern') # Try 'challenge-card-modern' or 'challenge-card'
        if not cards:
             cards = soup.find_all('div', class_='challenge-card')
             
        print(f"Found {len(cards)} HackerEarth cards.")
        
        if cards:
            print("--- Card Dump ---")
            print(cards[0].prettify())
            print("-----------------")
        else:
            print("--- HTML Dump ---")
            print(soup.prettify()[:2000])
            print("-----------------")
            
    except Exception as e:
        print(f"HackerEarth Error: {e}")

def verify_google_jobs():
    print("\n--- Verifying Google Jobs (Aggregation) ---")
    # Search for "software engineer intern india" and look for the specific Google Jobs widget structure
    # Note: Google often blocks simple requests or requires specific headers/cookies. 
    # This is a test to see if we can get the 'initial' HTML.
    url = "https://www.google.com/search?q=software+engineer+intern+india&ibp=htl;jobs"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        r = requests.get(url, headers=headers)
        print(f"Google Jobs Status: {r.status_code}")
        if r.status_code == 200:
            # Google Jobs classes are obfuscated/dynamic usually, but let's check for common text
            if "Software Engineer" in r.text:
                print("Found 'Software Engineer' text in response.")
            else:
                print("Could not find expected job text.")
    except Exception as e:
        print(f"Google Jobs Error: {e}")

def verify_linkedin_guest():
    print("\n--- Verifying LinkedIn Guest ---")
    # LinkedIn guest jobs search
    url = "https://www.linkedin.com/jobs/search?keywords=Software%20Engineer&location=India&geoId=102713980&trk=public_jobs_jobs-search-bar_search-submit&position=1&pageNum=0"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        r = requests.get(url, headers=headers)
        print(f"LinkedIn Guest Status: {r.status_code}")
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, 'html.parser')
            # LinkedIn guest job cards usually have class 'base-card' or 'job-search-card'
            cards = soup.find_all('div', class_='base-card')
            if not cards:
                cards = soup.find_all('li') # Broad search if specific class fails
                
            print(f"Found {len(cards)} LinkedIn Guest cards (heuristic).")
            if len(cards) > 0:
                 print("--- LinkedIn Card Dump ---")
                 print(cards[0].prettify())
                 print("--------------------------")
    except Exception as e:
        print(f"LinkedIn Error: {e}")

def verify_unstop_jobs():
    print("\n--- Verifying Unstop Jobs API ---")
    # Same API structure as hackathons, but opportunity=jobs
    url = "https://unstop.com/api/public/opportunity/search-result?opportunity=jobs&per_page=10&oppstatus=open"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
    }
    try:
        r = requests.get(url, headers=headers)
        print(f"Unstop Jobs API Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            if 'data' in data and 'data' in data['data']:
                items = data['data']['data']
                print(f"Found {len(items)} Unstop Jobs.")
                if len(items) > 0:
                    print("Sample Job:", items[0].get('title', 'No Title'))
    except Exception as e:
        print(f"Unstop Jobs Error: {e}")

def verify_aicte():
    print("\n--- Verifying AICTE Internship Portal ---")
    # https://internship.aicte-india.org/
    url = "https://internship.aicte-india.org/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        # Check if main page is accessible
        r = requests.get(url, headers=headers, verify=False) # Govt sites often have SSL issues
        print(f"AICTE Status: {r.status_code}")
        if r.status_code == 200:
            print("AICTE Portal is accessible.")
            # Check for keyword
            if "Internship" in r.text:
                print("Found 'Internship' text.")
    except Exception as e:
        print(f"AICTE Error: {e}")

if __name__ == "__main__":
    # verify_google_jobs()
    # verify_linkedin_guest()
    verify_unstop_jobs()
    verify_aicte()
