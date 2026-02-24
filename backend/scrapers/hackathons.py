from .base import BaseScraper
import requests
from bs4 import BeautifulSoup
from datetime import datetime, date
import re
from .unstop import UnstopScraper
from .hackerearth import HackerEarthScraper


def extract_end_date(dates_str):
    """Try to extract an end date from a dates string. Returns a date or None."""
    if not dates_str:
        return None
    s = str(dates_str).strip()

    # Skip things that are clearly ongoing/future
    s_lower = s.lower()
    if any(kw in s_lower for kw in ["rolling", "ongoing", "upcoming", "open", "always", "cohorts"]):
        return None  # Treat as always-valid

    # Try to find ISO dates like 2025-04-15
    iso_dates = re.findall(r'(\d{4})-(\d{2})-(\d{2})', s)
    if iso_dates:
        last = iso_dates[-1]  # Use the last (end) date
        try:
            return date(int(last[0]), int(last[1]), int(last[2]))
        except ValueError:
            pass

    # Try "Month YYYY" patterns like "Aug 2025", "October 2025"
    month_map = {
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
        "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
    }
    month_year = re.findall(r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})', s, re.IGNORECASE)
    if month_year:
        year = int(month_year[-1])
        # Find the month name before this year
        months_found = re.findall(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', s, re.IGNORECASE)
        if months_found:
            m = month_map.get(months_found[-1][:3].lower())
            if m and year:
                try:
                    # End of the month
                    if m == 12:
                        return date(year, 12, 31)
                    return date(year, m + 1, 1)
                except ValueError:
                    return date(year, m, 28)

    # Try just a year like "2025"
    years = re.findall(r'(\d{4})', s)
    if years:
        last_year = int(years[-1])
        if last_year >= 2020:
            return date(last_year, 12, 31)

    return None


def is_past_event(dates_str):
    """Returns True if the event has definitely ended."""
    end = extract_end_date(dates_str)
    if end is None:
        return False  # Can't determine — keep it
    return end < date.today()


class HackathonScraper(BaseScraper):
    def __init__(self):
        super().__init__()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }

    def _save_if_not_past(self, hackathon_data):
        """Only save if the event hasn't ended."""
        dates = hackathon_data.get("dates", "")
        if is_past_event(dates):
            print(f"  SKIPPED (past): {hackathon_data.get('name')} ({dates})")
            return False
        self.save_hackathon(hackathon_data)
        return True

    def scrape_mlh(self):
        """Scrape MLH events."""
        for season_url in [
            "https://mlh.io/seasons/2026/events",
            "https://mlh.io/seasons/2025/events",
        ]:
            print(f"Scraping MLH: {season_url}")
            try:
                response = requests.get(season_url, headers=self.headers, timeout=15)
                if response.status_code != 200:
                    print(f"  Failed: {response.status_code}")
                    continue

                soup = BeautifulSoup(response.text, 'html.parser')

                # Try known selectors
                events = soup.find_all('div', class_='event-wrapper')
                if not events:
                    events = soup.find_all('div', attrs={
                        'class': lambda c: c and 'event' in ' '.join(c).lower()
                    })

                if not events:
                    # Fallback: find links to events.mlh.io
                    links = soup.find_all('a', href=True)
                    seen = set()
                    for link in links:
                        href = link['href']
                        text = link.get_text().strip()
                        if not text or len(text) < 5 or text in seen:
                            continue
                        if 'events.mlh.io' in href or ('/events/' in href and 'mlh' in season_url):
                            seen.add(text)
                            hackathon_data = {
                                "name": text,
                                "organizer": "MLH",
                                "dates": "Upcoming",
                                "location": "Online",
                                "url": href if href.startswith('http') else f"https://mlh.io{href}",
                                "source": "MLH",
                                "tags": ["Hackathon", "MLH"],
                                "prizes": "See Details",
                                "created_at": datetime.now().isoformat()
                            }
                            print(f"  Found MLH event: {text[:60]}")
                            self._save_if_not_past(hackathon_data)
                    continue

                for event in events:
                    title_elem = event.find('h3') or event.find('h4') or event.find('a')
                    if not title_elem:
                        continue

                    title = title_elem.get_text().strip()
                    link_elem = event.find('a', href=True)
                    link = link_elem['href'] if link_elem else season_url
                    if not link.startswith('http'):
                        link = f"https://mlh.io{link}"

                    date_elem = event.find('p') or event.find('span')
                    date_str = date_elem.get_text().strip() if date_elem else "Upcoming"

                    hackathon_data = {
                        "name": title,
                        "organizer": "MLH",
                        "dates": date_str[:100],
                        "location": "Online",
                        "url": link,
                        "source": "MLH",
                        "tags": ["Hackathon", "MLH"],
                        "prizes": "See Details",
                        "created_at": datetime.now().isoformat()
                    }

                    print(f"  Found MLH event: {title[:60]}")
                    self._save_if_not_past(hackathon_data)

            except Exception as e:
                print(f"  Error scraping MLH: {e}")

    def scrape_devfolio(self):
        """Scrape Devfolio — popular for Indian hackathons."""
        print("Scraping Devfolio...")
        url = "https://api.devfolio.co/api/search/hackathons"
        try:
            payload = {
                "type": "hackathon",
                "q": "",
                "filter": {"status": ["open", "upcoming"]},
                "size": 30,
                "from": 0,
            }
            response = requests.post(url, json=payload, headers={
                **self.headers,
                'Content-Type': 'application/json',
            }, timeout=15)

            if response.status_code != 200:
                print(f"  Devfolio API status: {response.status_code}")
                self._scrape_devfolio_html()
                return

            data = response.json()
            hits = data.get('hits', {}).get('hits', [])
            print(f"  Found {len(hits)} Devfolio hackathons")

            for hit in hits:
                src = hit.get('_source', {})
                name = src.get('name', '')
                if not name:
                    continue

                starts = (src.get('starts_at', '') or '')[:10]
                ends = (src.get('ends_at', '') or '')[:10]
                dates = f"{starts} - {ends}" if starts and ends else "Upcoming"

                hackathon_data = {
                    "name": name,
                    "organizer": src.get('org_name', 'Devfolio'),
                    "dates": dates,
                    "location": "Online" if src.get('is_online') else (src.get('city', 'Online')),
                    "url": f"https://{src.get('slug', '')}.devfolio.co" if src.get('slug') else "https://devfolio.co",
                    "source": "Devfolio",
                    "tags": ["Hackathon", "Devfolio"],
                    "prizes": str(src.get('prize_amount', 'See Details') or 'See Details'),
                    "created_at": datetime.now().isoformat()
                }
                print(f"  Found: {name}")
                self._save_if_not_past(hackathon_data)

        except Exception as e:
            print(f"  Devfolio API error: {e}")
            self._scrape_devfolio_html()

    def _scrape_devfolio_html(self):
        """Fallback: scrape Devfolio discover page."""
        try:
            r = requests.get("https://devfolio.co/hackathons", headers=self.headers, timeout=15)
            if r.status_code != 200:
                return
            soup = BeautifulSoup(r.text, 'html.parser')
            links = soup.find_all('a', href=True)
            for link in links:
                href = link['href']
                text = link.get_text().strip()
                if '.devfolio.co' in href and text and len(text) > 3:
                    hackathon_data = {
                        "name": text,
                        "organizer": "Devfolio",
                        "dates": "Upcoming",
                        "location": "Online",
                        "url": href if href.startswith('http') else f"https://devfolio.co{href}",
                        "source": "Devfolio",
                        "tags": ["Hackathon", "Devfolio"],
                        "prizes": "See Details",
                        "created_at": datetime.now().isoformat()
                    }
                    self._save_if_not_past(hackathon_data)
        except Exception as e:
            print(f"  Devfolio HTML fallback error: {e}")

    def add_curated_programs(self):
        """Add curated live programs — only ongoing/future ones."""
        today = date.today()
        year = today.year

        curated = [
            {
                "name": "Google Gen AI Intensive",
                "organizer": "Google",
                "dates": f"Rolling - {year}",
                "location": "Online",
                "url": "https://rsvp.withgoogle.com/events/google-generative-ai-intensive",
                "source": "Google",
                "tags": ["Program", "AI", "Google"],
                "prizes": "Certification",
            },
            {
                "name": "Google Cloud Arcade Facilitator Program",
                "organizer": "Google Cloud",
                "dates": f"Rolling - {year}",
                "location": "Online",
                "url": "https://rsvp.withgoogle.com/events/arcade-facilitator",
                "source": "Google",
                "tags": ["Program", "Cloud", "Google"],
                "prizes": "Swag & Certification",
            },
            {
                "name": "Google Summer of Code (GSoC)",
                "organizer": "Google",
                "dates": f"Feb - Nov {year}",
                "location": "Online",
                "url": "https://summerofcode.withgoogle.com/",
                "source": "Google",
                "tags": ["Program", "Open Source", "Google"],
                "prizes": "Stipend",
            },
            {
                "name": "MLH Fellowship",
                "organizer": "Major League Hacking",
                "dates": f"Rolling - {year}",
                "location": "Online",
                "url": "https://fellowship.mlh.io/",
                "source": "MLH",
                "tags": ["Fellowship", "Open Source", "MLH"],
                "prizes": "Stipend",
            },
            {
                "name": "GitHub Octernships",
                "organizer": "GitHub",
                "dates": f"Rolling - {year}",
                "location": "Online",
                "url": "https://education.github.com/students",
                "source": "GitHub",
                "tags": ["Program", "Open Source", "GitHub"],
                "prizes": "Experience",
            },
            {
                "name": "LFX Mentorship (Linux Foundation)",
                "organizer": "Linux Foundation",
                "dates": f"3 cohorts/year - {year}",
                "location": "Online",
                "url": "https://mentorship.lfx.linuxfoundation.org/",
                "source": "Linux Foundation",
                "tags": ["Mentorship", "Open Source"],
                "prizes": "Stipend",
            },
            {
                "name": "GirlScript Summer of Code (GSSoC)",
                "organizer": "GirlScript Foundation",
                "dates": f"May - Aug {year}",
                "location": "Online",
                "url": "https://gssoc.girlscript.tech/",
                "source": "GirlScript",
                "tags": ["Program", "Open Source", "India"],
                "prizes": "Certificates & Swag",
            },
            {
                "name": "Hacktoberfest",
                "organizer": "DigitalOcean",
                "dates": f"October {year}",
                "location": "Online",
                "url": "https://hacktoberfest.com/",
                "source": "DigitalOcean",
                "tags": ["Program", "Open Source"],
                "prizes": "Swag & Recognition",
            },
            {
                "name": "Smart India Hackathon (SIH)",
                "organizer": "Govt. of India",
                "dates": f"{year}",
                "location": "India",
                "url": "https://www.sih.gov.in/",
                "source": "Govt. of India",
                "tags": ["Hackathon", "India", "Government"],
                "prizes": "Cash Prizes",
            },
            {
                "name": "Microsoft Imagine Cup",
                "organizer": "Microsoft",
                "dates": f"{year}",
                "location": "Online",
                "url": "https://imaginecup.microsoft.com/",
                "source": "Microsoft",
                "tags": ["Hackathon", "AI", "Cloud"],
                "prizes": "$100,000",
            },
            {
                "name": "AWS DeepRacer Student League",
                "organizer": "Amazon Web Services",
                "dates": f"Rolling - {year}",
                "location": "Online",
                "url": "https://aws.amazon.com/deepracer/student/",
                "source": "AWS",
                "tags": ["Program", "AI", "Cloud"],
                "prizes": "Scholarships",
            },
            {
                "name": "BUILDATHON by Google for Developers",
                "organizer": "Google for Developers",
                "dates": f"{year}",
                "location": "Online",
                "url": "https://developers.google.com/",
                "source": "Google",
                "tags": ["Hackathon", "Google", "AI"],
                "prizes": "Cash & Swag",
            },
        ]

        print(f"Adding {len(curated)} curated programs & hackathons...")
        for item in curated:
            if is_past_event(item["dates"]):
                print(f"  SKIPPED (past): {item['name']} ({item['dates']})")
                continue
            item["created_at"] = datetime.now().isoformat()
            print(f"  Adding: {item['name']}")
            self.save_hackathon(item)

    def cleanup_past_events(self):
        """Remove past events from the hackathons table."""
        print("Cleaning up past events from DB...")
        try:
            r = self.supabase.table("hackathons").select("id,name,dates").execute()
            rows = r.data or []
            removed = 0
            for row in rows:
                if is_past_event(row.get("dates")):
                    try:
                        self.supabase.table("hackathons").delete().eq("id", row["id"]).execute()
                        print(f"  Removed past event: {row['name']} ({row.get('dates')})")
                        removed += 1
                    except Exception as e:
                        print(f"  Error removing {row['name']}: {e}")
            print(f"  Cleanup complete: removed {removed} past events")
        except Exception as e:
            print(f"  Cleanup error: {e}")

    def run(self):
        # 0. Clean up past events first
        self.cleanup_past_events()

        # 1. MLH
        self.scrape_mlh()

        # 2. Unstop
        try:
            UnstopScraper().scrape_hackathons()
        except Exception as e:
            print(f"Error running Unstop scraper: {e}")

        # 3. HackerEarth
        try:
            HackerEarthScraper().run()
        except Exception as e:
            print(f"Error running HackerEarth scraper: {e}")

        # 4. Devfolio
        try:
            self.scrape_devfolio()
        except Exception as e:
            print(f"Error running Devfolio scraper: {e}")

        # 5. Curated programs
        try:
            self.add_curated_programs()
        except Exception as e:
            print(f"Error adding curated programs: {e}")


if __name__ == "__main__":
    HackathonScraper().run()
