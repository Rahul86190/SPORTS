import requests
from bs4 import BeautifulSoup

def verify():
    url = "https://github.com/VikashPR/Global-Internship-List"
    print(f"Fetching {url}...")
    try:
        r = requests.get(url)
        if r.status_code != 200:
            print(f"Failed: {r.status_code}")
            return
        
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Look for headers containing "India"
        headers = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        india_header = None
        for h in headers:
            text = h.get_text().strip()
            if "India" in text and "Research" in text:
                 print(f"Found specific header: {text}")
                 india_header = h
                 break
            if "India" == text:
                 print(f"Found exact header: {text}")
                 india_header = h
        
        if not india_header:
            # Fallback: look for just "India" text in h3 like the chunk suggested
            for h in headers:
                 if "India" in h.get_text():
                      print(f"Found potential header: {h.get_text()}")
                      # Just use the first one that looks like a section
                      if h.name == 'h3':
                           india_header = h
                           break
        
        if india_header:
            print(f"Using Header: {india_header}")
        if india_header:
            print(f"Using Header: {india_header}")
            # Find the next <ul> regardless of nesting/siblings
            ul = india_header.find_next('ul')
            
            if ul:
                items = ul.find_all('li')
                print(f"Found {len(items)} items in list.")
                for item in items[:5]:
                    link = item.find('a')
                    if link:
                        print(f" - Text: '{link.get_text()}' URL: {link['href']}")
            else:
                print("No <ul> found after header with find_next.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
