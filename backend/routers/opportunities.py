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


# ─── International Opportunities ───────────────────────────────

from datetime import datetime as _dt

def _curated_international_programs():
    """Hand-curated list of well-known international programs that are always shown."""
    year = _dt.now().year
    return [
        {
            "id": "curated-gsoc", "title": "Google Summer of Code (GSoC)",
            "company": "Google", "location": "Remote / Worldwide",
            "url": "https://summerofcode.withgoogle.com/",
            "source": "Curated", "type": "program", "category": "program",
            "dates": f"Jan – Nov {year}", "is_remote": True, "pinned": True,
            "tags": ["Open Source", "Coding", "Stipend"],
            "description": "Contribute to open-source projects under mentorship from global orgs. Stipend provided.",
        },
        {
            "id": "curated-mlh-fellowship", "title": "MLH Fellowship",
            "company": "Major League Hacking", "location": "Remote / Worldwide",
            "url": "https://fellowship.mlh.io/",
            "source": "Curated", "type": "internship", "category": "program",
            "dates": f"Spring, Summer, Fall {year}", "is_remote": True, "pinned": True,
            "tags": ["Fellowship", "Open Source", "Stipend"],
            "description": "12-week internship alternative. Work on real open-source projects with a stipend.",
        },
        {
            "id": "curated-outreachy", "title": "Outreachy Internship",
            "company": "Outreachy / Software Freedom Conservancy", "location": "Remote / Worldwide",
            "url": "https://www.outreachy.org/",
            "source": "Curated", "type": "internship", "category": "program",
            "dates": f"May – Aug & Dec – Mar {year}", "is_remote": True, "pinned": True,
            "tags": ["Diversity", "Open Source", "Paid Internship"],
            "description": "Paid remote internship for underrepresented groups in tech. 3-month placements.",
        },
        {
            "id": "curated-lfx", "title": "LFX Mentorship (Linux Foundation)",
            "company": "Linux Foundation", "location": "Remote / Worldwide",
            "url": "https://mentorship.lfx.linuxfoundation.org/",
            "source": "Curated", "type": "internship", "category": "program",
            "dates": f"3 terms per year {year}", "is_remote": True, "pinned": True,
            "tags": ["Open Source", "Mentorship", "Stipend"],
            "description": "Mentorship programs for CNCF, Hyperledger, and other Linux Foundation projects.",
        },
        {
            "id": "curated-github-octernships", "title": "GitHub Octernships",
            "company": "GitHub", "location": "Remote / Worldwide",
            "url": "https://education.github.com/students",
            "source": "Curated", "type": "internship", "category": "program",
            "dates": "Rolling", "is_remote": True, "pinned": True,
            "tags": ["Internship", "GitHub", "Paid"],
            "description": "Paid internships at GitHub partner companies for students worldwide.",
        },
        {
            "id": "curated-google-arcade", "title": "Google Cloud Arcade Facilitator Program",
            "company": "Google Cloud", "location": "Remote / Worldwide",
            "url": "https://rsvp.withgoogle.com/events/arcade-facilitator/",
            "source": "Curated", "type": "program", "category": "program",
            "dates": f"Multiple rounds {year}", "is_remote": True, "pinned": True,
            "tags": ["Cloud", "Google", "Free Certification"],
            "description": "Earn Google Cloud skill badges and certifications for free through hands-on labs.",
        },
        {
            "id": "curated-genai-intensive", "title": "Google Gen AI Intensive",
            "company": "Google / Kaggle", "location": "Remote / Worldwide",
            "url": "https://rsvp.withgoogle.com/events/google-generative-ai-intensive",
            "source": "Curated", "type": "program", "category": "program",
            "dates": f"Rolling {year}", "is_remote": True, "pinned": True,
            "tags": ["AI", "Machine Learning", "Google"],
            "description": "5-day intensive course on Generative AI fundamentals by Google & Kaggle experts.",
        },
        {
            "id": "curated-imagine-cup", "title": "Microsoft Imagine Cup",
            "company": "Microsoft", "location": "Worldwide",
            "url": "https://imaginecup.microsoft.com/",
            "source": "Curated", "type": "hackathon", "category": "summit",
            "dates": f"Annual {year}", "is_remote": False, "pinned": True,
            "tags": ["AI", "Azure", "Competition", "$100K Prize"],
            "description": "Global tech competition. Build innovative solutions using Microsoft tech. $100K grand prize.",
        },
        {
            "id": "curated-icpc", "title": "ICPC — International Programming Contest",
            "company": "ICPC Foundation", "location": "Worldwide",
            "url": "https://icpc.global/",
            "source": "Curated", "type": "hackathon", "category": "summit",
            "dates": f"Regionals → World Finals {year}", "is_remote": False, "pinned": True,
            "tags": ["Competitive Programming", "Team Contest"],
            "description": "World's oldest and most prestigious programming contest for university students.",
        },
        {
            "id": "curated-meta-hacker-cup", "title": "Meta Hacker Cup",
            "company": "Meta", "location": "Remote / Worldwide",
            "url": "https://www.facebook.com/codingcompetitions/hacker-cup",
            "source": "Curated", "type": "hackathon", "category": "summit",
            "dates": f"Annual {year}", "is_remote": True, "pinned": True,
            "tags": ["Competitive Programming", "Prizes"],
            "description": "Global competitive programming contest hosted by Meta with cash prizes.",
        },
        {
            "id": "curated-hacktoberfest", "title": "Hacktoberfest",
            "company": "DigitalOcean", "location": "Remote / Worldwide",
            "url": "https://hacktoberfest.com/",
            "source": "Curated", "type": "program", "category": "program",
            "dates": f"October {year}", "is_remote": True, "pinned": True,
            "tags": ["Open Source", "Swag", "Beginner Friendly"],
            "description": "Month-long celebration of open source. Contribute to earn rewards and recognition.",
        },
        {
            "id": "curated-aws-deepracer", "title": "AWS DeepRacer Student League",
            "company": "Amazon Web Services", "location": "Remote / Worldwide",
            "url": "https://aws.amazon.com/deepracer/student/",
            "source": "Curated", "type": "program", "category": "summit",
            "dates": f"Year-round {year}", "is_remote": True, "pinned": True,
            "tags": ["Machine Learning", "Racing", "AWS"],
            "description": "Learn ML through autonomous racing. Compete globally with other students.",
        },
        {
            "id": "curated-google-kickstart", "title": "Google Coding Competitions",
            "company": "Google", "location": "Remote / Worldwide",
            "url": "https://codingcompetitions.withgoogle.com/",
            "source": "Curated", "type": "hackathon", "category": "summit",
            "dates": f"Multiple rounds {year}", "is_remote": True, "pinned": True,
            "tags": ["Competitive Programming", "Google"],
            "description": "Code Jam, Hash Code, and Kick Start — Google's suite of coding competitions.",
        },
        {
            "id": "curated-buildathon", "title": "BUILDATHON by Google for Developers",
            "company": "Google for Developers", "location": "Worldwide",
            "url": "https://developers.google.com/",
            "source": "Curated", "type": "hackathon", "category": "summit",
            "dates": f"Rolling {year}", "is_remote": False, "pinned": True,
            "tags": ["Google", "Build", "Innovation"],
            "description": "Build innovative solutions using Google technologies. Regional and global rounds.",
        },
        {
            "id": "curated-girlscript-soc", "title": "GirlScript Summer of Code (GSSoC)",
            "company": "GirlScript Foundation", "location": "Remote / Worldwide",
            "url": "https://gssoc.girlscript.tech/",
            "source": "Curated", "type": "program", "category": "program",
            "dates": f"May – Aug {year}", "is_remote": True, "pinned": True,
            "tags": ["Open Source", "Beginner Friendly", "Inclusive"],
            "description": "3-month open-source program for beginners. Contribute and earn certificates & swag.",
        },
    ]


