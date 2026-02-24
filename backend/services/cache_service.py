"""
Cache Service — 2-level caching for opportunity results.
L1: In-memory Python dict (30 min TTL)
L2: Supabase opportunity_cache table (2 hour TTL)
"""

import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from backend.database import get_supabase

logger = logging.getLogger(__name__)

# L1: In-memory cache
_memory_cache: dict[str, dict] = {}
_memory_ttl = timedelta(minutes=30)


def build_cache_key(profile: dict) -> str:
    """Build cache key from profile. Similar profiles share cache."""
    country = (profile.get("country") or "UNKNOWN").upper()
    skills = sorted([s.lower() for s in profile.get("skills", [])[:3]])
    level = profile.get("experience_level", "student")
    raw = f"{country}:{':'.join(skills)}:{level}"
    return hashlib.md5(raw.encode()).hexdigest()


async def get_cached(cache_key: str) -> dict | None:
    """Check both cache levels. Returns cached data or None."""
    now = datetime.now(timezone.utc)

    # L1: Check in-memory
    if cache_key in _memory_cache:
        entry = _memory_cache[cache_key]
        if datetime.fromisoformat(entry["expires_at"]) > now:
            logger.info(f"Cache L1 HIT for key {cache_key[:8]}...")
            return entry
        else:
            del _memory_cache[cache_key]

    # L2: Check Supabase
    try:
        supabase = get_supabase()
        if supabase:
            result = supabase.table("opportunity_cache") \
                .select("*") \
                .eq("cache_key", cache_key) \
                .gt("expires_at", now.isoformat()) \
                .execute()
            if result.data and len(result.data) > 0:
                entry = result.data[0]
                data = {
                    "opportunities": entry["results"],
                    "source_breakdown": entry.get("source_breakdown"),
                    "cached_at": entry["created_at"],
                    "expires_at": entry["expires_at"],
                }
                # Promote to L1
                _memory_cache[cache_key] = data
                logger.info(f"Cache L2 HIT for key {cache_key[:8]}...")
                return data
    except Exception as e:
        logger.debug(f"L2 cache check failed: {e}")

    logger.info(f"Cache MISS for key {cache_key[:8]}...")
    return None


async def set_cached(cache_key: str, data: dict, ttl_seconds: int = 7200):
    """Store in both cache levels."""
    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(seconds=ttl_seconds)).isoformat()

    # Attach expiry
    data["expires_at"] = expires_at
    data["cached_at"] = now.isoformat()

    # L1: In-memory
    _memory_cache[cache_key] = data

    # L2: Supabase
    try:
        supabase = get_supabase()
        if supabase:
            supabase.table("opportunity_cache").upsert({
                "cache_key": cache_key,
                "results": data.get("opportunities", []),
                "source_breakdown": data.get("source_breakdown"),
                "expires_at": expires_at,
            }).execute()
            logger.info(f"Cached {len(data.get('opportunities', []))} results for key {cache_key[:8]}...")
    except Exception as e:
        logger.debug(f"L2 cache write failed: {e}")


async def clear_expired():
    """Remove expired entries from L2 cache"""
    try:
        supabase = get_supabase()
        if supabase:
            now = datetime.now(timezone.utc).isoformat()
            supabase.table("opportunity_cache") \
                .delete() \
                .lt("expires_at", now) \
                .execute()
    except Exception as e:
        logger.debug(f"Cache cleanup failed: {e}")
