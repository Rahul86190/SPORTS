"""
Phase 2 — Interview Preparation Lab
Endpoints:
  POST /api/prep/generate-quiz  → Generate 20 questions from job data
  POST /api/prep/submit         → Submit answers, auto-grade + Gemini evaluate
  GET  /api/prep/history        → Fetch user's prep history
"""

import re
import json
import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

try:
    from ..database import get_supabase
    from ..utils.gemini_client import GeminiClient
except ImportError:
    from backend.database import get_supabase
    from backend.utils.gemini_client import GeminiClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/prep", tags=["prep"])


# ─── Request / Response Models ────────────────────────────────

class GenerateQuizRequest(BaseModel):
    user_id: str
    job_id: str
    job_title: str
    company: str
    tech_stack: list[str] = []
    requirements: list[str] = []
    responsibilities: list[str] = []


class SubmitQuizRequest(BaseModel):
    session_id: str
    answers: list  # [ { question_index: int, answer: str } ]
    time_taken: int = 0  # seconds


# ─── Generate Quiz ────────────────────────────────────────────

@router.post("/generate-quiz")
async def generate_quiz(req: GenerateQuizRequest):
    """Generate 20 interview questions tailored to the job."""
    try:
        client = GeminiClient()
        if not client.model:
            raise HTTPException(status_code=500, detail="AI not configured")

        tech_str = ", ".join(req.tech_stack[:15]) if req.tech_stack else "general programming"
        reqs_str = "\n".join(f"- {r}" for r in req.requirements[:8]) if req.requirements else "Not specified"
        resp_str = "\n".join(f"- {r}" for r in req.responsibilities[:6]) if req.responsibilities else "Not specified"

        prompt = f"""You are an expert technical interviewer. Generate exactly 20 interview questions for this role.

**Role:** {req.job_title}
**Company:** {req.company}
**Tech Stack:** {tech_str}
**Requirements:**
{reqs_str}
**Responsibilities:**
{resp_str}

Generate a MIX of question types:
- 10 Multiple Choice Questions (MCQ) — 4 options each, exactly one correct
- 6 Short Answer Questions — need 1-3 sentence answers
- 4 Coding Questions — small code problems solvable in 5-15 lines

Return ONLY valid JSON array with this exact structure for each question:
[
  {{
    "index": 0,
    "type": "mcq",
    "question": "What is...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct_answer": "B) ...",
    "topic": "Python",
    "difficulty": "easy"
  }},
  {{
    "index": 10,
    "type": "short_answer",
    "question": "Explain...",
    "correct_answer": "Expected answer summary",
    "topic": "System Design",
    "difficulty": "medium"
  }},
  {{
    "index": 16,
    "type": "coding",
    "question": "Write a function that...",
    "correct_answer": "def solution():\\n    ...",
    "topic": "Algorithms",
    "difficulty": "medium"
  }}
]

Rules:
- Questions must be relevant to the tech stack and role
- MCQ options must be plausible — no obviously wrong answers
- Coding questions should be solvable in 5-15 lines
- Difficulty spread: 6 easy, 8 medium, 6 hard
- Index from 0 to 19
- Topics should match the tech stack items"""

        # Generate with retries (Gemini can 504 on complex prompts)
        text = None
        for attempt in range(3):
            try:
                response = client.model.generate_content(prompt, request_options={"timeout": 120})
                text = response.text.strip()
                break
            except Exception as gen_err:
                logger.warning(f"Quiz generation attempt {attempt+1} failed: {gen_err}")
                if attempt < 2:
                    import time
                    time.sleep(2 * (attempt + 1))
                else:
                    raise gen_err

        if not text:
            raise HTTPException(status_code=500, detail="AI generation failed after retries")

        if text.startswith("```"):
            text = re.sub(r"^```\w*\n?", "", text)
            text = re.sub(r"\n?```$", "", text)

        questions = json.loads(text)

        # Validate and fix indices
        for i, q in enumerate(questions):
            q["index"] = i

        # Ensure we have exactly 20 (trim or pad)
        questions = questions[:20]

        # Create session in DB
        session_id = str(uuid4())
        supabase = get_supabase()
        if supabase:
            supabase.table("prep_sessions").insert({
                "id": session_id,
                "user_id": req.user_id,
                "job_id": req.job_id,
                "job_title": req.job_title,
                "company_name": req.company,
                "questions": questions,
                "score": 0,
                "max_score": len(questions),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }).execute()

        # Return questions WITHOUT correct answers (to prevent cheating)
        safe_questions = []
        for q in questions:
            safe_q = {
                "index": q["index"],
                "type": q["type"],
                "question": q["question"],
                "topic": q.get("topic", ""),
                "difficulty": q.get("difficulty", "medium"),
            }
            if q["type"] == "mcq":
                safe_q["options"] = q["options"]
            safe_questions.append(safe_q)

        return {
            "session_id": session_id,
            "questions": safe_questions,
            "total": len(safe_questions),
        }

    except json.JSONDecodeError as e:
        logger.error(f"Quiz generation JSON parse error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate quiz — AI returned invalid format")
    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Submit & Evaluate ────────────────────────────────────────

