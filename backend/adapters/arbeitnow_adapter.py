"""
Arbeitnow API Adapter
FREE, unlimited, no API key needed.
Global tech/engineering jobs.
"""

import asyncio
import requests
import logging
from .base_adapter import BaseAdapter, OpportunityResult

logger = logging.getLogger(__name__)


class ArbeitnowAdapter(BaseAdapter):
    """Arbeitnow API — Free global tech jobs (NO API key needed!)"""

    SOURCE_NAME = "arbeitnow"
    BASE_URL = "https://www.arbeitnow.com/api/job-board-api"

    def _search_sync(self, query: str = "",
                     page: int = 1) -> list[OpportunityResult]:
        """Synchronous search"""
        params = {"page": str(page)}

        try:
            response = requests.get(self.BASE_URL, params=params, timeout=15)
            if response.status_code != 200:
                logger.warning(f"Arbeitnow returned status {response.status_code}")
                return []

            data = response.json()
            results = []
            query_lower = query.lower() if query else ""

            for job in data.get("data", []):
                title = job.get("title", "")
                description = self._clean_text(
                    job.get("description", "")[:500]
                )
                tags_raw = job.get("tags", []) or []
                location = job.get("location", "")

                # Client-side filtering by query — match ANY word (fuzzy)
                if query_lower:
                    searchable = f"{title} {description} {' '.join(tags_raw)}".lower()
                    query_words = [w for w in query_lower.split() if len(w) > 2]
                    if query_words and not any(w in searchable for w in query_words):
                        continue

                results.append(OpportunityResult(
                    title=title,
                    company=job.get("company_name", "Unknown"),
                    location=location,
                    url=job.get("url", ""),
                    source=self.SOURCE_NAME,
                    type=self._detect_type(title, description),
                    country="",  # Arbeitnow doesn't always provide country
                    is_remote=job.get("remote", False) or self._detect_remote(location),
                    posted_date=job.get("created_at", ""),
                    tags=tags_raw if isinstance(tags_raw, list) else [],
                    description=description,
                ))

            logger.info(f"Arbeitnow returned {len(results)} results")
            return results

        except requests.exceptions.Timeout:
            logger.warning("Arbeitnow request timed out")
            return []
        except Exception as e:
            logger.error(f"Arbeitnow error: {e}")
            return []

    async def search(self, query: str = "") -> list[OpportunityResult]:
        """Async wrapper"""
        return await asyncio.to_thread(self._search_sync, query)