@router.get("/international")
async def get_international_opportunities(
    q: str = Query("", description="Optional search query to filter API results"),
    user_id: str = Query(None, description="Optional user ID to auto-detect home country"),
):
    """
    International opportunities tab:
    1. Always returns curated programs at the top (pinned)
    2. Fetches from free global APIs (Remotive, Arbeitnow) in parallel
    3. Optionally detects user's home country to exclude it
    """
    import asyncio
    from backend.adapters.remotive_adapter import RemotiveAdapter
    from backend.adapters.arbeitnow_adapter import ArbeitnowAdapter

    # ─── Detect home country ───
    home_country = None
    if user_id:
        try:
            supabase = get_supabase()
            if supabase:
                profile_res = supabase.table("profiles").select("country").eq("id", user_id).execute()
                if profile_res.data:
                    home_country = (profile_res.data[0].get("country") or "").upper()
        except Exception:
            pass

    # ─── Curated programs (always shown) ───
    curated = _curated_international_programs()

    # ─── Live API fetch (free sources only) ───
    search_query = q or "software developer"

    async def fetch_remotive():
        try:
            return await RemotiveAdapter().search(query=search_query)
        except Exception as e:
            logger.warning(f"Remotive error: {e}")
            return []

    async def fetch_arbeitnow():
        try:
            return await ArbeitnowAdapter().search(query=search_query)
        except Exception as e:
            logger.warning(f"Arbeitnow error: {e}")
            return []

    all_batches = await asyncio.gather(
        fetch_remotive(), fetch_arbeitnow(),
        return_exceptions=True,
    )

    # ─── Convert OpportunityResult → dicts ───
    api_items = []
    seen = set()
    for batch in all_batches:
        if not isinstance(batch, list):
            continue
        for r in batch:
            dedup_key = f"{r.title.lower().strip()[:50]}|{r.company.lower().strip()}"
            if dedup_key in seen:
                continue
            seen.add(dedup_key)

            # Determine sub-category
            title_lower = r.title.lower()
            if any(k in title_lower for k in ["intern", "trainee", "apprentice", "co-op"]):
                category = "internship"
            elif any(k in title_lower for k in ["fellow", "program", "scholar"]):
                category = "program"
            else:
                category = "job"

            api_items.append({
                "id": f"{r.source}-{hash(r.title + r.company)}",
                "title": r.title,
                "company": r.company,
                "location": r.location or "Remote",
                "url": r.url,
                "source": r.source.capitalize(),
                "type": r.type or "job",
                "category": category,
                "salary": r.salary,
                "posted_date": r.posted_date,
                "is_remote": r.is_remote,
                "tags": r.tags or [],
                "description": (r.description or "")[:200],
                "pinned": False,
            })

    # ─── Filter out home country if detected ───
    if home_country and home_country == "IN":
        # For Indian students — skip results clearly in India
        api_items = [i for i in api_items if "india" not in (i["location"] or "").lower()]

    # ─── Merge: curated first, then API results ───
    all_items = curated + api_items

    # Source breakdown
    breakdown = {}
    for item in all_items:
        s = item.get("source", "Unknown")
        breakdown[s] = breakdown.get(s, 0) + 1

    # Category breakdown
    cat_breakdown = {}
    for item in all_items:
        c = item.get("category", "job")
        cat_breakdown[c] = cat_breakdown.get(c, 0) + 1

    return {
        "items": all_items,
        "total": len(all_items),
        "curated_count": len(curated),
        "api_count": len(api_items),
        "source_breakdown": breakdown,
        "category_breakdown": cat_breakdown,
    }


