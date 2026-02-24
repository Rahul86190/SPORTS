"""
JSearch API Adapter (via RapidAPI)
Primary global job search — indexes Google Jobs (LinkedIn, Indeed, Naukri, Glassdoor, etc.)
Free tier: 200 requests/month
"""

import os
import asyncio
import requests
import logging
from typing import Optional
from .base_adapter import BaseAdapter, OpportunityResult

logger = logging.getLogger(__name__)

# Country code to human-readable name for query building
COUNTRY_NAMES = {
    "IN": "India", "US": "United States", "UK": "United Kingdom",
    "CA": "Canada", "AU": "Australia", "DE": "Germany", "FR": "France",
    "JP": "Japan", "SG": "Singapore", "NL": "Netherlands", "BR": "Brazil",
    "AE": "UAE", "SA": "Saudi Arabia", "NZ": "New Zealand", "IE": "Ireland",
}


class JSearchAdapter(BaseAdapter):
    """JSearch (RapidAPI) — Primary global job search engine"""

    SOURCE_NAME = "jsearch"
    BASE_URL = "https://jsearch.p.rapidapi.com/search"

    def __init__(self):
        self.api_key = os.environ.get("JSEARCH_API_KEY", "")

    def _search_sync(self, query: str, country: str = "",
                     remote_only: bool = False,
                     date_posted: str = "week",
                     num_pages: int = 1) -> list[OpportunityResult]:
        """Synchronous search — called via asyncio.to_thread"""
        if not self.api_key:
            logger.warning("JSearch API key not set")
            return []

        # Build query with country context
        country_name = COUNTRY_NAMES.get(country, country)
        full_query = f"{query} {country_name}".strip() if country_name else query

        params = {
            "query": full_query,
            "page": "1",
            "num_pages": str(num_pages),
            "date_posted": date_posted,
        }
        if remote_only:
            params["remote_jobs_only"] = "true"

        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
        }

        try:
            response = requests.get(self.BASE_URL, params=params,
                                    headers=headers, timeout=15)
            if response.status_code == 429:
                logger.warning("JSearch rate limit exceeded")
                return []
            if response.status_code != 200:
                logger.warning(f"JSearch returned status {response.status_code}")
                return []

            data = response.json()
            results = []

            for job in data.get("data", []):
                title = job.get("job_title", "")
                description = self._clean_text(
                    job.get("job_description", "")[:500]
                )
                location = job.get("job_city", "")
                if job.get("job_state"):
                    location = f"{location}, {job['job_state']}"
                if job.get("job_country"):
                    location = f"{location}, {job['job_country']}"

                results.append(OpportunityResult(
                    title=title,
                    company=job.get("employer_name", "Unknown"),
                    location=location.strip(", "),
                    url=job.get("job_apply_link", "") or job.get("job_google_link", ""),
                    source=self.SOURCE_NAME,
                    type=self._detect_type(title, description),
                    city=job.get("job_city"),
                    state=job.get("job_state"),
                    country=job.get("job_country", country),
                    is_remote=job.get("job_is_remote", False) or self._detect_remote(location),
                    salary=job.get("job_min_salary", None),
                    posted_date=job.get("job_posted_at_datetime_utc", ""),
                    tags=job.get("job_required_skills") or [],
                    description=description,
                ))

            logger.info(f"JSearch returned {len(results)} results for '{full_query}'")
            return results

        except requests.exceptions.Timeout:
            logger.warning("JSearch request timed out")
            return []
        except Exception as e:
            logger.error(f"JSearch error: {e}")
            return []

    async def search(self, query: str, country: str = "",
                     remote_only: bool = False,
                     date_posted: str = "week") -> list[OpportunityResult]:
        """Async wrapper for search"""
        return await asyncio.to_thread(
            self._search_sync, query, country, remote_only, date_posted
        )
