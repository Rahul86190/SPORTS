"""
Job Detail Router — scrapes job detail pages, falls back to Gemini AI,
caches results in `job_details_cache`, and provides enriched job data.
"""
import logging
import asyncio
import re
import requests
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

try:
    from ..database import get_supabase
    from ..utils.gemini_client import GeminiClient
except ImportError:
    from backend.database import get_supabase
    from backend.utils.gemini_client import GeminiClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/job-detail", tags=["Job Detail"])


# ─── Scraping Helpers ──────────────────────────────────────────

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def _scrape_internshala_detail(url: str) -> dict | None:
    """Scrape full job details from an Internshala detail page."""
    try:
        from bs4 import BeautifulSoup
        resp = requests.get(url, headers=_HEADERS, timeout=10)
        if resp.status_code != 200:
            return None
        soup = BeautifulSoup(resp.text, "html.parser")

        result = {}

        # Description
        about_section = soup.find("div", class_="text-container")
        if about_section:
            result["description"] = about_section.get_text(separator="\n", strip=True)

        # Alternate: try the internship/job details section
        if not result.get("description"):
            detail_section = soup.find("div", class_="internship_details")
            if detail_section:
                result["description"] = detail_section.get_text(separator="\n", strip=True)

        # Requirements / Skills
        skills_section = soup.find("div", class_="round_tabs_container")
        if skills_section:
            skills = [s.get_text(strip=True) for s in skills_section.find_all("span")]
            result["tech_stack"] = skills

        # Who can apply / Eligibility
        eligibility_header = soup.find(string=re.compile(r"Who can apply", re.I))
        if eligibility_header:
            eligibility_div = eligibility_header.find_parent("div")
            if eligibility_div:
                next_div = eligibility_div.find_next_sibling("div")
                if next_div:
                    elig_text = next_div.get_text(separator="\n", strip=True)
                    # Filter out Internshala signup/login junk
                    junk_phrases = [
                        "looking for more such opportunities",
                        "register now to access",
                        "sign up with google",
                        "sign up with email",
                        "by signing up",
                        "terms and conditions",
                        "openings posted daily",
                    ]
                    elig_lower = elig_text.lower()
                    if not any(junk in elig_lower for junk in junk_phrases):
                        result["eligibility"] = elig_text

        # About Company
        company_section = soup.find("div", class_="company_info") or soup.find("div", class_="website_and_links")
        if company_section:
            about_text = company_section.find_parent("div")
            if about_text:
                result["about_company"] = about_text.get_text(separator="\n", strip=True)[:500]

        # Perks
        perks_section = soup.find("div", class_="round_tabs_container perks_container")
        if perks_section:
            perks = [p.get_text(strip=True) for p in perks_section.find_all("span")]
            result["perks"] = perks

        if result.get("description") or result.get("tech_stack"):
            result["data_source"] = "scraped"
            return result

        return None

    except Exception as e:
        logger.warning(f"Internshala scrape failed for {url}: {e}")
        return None


def _scrape_generic_detail(url: str) -> dict | None:
    """Generic scraper — tries to extract structured data from any job page."""
    try:
        from bs4 import BeautifulSoup
        resp = requests.get(url, headers=_HEADERS, timeout=10)
        if resp.status_code != 200:
            return None
        soup = BeautifulSoup(resp.text, "html.parser")

        # Try to find job description in common containers
        result = {}
        for selector in ["div.job-description", "div.description", "section.description",
                         "div.jd", "article", "div.content"]:
            elem = soup.select_one(selector)
            if elem and len(elem.get_text(strip=True)) > 100:
                result["description"] = elem.get_text(separator="\n", strip=True)[:3000]
                break

        # Fallback: get all paragraph text if no description found
        if not result.get("description"):
            paragraphs = soup.find_all("p")
            text = "\n".join(p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 30)
            if len(text) > 200:
                result["description"] = text[:3000]

        # Validate: reject junk content (login walls, generic pages)
        desc = (result.get("description") or "").lower()
        junk_indicators = ["sign in", "log in", "create account", "join now",
                           "you've viewed all jobs", "continue to apply",
                           "get notified about new", "by clicking continue"]
        if any(junk in desc for junk in junk_indicators):
            logger.info(f"Rejected junk scrape for {url}")
            return None

        if result.get("description"):
            result["data_source"] = "scraped"
            return result

        return None
    except Exception as e:
        logger.warning(f"Generic scrape failed for {url}: {e}")
        return None


def _scrape_job_detail(url: str, source: str) -> dict | None:
    """Route to the right scraper based on source."""
    if not url:
        return None

    url_lower = url.lower()

    # Skip sources that require login (always use Gemini for these)
    if "linkedin.com" in url_lower:
        return None

    if "internshala.com" in url_lower:
        return _scrape_internshala_detail(url)
    else:
        return _scrape_generic_detail(url)