# ─── DB Tables (scraped data) ──────────────────────────────────

# Skill → related keyword expansion map (lowercase)
_SKILL_EXPANSIONS = {
    "python": {"python", "django", "flask", "fastapi", "data science", "backend"},
    "machine learning": {"machine learning", "ml", "ai", "artificial intelligence", "data science", "deep learning", "neural"},
    "deep learning": {"deep learning", "neural", "ai", "machine learning", "ml", "tensorflow", "pytorch", "computer vision", "nlp"},
    "artificial intelligence": {"ai", "artificial intelligence", "machine learning", "ml", "deep learning", "data science"},
    "react": {"react", "frontend", "front end", "javascript", "next.js", "nextjs", "web developer", "full stack"},
    "javascript": {"javascript", "js", "react", "frontend", "node", "web developer", "full stack"},
    "typescript": {"typescript", "javascript", "react", "frontend", "full stack", "web developer"},
    "node": {"node", "nodejs", "backend", "javascript", "express", "full stack"},
    "django": {"django", "python", "backend", "full stack", "web developer"},
    "flask": {"flask", "python", "backend", "api"},
    "fastapi": {"fastapi", "python", "backend", "api"},
    "java": {"java", "spring", "backend", "android", "software engineer"},
    "c++": {"c++", "cpp", "systems", "embedded", "software engineer"},
    "sql": {"sql", "database", "data", "backend", "analytics"},
    "mongodb": {"mongodb", "nosql", "database", "backend"},
    "aws": {"aws", "cloud", "devops", "infrastructure"},
    "docker": {"docker", "devops", "cloud", "infrastructure", "containerization"},
    "kubernetes": {"kubernetes", "k8s", "devops", "cloud"},
    "git": {"git", "github", "version control"},
    "langchain": {"langchain", "llm", "ai", "generative ai", "gen ai", "chatbot", "nlp"},
    "llm": {"llm", "large language model", "ai", "generative ai", "gen ai", "chatbot", "nlp"},
    "rag": {"rag", "retrieval", "ai", "llm", "gen ai"},
    "tensorflow": {"tensorflow", "deep learning", "ml", "ai", "machine learning"},
    "pytorch": {"pytorch", "deep learning", "ml", "ai", "machine learning"},
    "nlp": {"nlp", "natural language", "ai", "machine learning", "chatbot", "llm"},
    "computer vision": {"computer vision", "cv", "image", "deep learning", "ai"},
    "data science": {"data science", "data", "analytics", "ml", "machine learning", "python", "ai"},
    "streamlit": {"streamlit", "python", "data science", "ai", "dashboard"},
    "html": {"html", "web", "frontend", "web developer"},
    "css": {"css", "web", "frontend", "web developer"},
}

