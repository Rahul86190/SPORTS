import json
import logging
import re
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any, Dict

try:
    from utils.gemini_client import GeminiClient
    from database import get_supabase
except ImportError:
    from utils.gemini_client import GeminiClient
    from database import get_supabase

router = APIRouter(prefix="/resume", tags=["Resume"])
logger = logging.getLogger(__name__)

class TailorResumeRequest(BaseModel):
    user_id: str
    job_id: str
    job_title: str
    company_name: str
    job_description: str
    job_requirements: List[str]
    resume_data: Dict[str, Any]

@router.post("/tailor")
async def tailor_resume(req: TailorResumeRequest):
    """Tailor a resume using Gemini to optimize for a specific job."""
    try:
        client = GeminiClient()
        if not client.model:
            raise HTTPException(status_code=500, detail="AI not configured")

        reqs_str = "\n".join(f"- {r}" for r in req.job_requirements[:8]) if req.job_requirements else "Not specified"

        prompt = f"""You are an expert technical recruiter and resume writer optimizing a resume for ATS (Applicant Tracking Systems).
Your goal is to tailor the candidate's existing resume for the following job:
        
Job Title: {req.job_title}
Company: {req.company_name}
Requirements: {reqs_str}
Job Description summary (if any): {req.job_description}

Here is the candidate's current resume data in JSON format:
{json.dumps(req.resume_data, indent=2)}

Please perform the following optimizations:
1. Rewrite the "headline" or "careerGoal" to act as a Professional Summary targeted specifically at this company and role. Keep it 2-3 lines.
2. Rewrite the work experience and project "details"/description bullet points. Use the XYZ method (Accomplished X, as measured by Y, by doing Z), start with strong action verbs (e.g. Led, Engineered, Optimized), and integrate relevant keywords from the job description. Retain quantified metrics if they exist, or improve the phrasing.
3. Keep the skills array, but reorder it so that skills most relevant to this job appear first. You can add 1-2 skills if they are heavily implied by the user's experience and are mentioned in the job description.
4. Calculate an estimated ATS Score (0-100) based on keyword match, skills alignment, and overall impact.

Return the result as a raw JSON string matching the exact structure below:
{{
  "ats_score": 85,
  "tailored_resume": {{
    "headline": "Tailored Professional Summary here...",
    "skills": ["most_relevant_skill", "another_skill", ...],
    "experience": [
      {{
        "title": "...",
        "company": "...",
        "duration": "...",
        "details": "Bullet 1\\nBullet 2\\nBullet 3"
      }}
    ],
    "projects": [
      {{
         "name": "...",
         "tech_stack": ["...", "..."],
         "description": "Tailored description here..."
      }}
    ],
    "education": [
       ... existing education objects unchanged
    ]
  }}
}}
IMPORTANT: ONLY return the JSON. No markdown backticks, no markdown formatting. Keep the core information accurate to the user's original data, just optimize the phrasing and keywords. Make sure the output is valid JSON.
"""
        response = client.model.generate_content(prompt, request_options={"timeout": 120})
        text = response.text.strip()
        
        # Clean up any potential markdown formatting
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\n?", "", text)
            text = re.sub(r"\n?```$", "", text)
            
        result = json.loads(text)
        
        ats_score = result.get("ats_score", 0)
        tailored_data = result.get("tailored_resume", req.resume_data)

        # Merge untouched fields (like name, email, contact info) from original so we don't lose data
        for key in req.resume_data:
            if key not in tailored_data and key not in ["id", "roadmap_data"]:
                tailored_data[key] = req.resume_data[key]

        # Ensure country/state/city are not lost if not returned by LLM
        if "location" not in tailored_data:
            tailored_data["location"] = req.resume_data.get("location", "")

        # Create tailored resume in DB
        resume_id = str(uuid4())
        supabase = get_supabase()
        if supabase:
            supabase.table("tailored_resumes").insert({
                "id": resume_id,
                "user_id": req.user_id,
                "job_id": None, # Force None to bypass strict UUID checking in Supabase for arbitrary scraped job string IDs
                "job_title": req.job_title,
                "resume_data": tailored_data,
                "ats_score": ats_score,
                "template": "professional",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }).execute()

        return {
            "id": resume_id,
            "ats_score": ats_score,
            "resume_data": tailored_data
        }

    except json.JSONDecodeError as e:
        logger.error(f"Resume tailor JSON parse error: {e}")
        # text local variable might not be defined if error occurs earlier but this is okay for MVP
        raise HTTPException(status_code=500, detail="Failed to tailor resume — AI returned invalid format")
    except Exception as e:
        logger.error(f"Tailoring failed: {e}")
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            raise HTTPException(status_code=429, detail="AI Rate Limit Exceeded: Please wait about a minute before generating another resume.")
        if "504" in error_str or "deadline" in error_str.lower():
            raise HTTPException(status_code=504, detail="AI request timed out due to high load. Please try again.")
        raise HTTPException(status_code=500, detail=error_str)

@router.get("/history")
async def get_tailor_history(user_id: str):
    """Get all tailored resumes for a user."""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        result = supabase.table("tailored_resumes") \
            .select("id, job_title, ats_score, template, created_at, updated_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
        
        return result.data
    except Exception as e:
        logger.error(f"Failed to fetch resume history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/saved/{resume_id}")
async def get_saved_resume(resume_id: str, user_id: str):
    """Get the full data for a specific tailored resume."""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        result = supabase.table("tailored_resumes") \
            .select("*") \
            .eq("id", resume_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Resume not found")
            
        return result.data
    except Exception as e:
        logger.error(f"Failed to fetch saved resume {resume_id}: {e}")
        error_str = str(e).lower()
        if "404" in error_str or "not found" in error_str or "json object" in error_str or "0 rows" in error_str:
             raise HTTPException(status_code=404, detail="Resume not found")
        raise HTTPException(status_code=500, detail=str(e))