# ─── Gemini: Structure + Generate ─────────────────────────────

def _structure_scraped_data(raw_text: str, title: str, company: str,
                            existing_tech_stack: list = None) -> dict:
    """Use Gemini to structure raw scraped text into clean sections."""
    try:
        import json
        client = GeminiClient()
        if not client.model:
            return {"description": raw_text, "data_source": "scraped"}

        prompt = f"""You are a job description parser. I have raw scraped text from a job listing.
Parse and structure it into clean, organized sections.

**Job Title:** {title}
**Company:** {company}
**Raw scraped text:**
---
{raw_text[:4000]}
---

Extract and return ONLY valid JSON with this EXACT structure:
{{
    "description": "A clean 2-3 paragraph overview of the role (NOT the requirements or responsibilities, just the role summary)",
    "requirements": ["requirement 1", "requirement 2", ...],
    "responsibilities": ["responsibility 1", "responsibility 2", ...],
    "eligibility": "Eligibility criteria like experience, education, etc. Leave empty string if not found.",
    "tech_stack": ["Technology1", "Technology2", ...],
    "about_company": "Brief company description if found, otherwise empty string"
}}

Rules:
- Extract REAL data from the text, do NOT make up information
- Put technical skills, tools, frameworks into tech_stack as individual items
- Put qualifications, experience requirements, education into requirements
- Put day-to-day duties and tasks into responsibilities
- The description should be a clean summary paragraph, NOT a copy of requirements
- If the raw text has fields like "CTC", "Notice Period", "Location", "Shift Timing" etc., include them naturally in the description
- For tech_stack, extract individual technologies (e.g. "Python", "TensorFlow", "AWS") not phrases"""

        response = client.model.generate_content(prompt, request_options={"timeout": 30})
        text = response.text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```\w*\n?", "", text)
            text = re.sub(r"\n?```$", "", text)

        data = json.loads(text)

        # Merge existing tech_stack from HTML scraping if available
        if existing_tech_stack:
            ai_stack = set(t.lower() for t in (data.get("tech_stack") or []))
            for t in existing_tech_stack:
                if t.lower() not in ai_stack:
                    data.setdefault("tech_stack", []).append(t)

        data["data_source"] = "scraped"
        return data

    except Exception as e:
        logger.warning(f"Gemini structuring failed: {e}")
        return {"description": raw_text, "data_source": "scraped"}


def _generate_jd_with_gemini(title: str, company: str, location: str,
                              job_type: str, salary: str) -> dict:
    """Generate a realistic job description using Gemini AI."""
    try:
        import json
        client = GeminiClient()
        if not client.model:
            return {}

        prompt = f"""Generate a realistic and detailed job description for this role.

**Role:** {title}
**Company:** {company}
**Location:** {location}
**Type:** {job_type}
**Salary:** {salary or 'Not specified'}

Return ONLY valid JSON with this EXACT structure:
{{
    "description": "3-4 paragraph detailed job description",
    "requirements": ["requirement 1", "requirement 2", ...],
    "responsibilities": ["responsibility 1", "responsibility 2", ...],
    "eligibility": "Eligibility criteria text",
    "tech_stack": ["Tech1", "Tech2", ...],
    "about_company": "Brief company description"
}}

Make it realistic and professional. Include 5-8 requirements, 5-8 responsibilities, and 4-8 tech stack items.
Base the tech stack on what's typical for this role title."""

        response = client.model.generate_content(prompt, request_options={"timeout": 30})
        text = response.text
        if text.startswith("```"):
            text = re.sub(r"^```\w*\n?", "", text)
            text = re.sub(r"\n?```$", "", text)

        data = json.loads(text)
        data["data_source"] = "ai_generated"
        return data

    except Exception as e:
        logger.error(f"Gemini JD generation failed: {e}")
        return {}


# ─── Relevance Scoring ─────────────────────────────────────────

def _score_match(user_skills: list[str], career_goal: str,
                 requirements: list, tech_stack: list) -> dict:
    """Score how well the user matches the job requirements."""
    if not user_skills:
        return {"match_score": 0, "matched_skills": [], "missing_skills": []}

    user_set = {s.lower().strip() for s in user_skills}

    # Combine requirements + tech_stack into a single list to match against
    job_keywords = set()
    for r in (requirements or []):
        for word in r.lower().split():
            if len(word) > 2:
                job_keywords.add(word)
    for t in (tech_stack or []):
        job_keywords.add(t.lower().strip())

    matched = []
    missing = []

    for skill in user_skills:
        sl = skill.lower().strip()
        # Check direct match or substring match
        if any(sl in jk or jk in sl for jk in job_keywords):
            matched.append(skill)
        else:
            # Not missing — it's just not in this JD
            pass

    # Find job requirements the user doesn't have
    for t in (tech_stack or []):
        tl = t.lower().strip()
        if not any(tl in us or us in tl for us in user_set):
            missing.append(t)

    total = len(tech_stack or []) + len(requirements or [])
    if total == 0:
        score = 50  # neutral
    else:
        score = min(int((len(matched) / max(len(tech_stack or []), 1)) * 100), 100)

    return {
        "match_score": max(score, 10),
        "matched_skills": matched[:10],
        "missing_skills": missing[:8],
    }