@router.post("/submit")
async def submit_quiz(req: SubmitQuizRequest):
    """Submit answers, auto-grade MCQs, Gemini-evaluate text answers."""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        # Fetch session with questions + correct answers
        result = supabase.table("prep_sessions") \
            .select("*").eq("id", req.session_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Session not found")

        session = result.data[0]
        questions = session.get("questions", [])

        if not questions:
            raise HTTPException(status_code=400, detail="No questions in session")

        # Build answer map
        answer_map = {}
        for a in req.answers:
            answer_map[a.get("question_index", -1)] = a.get("answer", "")

        # ─── Auto-grade MCQs ───
        feedback = []
        correct_count = 0
        wrong_count = 0

        # Collect non-MCQ questions for batch Gemini evaluation
        text_questions = []

        for q in questions:
            idx = q["index"]
            user_answer = answer_map.get(idx, "").strip()
            correct_answer = q.get("correct_answer", "")

            if q["type"] == "mcq":
                # Direct match (compare first letter or full text)
                is_correct = False
                if user_answer and correct_answer:
                    # Match by option letter (e.g., "A" matches "A) ...")
                    user_letter = user_answer[0].upper() if user_answer else ""
                    correct_letter = correct_answer[0].upper() if correct_answer else ""
                    is_correct = (user_letter == correct_letter) or (user_answer.strip() == correct_answer.strip())

                if is_correct:
                    correct_count += 1

                if not user_answer:
                    wrong_count += 1

                feedback.append({
                    "index": idx,
                    "type": "mcq",
                    "user_answer": user_answer,
                    "correct_answer": correct_answer,
                    "is_correct": is_correct,
                    "skipped": not user_answer,
                    "topic": q.get("topic", ""),
                })
            else:
                text_questions.append({
                    "index": idx,
                    "type": q["type"],
                    "question": q["question"],
                    "correct_answer": correct_answer,
                    "user_answer": user_answer,
                    "topic": q.get("topic", ""),
                })

        # ─── Gemini-evaluate text/coding answers ───
        if text_questions:
            try:
                client = GeminiClient()
                if client.model:
                    eval_items = []
                    for tq in text_questions:
                        eval_items.append(
                            f"Q{tq['index']} ({tq['type']}): {tq['question']}\n"
                            f"Expected: {tq['correct_answer']}\n"
                            f"Student answered: {tq['user_answer'] or '(skipped)'}"
                        )

                    eval_prompt = f"""You are grading interview answers. For each question below, evaluate the student's answer.

{chr(10).join(eval_items)}

Return ONLY valid JSON array — one object per question:
[
  {{
    "index": 0,
    "is_correct": true/false,
    "score": 0 or 1,
    "feedback": "Brief feedback on the answer (1-2 sentences)"
  }}
]

Rules:
- For short answers: correct if it captures the key concept, even if not word-for-word
- For coding: correct if the logic is right, even if syntax is slightly off
- Skipped answers are always wrong (score 0)
- Be fair but not lenient — the answer must demonstrate understanding"""

                    eval_response = client.model.generate_content(eval_prompt, request_options={"timeout": 30})
                    eval_text = eval_response.text.strip()
                    if eval_text.startswith("```"):
                        eval_text = re.sub(r"^```\w*\n?", "", eval_text)
                        eval_text = re.sub(r"\n?```$", "", eval_text)

                    evaluations = json.loads(eval_text)
                    eval_map = {e["index"]: e for e in evaluations}

                    for tq in text_questions:
                        ev = eval_map.get(tq["index"], {})
                        is_correct = ev.get("is_correct", False)
                        if is_correct:
                            correct_count += 1
                        elif tq["user_answer"]:
                            wrong_count += 1
                        else:
                            wrong_count += 1

                        feedback.append({
                            "index": tq["index"],
                            "type": tq["type"],
                            "user_answer": tq["user_answer"],
                            "correct_answer": tq["correct_answer"],
                            "is_correct": is_correct,
                            "skipped": not tq["user_answer"],
                            "feedback": ev.get("feedback", ""),
                            "topic": tq.get("topic", ""),
                        })
                else:
                    # No Gemini — mark text answers as needing review
                    for tq in text_questions:
                        wrong_count += 1
                        feedback.append({
                            "index": tq["index"],
                            "type": tq["type"],
                            "user_answer": tq["user_answer"],
                            "correct_answer": tq["correct_answer"],
                            "is_correct": False,
                            "skipped": not tq["user_answer"],
                            "feedback": "Could not evaluate — AI unavailable",
                            "topic": tq.get("topic", ""),
                        })
            except Exception as e:
                logger.warning(f"Gemini evaluation failed: {e}")
                for tq in text_questions:
                    wrong_count += 1
                    feedback.append({
                        "index": tq["index"],
                        "type": tq["type"],
                        "user_answer": tq["user_answer"],
                        "correct_answer": tq["correct_answer"],
                        "is_correct": False,
                        "skipped": not tq["user_answer"],
                        "feedback": "Evaluation error",
                        "topic": tq.get("topic", ""),
                    })

        # Sort feedback by index
        feedback.sort(key=lambda f: f["index"])

        total = len(questions)
        skipped = total - correct_count - wrong_count
        score_pct = int((correct_count / total) * 100) if total > 0 else 0

        # Determine grade
        if score_pct >= 90:
            grade = "A+"
        elif score_pct >= 80:
            grade = "A"
        elif score_pct >= 70:
            grade = "B"
        elif score_pct >= 60:
            grade = "C"
        elif score_pct >= 50:
            grade = "D"
        else:
            grade = "F"

        # Update session in DB
        update_data = {
            "answers": req.answers,
            "score": score_pct,
            "grade": grade,
            "feedback": feedback,
            "time_taken": req.time_taken,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }

        supabase.table("prep_sessions") \
            .update(update_data).eq("id", req.session_id).execute()

        return {
            "session_id": req.session_id,
            "score": score_pct,
            "grade": grade,
            "total": total,
            "correct": correct_count,
            "wrong": wrong_count,
            "skipped": skipped,
            "feedback": feedback,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Submit quiz failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Prep History ─────────────────────────────────────────────

@router.get("/history")
async def get_prep_history(user_id: str = Query(...)):
    """Get all prep sessions for a user."""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        result = supabase.table("prep_sessions") \
            .select("id, job_title, company_name, score, grade, max_score, time_taken, created_at, completed_at, feedback, questions") \
            .eq("user_id", user_id) \
            .not_.is_("completed_at", "null") \
            .order("created_at", desc=True) \
            .execute()

        sessions = []
        for s in (result.data or []):
            questions = s.get("questions") or []
            fb = s.get("feedback") or []
            correct = sum(1 for f in fb if f.get("is_correct"))
            wrong = sum(1 for f in fb if not f.get("is_correct") and not f.get("skipped"))
            skipped = sum(1 for f in fb if f.get("skipped"))

            sessions.append({
                "id": s["id"],
                "job_title": s.get("job_title", ""),
                "company_name": s.get("company_name", ""),
                "score": s.get("score", 0),
                "grade": s.get("grade", "—"),
                "total_questions": len(questions),
                "correct": correct,
                "wrong": wrong,
                "skipped": skipped,
                "time_taken": s.get("time_taken", 0),
                "started_at": s.get("created_at", ""),
                "completed_at": s.get("completed_at"),
            })

        return {"sessions": sessions, "total": len(sessions)}

    except Exception as e:
        logger.error(f"Get prep history failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
