"""
Query Builder — Builds search queries from user profile.
"""


def build_queries(profile: dict) -> list[str]:
    """Build 4-6 search queries from user profile"""
    queries = []
    skills = profile.get("skills", [])[:5]
    goal = profile.get("career_goal", "")
    level = profile.get("experience_level", "student")

    level_keyword = {
        "student": "intern",
        "fresher": "fresher entry level",
        "entry-level": "junior",
        "mid-level": "",
    }.get(level, "intern")

    # Goal-based query (highest priority)
    if goal:
        queries.append(f"{goal} {level_keyword}".strip())

    # Top skill queries
    for skill in skills[:3]:
        queries.append(f"{skill} {level_keyword}".strip())

    # Combined skill query
    if len(skills) >= 2:
        queries.append(f"{skills[0]} {skills[1]} {level_keyword}".strip())

    # Generic fallback if no skills/goal
    if not queries:
        queries.append(f"software developer {level_keyword}".strip())

    # Deduplicate while preserving order
    seen = set()
    unique = []
    for q in queries:
        q_lower = q.lower()
        if q_lower not in seen:
            seen.add(q_lower)
            unique.append(q)

    return unique[:6]  # Max 6 queries