# ─── Main Endpoint ─────────────────────────────────────────────

@router.get("/{job_id}")
async def get_job_detail(
    job_id: str,
    user_id: str = Query(None, description="Optional user ID for match scoring"),
):
    """Get full job details — scrapes on demand, caches, returns enriched data."""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        # 1. Get basic job info
        job_result = supabase.table("jobs").select("*").eq("id", job_id).execute()
        if not job_result.data:
            raise HTTPException(status_code=404, detail="Job not found")

        job = job_result.data[0]

        # 2. Check cache
        cache_result = supabase.table("job_details_cache") \
            .select("*").eq("job_id", job_id).execute()

        if cache_result.data:
            cached = cache_result.data[0]
            detail = {
                "id": job_id,
                "title": job.get("title", ""),
                "company": job.get("company", ""),
                "location": job.get("location", ""),
                "salary": job.get("salary_range", ""),
                "url": job.get("url", ""),
                "source": job.get("source", ""),
                "posted_date": job.get("posted_at", ""),
                "type": job.get("type", ""),
                "description": cached.get("description", ""),
                "requirements": cached.get("requirements", []),
                "responsibilities": cached.get("responsibilities", []),
                "eligibility": cached.get("eligibility", ""),
                "tech_stack": cached.get("tech_stack", []),
                "about_company": cached.get("about_company", ""),
                "application_deadline": cached.get("application_deadline", ""),
                "data_source": cached.get("data_source", "cached"),
            }
        else:
            # 3. Try scraping the job URL
            scraped = _scrape_job_detail(job.get("url", ""), job.get("source", ""))

            if scraped and scraped.get("description"):
                # 3b. Structure scraped data with Gemini
                raw_desc = scraped.get("description", "")
                existing_tech = scraped.get("tech_stack", [])
                detail_data = _structure_scraped_data(
                    raw_desc,
                    job.get("title", ""),
                    job.get("company", ""),
                    existing_tech,
                )
                # Preserve any fields scraping found that AI didn't
                for key in ["perks", "about_company", "eligibility"]:
                    if scraped.get(key) and not detail_data.get(key):
                        detail_data[key] = scraped[key]
            else:
                # 4. Fallback to full Gemini generation
                detail_data = _generate_jd_with_gemini(
                    job.get("title", ""),
                    job.get("company", ""),
                    job.get("location", ""),
                    job.get("type", ""),
                    job.get("salary_range", ""),
                )

            # 5. Cache the result
            cache_data = {
                "job_id": job_id,
                "description": detail_data.get("description", ""),
                "requirements": detail_data.get("requirements", []),
                "responsibilities": detail_data.get("responsibilities", []),
                "eligibility": detail_data.get("eligibility", ""),
                "tech_stack": detail_data.get("tech_stack", []),
                "about_company": detail_data.get("about_company", ""),
                "application_deadline": detail_data.get("application_deadline", ""),
                "data_source": detail_data.get("data_source", "ai_generated"),
                "generated_at": datetime.now().isoformat(),
            }

            try:
                supabase.table("job_details_cache").upsert(cache_data).execute()
            except Exception as e:
                logger.warning(f"Cache save failed: {e}")

            detail = {
                "id": job_id,
                "title": job.get("title", ""),
                "company": job.get("company", ""),
                "location": job.get("location", ""),
                "salary": job.get("salary_range", ""),
                "url": job.get("url", ""),
                "source": job.get("source", ""),
                "posted_date": job.get("posted_at", ""),
                "type": job.get("type", ""),
                **{k: v for k, v in detail_data.items() if k != "perks"},
            }

        # 6. Match scoring if user_id provided
        if user_id:
            try:
                profile_res = supabase.table("profiles") \
                    .select("skills, career_goal") \
                    .eq("id", user_id).execute()
                if profile_res.data:
                    skills = profile_res.data[0].get("skills", [])
                    if isinstance(skills, str):
                        skills = [s.strip() for s in skills.split(",") if s.strip()]
                    goal = profile_res.data[0].get("career_goal", "") or ""
                    match_info = _score_match(
                        skills, goal,
                        detail.get("requirements", []),
                        detail.get("tech_stack", []),
                    )
                    detail.update(match_info)
            except Exception:
                pass

        if "match_score" not in detail:
            detail["match_score"] = 0
            detail["matched_skills"] = []
            detail["missing_skills"] = []

        return detail

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job detail error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