# Domain keywords that make generic titles relevant
_DOMAIN_TITLE_MATCHES = {
    "ai": ["software", "engineer", "developer", "research", "data", "analyst", "ml", "ai", "intern", "full stack"],
    "web": ["software", "developer", "engineer", "frontend", "backend", "full stack", "web", "intern"],
    "data": ["software", "engineer", "data", "analyst", "developer", "research", "intern", "science"],
    "mobile": ["software", "developer", "mobile", "android", "ios", "flutter", "intern"],
    "devops": ["software", "engineer", "devops", "cloud", "infrastructure", "sre", "developer", "intern"],
}


def _detect_domain(skills: list[str], career_goal: str) -> str:
    """Detect the user's primary domain from skills and goal."""
    all_text = " ".join(skills).lower() + " " + career_goal.lower()
    if any(k in all_text for k in ["machine learning", "deep learning", "ai", "artificial intelligence", "nlp", "llm", "data science"]):
        return "ai"
    if any(k in all_text for k in ["react", "frontend", "web", "next.js", "html", "css", "javascript"]):
        return "web"
    if any(k in all_text for k in ["data analyst", "analytics", "sql", "tableau", "power bi"]):
        return "data"
    if any(k in all_text for k in ["android", "ios", "flutter", "mobile", "swift", "kotlin"]):
        return "mobile"
    if any(k in all_text for k in ["devops", "cloud", "docker", "kubernetes", "aws", "infrastructure"]):
        return "devops"
    return "web"  # default


def _build_keyword_set(skills: list[str], career_goal: str, resume_data: dict) -> set[str]:
    """Build a comprehensive set of lowercase keywords from the full user profile."""
    keywords = set()

    # 1. Direct skills
    for s in skills:
        keywords.add(s.lower().strip())

    # 2. Expanded skills
    for s in skills:
        sl = s.lower().strip()
        if sl in _SKILL_EXPANSIONS:
            keywords.update(_SKILL_EXPANSIONS[sl])

    # 3. Career goal words
    if career_goal:
        for w in career_goal.lower().split():
            if len(w) > 2:
                keywords.add(w)

    # 4. Resume data: projects tech stacks
    if resume_data and isinstance(resume_data, dict):
        for project in resume_data.get("projects", []):
            if isinstance(project, dict):
                for tech in project.get("tech_stack", []):
                    keywords.add(tech.lower().strip())
                # project name words
                name = project.get("name", "")
                for w in name.lower().split():
                    if len(w) > 2:
                        keywords.add(w)

        # 5. Resume data: experience titles and companies
        for exp in resume_data.get("experience", []):
            if isinstance(exp, dict):
                role = exp.get("role", "") or exp.get("title", "")
                for w in role.lower().split():
                    if len(w) > 2:
                        keywords.add(w)
                domain = exp.get("domain", "") or ""
                for w in domain.lower().split():
                    if len(w) > 2:
                        keywords.add(w)

    # Remove very generic words
    keywords.discard("and")
    keywords.discard("the")
    keywords.discard("for")
    keywords.discard("with")

    return keywords


