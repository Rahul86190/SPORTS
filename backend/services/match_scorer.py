"""
Match Scorer — Scores opportunities against user profile (0-100).
Uses the 3-layer skill matching system.
"""

import logging
from .skill_matcher import get_related_skills, fuzzy_match

logger = logging.getLogger(__name__)


async def score_opportunity(opportunity: dict, profile: dict) -> int:
    """Score 0-100 how well an opportunity matches the user's profile"""
    score = 0

    # === SKILL MATCH (max 50 points) ===
    user_skills = [s.lower() for s in profile.get("skills", [])]
    opp_tags = [t.lower() for t in opportunity.get("tags", [])]
    opp_text = (
        opportunity.get("title", "") + " " +
        (opportunity.get("description", "") or "")
    ).lower()

    matched = 0.0
    for skill in user_skills:
        # Layer 1+3: Get expanded skill set
        expanded = await get_related_skills(skill)

        # Check expanded skills against opportunity
        if any(exp in opp_tags or exp in opp_text for exp in expanded):
            matched += 1.0
        # Layer 2: Fuzzy fallback
        elif any(fuzzy_match(skill, tag) for tag in opp_tags):
            matched += 0.7

    if user_skills:
        score += min(int((matched / len(user_skills)) * 50), 50)

    # === LOCATION MATCH (max 20 points) ===
    opp_location = (opportunity.get("location", "") or "").lower()
    if opportunity.get("is_remote"):
        score += 15
    user_city = (profile.get("city", "") or "").lower()
    user_state = (profile.get("state", "") or "").lower()
    if user_city and user_city in opp_location:
        score += 20
    elif user_state and user_state in opp_location:
        score += 10

    # === LEVEL MATCH (max 15 points) ===
    opp_title = opportunity.get("title", "").lower()
    user_level = profile.get("experience_level", "student")
    if user_level in ["student", "fresher"]:
        if any(kw in opp_title for kw in ["intern", "fresher", "trainee", "junior", "entry"]):
            score += 15
        elif any(kw in opp_title for kw in ["senior", "lead", "manager", "principal", "staff"]):
            score -= 10
    elif user_level == "entry-level":
        if any(kw in opp_title for kw in ["junior", "entry", "associate"]):
            score += 10

    # === GOAL MATCH (max 15 points) ===
    goal = (profile.get("career_goal", "") or "").lower()
    if goal:
        goal_related = await get_related_skills(goal)
        if any(g in opp_text for g in goal_related):
            score += 15

    return max(0, min(score, 100))


async def score_opportunities(opportunities: list[dict], profile: dict) -> list[dict]:
    """Score and sort a list of opportunities"""
    for opp in opportunities:
        opp["match_score"] = await score_opportunity(opp, profile)

    # Sort: highest score first
    opportunities.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    return opportunities
