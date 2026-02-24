"""
Remotive API Adapter
FREE, unlimited, no API key needed.
Focuses on remote tech jobs worldwide.
"""

import asyncio
import requests
import logging
from .base_adapter import BaseAdapter, OpportunityResult

logger = logging.getLogger(__name__)

# Remotive category mapping
CATEGORY_MAP = {
    "software": "software-dev",
    "data": "data",
    "design": "design",
    "marketing": "marketing",
    "devops": "devops-sysadmin",
    "product": "product",
    "qa": "qa",
    "writing": "writing",
}


class RemotiveAdapter(BaseAdapter):
    """Remotive API — Free remote tech jobs (NO API key needed!)"""

    SOURCE_NAME = "remotive"
    BASE_URL = "https://remotive.com/api/remote-jobs"

    def _search_sync(self, query: str = "",
                     category: str = "",
                     limit: int = 20) -> list[OpportunityResult]:
        """Synchronous search"""
        params = {"limit": str(limit)}
        if query:
            params["search"] = query
        if category:
            mapped = CATEGORY_MAP.get(category.lower(), "")
            if mapped:
                params["category"] = mapped

        try:
            response = requests.get(self.BASE_URL, params=params, timeout=15)
            if response.status_code != 200:
                logger.warning(f"Remotive returned status {response.status_code}")
                return []

            data = response.json()
            results = []

            for job in data.get("jobs", []):
                title = job.get("title", "")
                description = self._clean_text(
                    job.get("description", "")[:500]
                )
                tags_raw = job.get("tags", []) or []

                results.append(OpportunityResult(
                    title=title,
                    company=job.get("company_name", "Unknown"),
                    location=job.get("candidate_required_location", "Remote"),
                    url=job.get("url", ""),
                    source=self.SOURCE_NAME,
                    type=self._detect_type(title, description),
                    country="REMOTE",
                    is_remote=True,
                    salary=job.get("salary", None) or None,
                    posted_date=job.get("publication_date", ""),
                    tags=tags_raw if isinstance(tags_raw, list) else [],
                    description=description,
                ))

            logger.info(f"Remotive returned {len(results)} results")
            return results

        except requests.exceptions.Timeout:
            logger.warning("Remotive request timed out")
            return []
        except Exception as e:
            logger.error(f"Remotive error: {e}")
            return []

    async def search(self, query: str = "",
                     category: str = "") -> list[OpportunityResult]:
        """Async wrapper"""
        return await asyncio.to_thread(self._search_sync, query, category)