def _compute_relevance(title: str, company: str, location: str,
                       keyword_set: set[str], domain: str) -> int:
    """Smart relevance scoring: 0-100 based on expanded keyword matching and domain awareness."""
    if not keyword_set:
        return 0

    title_lower = title.lower()
    text = f"{title_lower} {company.lower()} {location.lower()}"
    score = 0

    # ─── 1. Keyword matching (up to 50 points) ───
    matched = 0
    for kw in keyword_set:
        if kw in text:
            matched += 1
    # Score based on how many keywords hit (diminishing returns)
    if matched >= 5:
        score += 50
    elif matched >= 3:
        score += 40
    elif matched >= 2:
        score += 30
    elif matched >= 1:
        score += 20

    # ─── 2. Domain-aware title matching (up to 30 points) ───
    domain_keywords = _DOMAIN_TITLE_MATCHES.get(domain, [])
    domain_hits = sum(1 for dk in domain_keywords if dk in title_lower)
    if domain_hits >= 3:
        score += 30
    elif domain_hits >= 2:
        score += 25
    elif domain_hits >= 1:
        score += 15

    # ─── 3. Type bonus (up to 15 points) ───
    if any(k in title_lower for k in ["intern", "trainee", "fresher", "entry level", "apprentice"]):
        score += 10
    if "remote" in text:
        score += 5

    # ─── 4. Penalty for clearly irrelevant domains ───
    irrelevant_keywords = ["finance", "accounting", "legal", "law", "hr", "human resource",
                           "sales", "marketing", "content writer", "graphic design",
                           "civil", "mechanical", "chemical", "pharmacy", "medical",
                           "architecture"]
    if any(ik in title_lower for ik in irrelevant_keywords):
        if not any(kw in title_lower for kw in keyword_set):
            score = max(score - 40, 5)

    return min(score, 100)


@router.get("/db/jobs")
async def get_db_jobs(
    limit: int = Query(100, ge=1, le=500),
    user_id: str = Query(None, description="Optional user ID for skill-based relevance sorting"),
):
    """Read jobs from the scraped `jobs` table — sorted by profile relevance if logged in"""
    try:
        from datetime import datetime, timedelta

        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        # ─── Load full user profile if logged in ───
        keyword_set = set()
        domain = "web"
        if user_id:
            try:
                profile_res = supabase.table("profiles") \
                    .select("skills, career_goal, experience_level, resume_data") \
                    .eq("id", user_id).execute()
                if profile_res.data:
                    profile = profile_res.data[0]
                    raw_skills = profile.get("skills", [])
                    if isinstance(raw_skills, str):
                        raw_skills = [s.strip() for s in raw_skills.split(",") if s.strip()]
                    career_goal = profile.get("career_goal", "") or ""
                    resume_data = profile.get("resume_data", {}) or {}
                    keyword_set = _build_keyword_set(raw_skills, career_goal, resume_data)
                    domain = _detect_domain(raw_skills, career_goal)
            except Exception:
                pass


        # Only fetch jobs posted within the last 60 days
        cutoff = (datetime.now() - timedelta(days=60)).isoformat()

        result = supabase.table("jobs") \
            .select("*") \
            .gte("posted_at", cutoff) \
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
            score = _compute_relevance(title, r.get("company", ""), location, keyword_set, domain)

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
                "match_score": score,
            })

        # Sort by relevance score (highest first), then by posted_date
        if keyword_set:
            items.sort(key=lambda x: x["match_score"], reverse=True)

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
