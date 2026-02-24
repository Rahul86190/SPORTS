"""
Opportunity Service — Main orchestrator.
Coordinates API adapters, caching, scoring, and international programs.
"""

import asyncio
import logging
from typing import Optional

from backend.database import get_supabase
from backend.adapters.jsearch_adapter import JSearchAdapter
from backend.adapters.adzuna_adapter import AdzunaAdapter
from backend.adapters.remotive_adapter import RemotiveAdapter
from backend.adapters.arbeitnow_adapter import ArbeitnowAdapter
from backend.services.query_builder import build_queries
from backend.services.match_scorer import score_opportunities
from backend.services.platform_registry import get_sources_for_user
from backend.services.cache_service import build_cache_key, get_cached, set_cached

logger = logging.getLogger(__name__)


class OpportunityService:
    """Main service that orchestrates all opportunity search logic"""

    def __init__(self):
        self.jsearch = JSearchAdapter()
        self.adzuna = AdzunaAdapter()
        self.remotive = RemotiveAdapter()
        self.arbeitnow = ArbeitnowAdapter()

    async def search(self, profile: dict, force_refresh: bool = False) -> dict:
        """
        Main search entry point.
        1. Check cache
        2. Build queries from profile
        3. Fetch from all sources in parallel (multiple queries)
        4. Deduplicate + Score + Sort
        5. Cache results
        6. Return
        """
        cache_key = build_cache_key(profile)

        # Check cache (unless force refresh)
        if not force_refresh:
            cached = await get_cached(cache_key)
            if cached:
                # Re-score cached results with current profile
                opportunities = cached.get("opportunities", [])
                scored = await score_opportunities(opportunities, profile)
                return {
                    "opportunities": scored,
                    "total": len(scored),
                    "cached": True,
                    "source_breakdown": cached.get("source_breakdown", {}),
                }

        # Build search queries from profile
        queries = build_queries(profile)
        country = (profile.get("country") or "IN").upper()

        # Determine which sources to use
        sources = get_sources_for_user(country)
        logger.info(f"Searching {len(sources)} sources for country={country}, queries={queries}")

        # Fetch from all sources in parallel — use MULTIPLE queries per source
        all_results = []
        source_breakdown = {}

        tasks = []
        task_names = []

        primary_query = queries[0] if queries else "software developer"
        secondary_query = queries[1] if len(queries) > 1 else primary_query
        broad_query = queries[-1] if len(queries) > 2 else primary_query

        if "jsearch" in sources:
            # JSearch: use primary query (rate-limited, so conserve calls)
            tasks.append(self._fetch_jsearch(primary_query, country))
            task_names.append("jsearch")

        if "adzuna" in sources:
            # Adzuna: use TWO queries to get more diverse results
            tasks.append(self._fetch_adzuna_multi(primary_query, secondary_query, country))
            task_names.append("adzuna")

        if "remotive" in sources:
            # Remotive: use broad + primary query for remote jobs
            tasks.append(self._fetch_remotive_multi(primary_query, broad_query))
            task_names.append("remotive")

        if "arbeitnow" in sources:
            # Arbeitnow: fetch 2 pages with broad query
            tasks.append(self._fetch_arbeitnow_multi(primary_query))
            task_names.append("arbeitnow")

        # Execute all in parallel
        results_list = await asyncio.gather(*tasks, return_exceptions=True)

        for name, result in zip(task_names, results_list):
            if isinstance(result, Exception):
                logger.warning(f"Source {name} failed: {result}")
                source_breakdown[name] = 0
            elif isinstance(result, list):
                all_results.extend(result)
                source_breakdown[name] = len(result)
                logger.info(f"Source {name} returned {len(result)} results")
            else:
                source_breakdown[name] = 0

        # Fetch international programs from our own DB
        programs = await self._fetch_international_programs(profile)
        all_results.extend(programs)
        source_breakdown["international_programs"] = len(programs)

        # Deduplicate
        deduped = self._deduplicate(all_results)

        # Convert OpportunityResult objects to dicts
        opportunities = []
        for item in deduped:
            if hasattr(item, 'to_dict'):
                opportunities.append(item.to_dict())
            elif isinstance(item, dict):
                opportunities.append(item)

        # Score and sort
        scored = await score_opportunities(opportunities, profile)

        # Cache the results
        cache_data = {
            "opportunities": scored,
            "source_breakdown": source_breakdown,
        }
        await set_cached(cache_key, cache_data)

        return {
            "opportunities": scored,
            "total": len(scored),
            "cached": False,
            "source_breakdown": source_breakdown,
        }

    async def _fetch_jsearch(self, query: str, country: str) -> list:
        """Fetch from JSearch with error handling"""
        try:
            return await self.jsearch.search(query, country)
        except Exception as e:
            logger.warning(f"JSearch failed: {e}")
            return []

    async def _fetch_adzuna_multi(self, query1: str, query2: str, country: str) -> list:
        """Fetch from Adzuna with TWO queries for diversity"""
        try:
            results1, results2 = await asyncio.gather(
                self.adzuna.search(query1, country),
                self.adzuna.search(query2, country),
                return_exceptions=True,
            )
            combined = []
            if isinstance(results1, list):
                combined.extend(results1)
            if isinstance(results2, list):
                combined.extend(results2)
            return combined
        except Exception as e:
            logger.warning(f"Adzuna failed: {e}")
            return []

    async def _fetch_remotive_multi(self, query: str, broad_query: str) -> list:
        """Fetch from Remotive with primary + broad query for more results"""
        try:
            # First, try specific query; then broad; also a category-based fetch
            results1, results2, results3 = await asyncio.gather(
                self.remotive.search(query),
                self.remotive.search(broad_query),
                self.remotive.search(""),  # fetch latest remote jobs (no filter)
                return_exceptions=True,
            )
            combined = []
            if isinstance(results1, list):
                combined.extend(results1)
            if isinstance(results2, list):
                combined.extend(results2)
            if isinstance(results3, list):
                combined.extend(results3[:10])  # limit unfiltered to 10
            return combined
        except Exception as e:
            logger.warning(f"Remotive failed: {e}")
            return []

    async def _fetch_arbeitnow_multi(self, query: str) -> list:
        """Fetch from Arbeitnow with broad + paginated results"""
        try:
            # Fetch page 1 (broad) + page 1 with query filter
            results1, results2 = await asyncio.gather(
                self.arbeitnow.search(""),  # all tech jobs, no filter
                self.arbeitnow.search(query),
                return_exceptions=True,
            )
            combined = []
            if isinstance(results1, list):
                combined.extend(results1)
            if isinstance(results2, list):
                combined.extend(results2)
            return combined
        except Exception as e:
            logger.warning(f"Arbeitnow failed: {e}")
            return []

    async def _fetch_international_programs(self, profile: dict) -> list:
        """Fetch matching international programs from our DB"""
        try:
            supabase = get_supabase()
            if not supabase:
                return []

            result = supabase.table("international_programs") \
                .select("*") \
                .eq("is_active", True) \
                .execute()

            if not result.data:
                return []

            programs = result.data
            matched = self._match_programs(programs, profile)

            # Convert to opportunity-like dicts
            opportunities = []
            for prog in matched:
                opportunities.append({
                    "id": prog.get("id", ""),
                    "title": prog["name"],
                    "company": prog.get("organization", ""),
                    "location": prog.get("country", "International"),
                    "url": prog.get("application_url", ""),
                    "source": "international_programs",
                    "type": "program",
                    "country": prog.get("country", ""),
                    "is_remote": False,
                    "is_international": True,
                    "is_fully_funded": prog.get("is_fully_funded", False),
                    "description": prog.get("description", ""),
                    "tags": prog.get("tags", []) or prog.get("fields", []) or [],
                    "deadline": prog.get("deadline_text", ""),
                    "stipend": prog.get("stipend", ""),
                    "duration": prog.get("duration", ""),
                    "posted_date": "",
                    "salary": prog.get("stipend", None),
                })

            return opportunities
        except Exception as e:
            logger.warning(f"Failed to fetch international programs: {e}")
            return []

    def _match_programs(self, programs: list, profile: dict) -> list:
        """Filter international programs based on user profile"""
        matched = []
        user_country = (profile.get("country") or "").upper()
        user_skills = set(s.lower() for s in profile.get("skills", []))
        user_goal = (profile.get("career_goal") or "").lower()

        for prog in programs:
            eligibility = prog.get("eligibility") or {}

            # Check country eligibility
            open_to = eligibility.get("open_to", ["ALL"])
            if isinstance(open_to, list):
                if "ALL" not in open_to and user_country not in open_to:
                    continue

            # Check field match (if specified) — be more lenient
            fields = prog.get("fields") or []
            if fields and user_skills:
                combined = user_skills | {user_goal}
                if not any(f.lower() in str(combined).lower() for f in fields):
                    continue
            # If no skills at all, still include the program

            matched.append(prog)

        return matched

    def _deduplicate(self, results: list) -> list:
        """Remove duplicate opportunities based on title+company similarity"""
        seen = set()
        unique = []
        for item in results:
            if hasattr(item, 'title'):
                key = f"{item.title.lower().strip()[:50]}|{item.company.lower().strip()}"
            elif isinstance(item, dict):
                key = f"{item.get('title', '').lower().strip()[:50]}|{item.get('company', '').lower().strip()}"
            else:
                unique.append(item)
                continue

            if key not in seen:
                seen.add(key)
                unique.append(item)

        return unique
