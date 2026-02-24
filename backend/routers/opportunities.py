"""
Opportunities API Router — Unified endpoints for Jobs, Internships, Hackathons.
Merges scraped DB data + live API adapter results.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import logging

from backend.database import get_supabase
from backend.services.opportunity_service import OpportunityService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/opportunities", tags=["Opportunities"])

_service = OpportunityService()


class SearchRequest(BaseModel):
    user_id: str
    force_refresh: bool = False


class BookmarkRequest(BaseModel):
    user_id: str
    opportunity_data: dict
    source: str = ""


class BookmarkUpdateRequest(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


# ─── Unified Search ─────────────────────────────────────────────
@router.post("/search")
async def search_opportunities(request: SearchRequest):
    """
    Main search: fetches user profile, builds queries,
    searches all live API sources, scores, returns results.
    """
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        profile_result = supabase.table("profiles") \
            .select("*") \
            .eq("id", request.user_id) \
            .execute()

        if not profile_result.data or len(profile_result.data) == 0:
            return {
                "opportunities": [],
                "total": 0,
                "cached": False,
                "source_breakdown": {},
                "message": "Complete your profile to get personalized results",
            }

        profile = profile_result.data[0]
        skills = profile.get("skills", [])
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]
        profile["skills"] = skills

        result = await _service.search(profile, force_refresh=request.force_refresh)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── DB Tables (scraped data) ──────────────────────────────────
@router.get("/db/jobs")
async def get_db_jobs(limit: int = Query(100, ge=1, le=500)):
    """Read jobs from the scraped `jobs` table"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        result = supabase.table("jobs") \
            .select("*") \
            .order("posted_at", desc=True) \
            .limit(limit) \
            .execute()

        rows = result.data or []
        # Normalize into unified format
        items = []
        for r in rows:
            title = r.get("title", "")
            job_type = (r.get("type") or "").lower()
            if "intern" in job_type or "intern" in title.lower():
                category = "internship"
            else:
                category = "job"

            location = r.get("location", "")
            items.append({
                "id": str(r.get("id", "")),
                "title": title,
                "company": r.get("company", ""),
                "location": location,
                "url": r.get("url", ""),
                "source": r.get("source", ""),
                "type": category,
                "salary": r.get("salary_range", None),
                "posted_date": r.get("posted_at", ""),
                "is_remote": "remote" in location.lower() or "work from home" in location.lower(),
                "tags": [],
                "description": "",
            })

        return {"items": items, "total": len(items)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DB jobs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/db/hackathons")
async def get_db_hackathons(limit: int = Query(100, ge=1, le=500)):
    """Read hackathons from the scraped `hackathons` table — excludes past events"""
    try:
        from backend.scrapers.hackathons import is_past_event

        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        result = supabase.table("hackathons") \
            .select("*") \
            .limit(limit) \
            .execute()

        rows = result.data or []
        items = []
        for r in rows:
            # Skip past events
            dates_str = r.get("dates", "")
            if is_past_event(dates_str):
                continue

            tags = r.get("tags", []) or []
            if isinstance(tags, str):
                tags = [t.strip() for t in tags.split(",") if t.strip()]

            items.append({
                "id": str(r.get("id", "")),
                "title": r.get("name", ""),
                "company": r.get("organizer", ""),
                "location": r.get("location", "Online"),
                "url": r.get("url", ""),
                "source": r.get("source", ""),
                "type": "hackathon",
                "dates": dates_str,
                "prizes": r.get("prizes", ""),
                "tags": tags,
                "is_remote": "online" in (r.get("location") or "").lower(),
            })

        return {"items": items, "total": len(items)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DB hackathons error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── International Programs ────────────────────────────────────
@router.get("/international-programs")
async def get_international_programs(user_id: str = Query(None)):
    """Get international programs, optionally filtered by user profile"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        result = supabase.table("international_programs") \
            .select("*") \
            .eq("is_active", True) \
            .execute()

        programs = result.data or []

        if user_id and programs:
            profile_result = supabase.table("profiles") \
                .select("*") \
                .eq("id", user_id) \
                .execute()
            if profile_result.data:
                profile = profile_result.data[0]
                skills = profile.get("skills", [])
                if isinstance(skills, str):
                    skills = [s.strip() for s in skills.split(",") if s.strip()]
                profile["skills"] = skills
                programs = _service._match_programs(programs, profile)

        return {"programs": programs, "total": len(programs)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"International programs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Scrape Trigger ────────────────────────────────────────────
@router.post("/scrape")
async def trigger_scrape():
    """Trigger the scrapers to refresh DB data"""
    results = {}
    try:
        from backend.scrapers.jobs import JobScraper
        JobScraper().run()
        results["jobs"] = "ok"
    except Exception as e:
        logger.warning(f"Job scrape failed: {e}")
        results["jobs"] = str(e)

    try:
        from backend.scrapers.hackathons import HackathonScraper
        HackathonScraper().run()
        results["hackathons"] = "ok"
    except Exception as e:
        logger.warning(f"Hackathon scrape failed: {e}")
        results["hackathons"] = str(e)

    return {"message": "Scrape completed", "results": results}


# ─── Bookmarks ─────────────────────────────────────────────────
@router.post("/bookmark")
async def add_bookmark(request: BookmarkRequest):
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        result = supabase.table("user_bookmarks").insert({
            "user_id": request.user_id,
            "opportunity_data": request.opportunity_data,
            "source": request.source,
            "status": "saved",
        }).execute()

        return {"success": True, "bookmark": result.data[0] if result.data else None}
    except Exception as e:
        logger.error(f"Bookmark error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bookmarks")
async def get_bookmarks(user_id: str = Query(...)):
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        result = supabase.table("user_bookmarks") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("bookmarked_at", desc=True) \
            .execute()

        return {"bookmarks": result.data or [], "total": len(result.data or [])}
    except Exception as e:
        logger.error(f"Get bookmarks error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/bookmark/{bookmark_id}")
async def remove_bookmark(bookmark_id: str):
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        supabase.table("user_bookmarks") \
            .delete() \
            .eq("id", bookmark_id) \
            .execute()

        return {"success": True}
    except Exception as e:
        logger.error(f"Delete bookmark error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/bookmark/{bookmark_id}")
async def update_bookmark(bookmark_id: str, request: BookmarkUpdateRequest):
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        updates = {}
        if request.status:
            updates["status"] = request.status
        if request.notes is not None:
            updates["notes"] = request.notes

        if updates:
            supabase.table("user_bookmarks") \
                .update(updates) \
                .eq("id", bookmark_id) \
                .execute()

        return {"success": True}
    except Exception as e:
        logger.error(f"Update bookmark error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
