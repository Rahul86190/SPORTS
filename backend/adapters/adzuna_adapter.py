"""
Adzuna API Adapter
Secondary job search — covers 16 countries with localized results.
Free tier: 250 requests/month
"""

import os
import asyncio
import requests
import logging
from .base_adapter import BaseAdapter, OpportunityResult

logger = logging.getLogger(__name__)

# Adzuna country code mapping (ISO to Adzuna's country code)
ADZUNA_COUNTRIES = {
    "IN": "in", "US": "us", "GB": "gb", "UK": "gb", "AU": "au",
    "DE": "de", "FR": "fr", "CA": "ca", "NL": "nl", "BR": "br",
    "IT": "it", "PL": "pl", "RU": "ru", "SG": "sg", "ZA": "za",
    "NZ": "nz", "AT": "at",
}


class AdzunaAdapter(BaseAdapter):
    """Adzuna API — Secondary job search for 16 countries"""

    SOURCE_NAME = "adzuna"

    def __init__(self):
        self.app_id = os.environ.get("ADZUNA_APP_ID", "")
        self.app_key = os.environ.get("ADZUNA_APP_KEY", "")

    def _get_base_url(self, country: str) -> str:
        adzuna_country = ADZUNA_COUNTRIES.get(country, "us")
        return f"https://api.adzuna.com/v1/api/jobs/{adzuna_country}/search/1"

    def is_supported(self, country: str) -> bool:
        """Check if Adzuna supports this country"""
        return country in ADZUNA_COUNTRIES

    def _search_sync(self, query: str, country: str = "IN",
                     max_days_old: int = 14,
                     results_per_page: int = 20) -> list[OpportunityResult]:
        """Synchronous search"""
        if not self.app_id or not self.app_key:
            logger.warning("Adzuna API credentials not set")
            return []

        if not self.is_supported(country):
            logger.info(f"Adzuna does not support country: {country}")
            return []

        url = self._get_base_url(country)
        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "what": query,
            "results_per_page": str(results_per_page),
            "max_days_old": str(max_days_old),
            "content-type": "application/json",
        }

        try:
            response = requests.get(url, params=params, timeout=15)
            if response.status_code == 401:
                logger.warning("Adzuna authentication failed")
                return []
            if response.status_code == 429:
                logger.warning("Adzuna rate limit exceeded")
                return []
            if response.status_code != 200:
                logger.warning(f"Adzuna returned status {response.status_code}")
                return []

            data = response.json()
            results = []

            for job in data.get("results", []):
                title = job.get("title", "")
                description = self._clean_text(
                    job.get("description", "")[:500]
                )
                location_data = job.get("location", {})
                display_name = location_data.get("display_name", "")
                area = location_data.get("area", [])

                results.append(OpportunityResult(
                    title=title,
                    company=job.get("company", {}).get("display_name", "Unknown"),
                    location=display_name,
                    url=job.get("redirect_url", ""),
                    source=self.SOURCE_NAME,
                    type=self._detect_type(title, description),
                    city=area[-1] if area else None,
                    state=area[-2] if len(area) >= 2 else None,
                    country=country,
                    is_remote=self._detect_remote(title + " " + display_name),
                    salary=self._format_salary(job),
                    posted_date=job.get("created", ""),
                    tags=job.get("category", {}).get("tag", "").split(",") if job.get("category") else [],
                    description=description,
                ))

            logger.info(f"Adzuna returned {len(results)} results for '{query}'")
            return results

        except requests.exceptions.Timeout:
            logger.warning("Adzuna request timed out")
            return []
        except Exception as e:
            logger.error(f"Adzuna error: {e}")
            return []

    def _format_salary(self, job: dict) -> str | None:
        """Format salary range from Adzuna data"""
        min_sal = job.get("salary_min")
        max_sal = job.get("salary_max")
        if min_sal and max_sal:
            return f"₹{int(min_sal):,} - ₹{int(max_sal):,}"
        elif min_sal:
            return f"₹{int(min_sal):,}+"
        return None

    async def search(self, query: str, country: str = "IN",
                     max_days_old: int = 14) -> list[OpportunityResult]:
        """Async wrapper"""
        return await asyncio.to_thread(
            self._search_sync, query, country, max_days_old
        )
