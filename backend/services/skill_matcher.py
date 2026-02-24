"""
3-Layer Skill Matching System
Layer 1: Static hierarchy (instant, ~80% coverage)
Layer 2: Fuzzy/substring matching (instant, catches partial matches)
Layer 3: Gemini AI dynamic expansion (1s first time, cached permanently)
"""

import logging
from backend.database import get_supabase

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════
# LAYER 1: Static Hierarchy (fast, common skills)
# ═══════════════════════════════════════════
SKILL_HIERARCHY = {
    "machine learning": [
        "supervised learning", "unsupervised learning", "deep learning",
        "neural networks", "nlp", "computer vision", "scikit-learn", "xgboost",
        "random forest", "decision tree", "svm", "regression", "classification",
        "clustering", "reinforcement learning", "model training", "feature engineering"
    ],
    "artificial intelligence": [
        "machine learning", "deep learning", "nlp", "computer vision",
        "neural networks", "chatbot", "generative ai", "llm", "transformers"
    ],
    "web development": [
        "html", "css", "javascript", "react", "angular", "vue",
        "next.js", "node.js", "express", "django", "flask",
        "rest api", "graphql", "responsive design", "frontend", "backend"
    ],
    "data science": [
        "pandas", "numpy", "matplotlib", "seaborn", "jupyter",
        "data analysis", "data visualization", "statistics",
        "data cleaning", "eda", "power bi", "tableau", "r programming"
    ],
    "python": [
        "django", "flask", "fastapi", "pandas", "numpy",
        "scikit-learn", "pytorch", "tensorflow", "selenium", "scrapy"
    ],
    "java": [
        "spring", "spring boot", "hibernate", "maven", "gradle",
        "junit", "microservices", "jpa", "servlet"
    ],
    "javascript": [
        "react", "node.js", "express", "vue", "angular", "typescript",
        "next.js", "jquery", "webpack", "babel", "npm"
    ],
    "cloud computing": [
        "aws", "azure", "gcp", "docker", "kubernetes",
        "serverless", "lambda", "ec2", "s3", "cloud functions"
    ],
    "devops": [
        "docker", "kubernetes", "ci/cd", "jenkins", "github actions",
        "terraform", "ansible", "nginx", "linux", "monitoring"
    ],
    "mobile development": [
        "android", "ios", "flutter", "react native", "swift",
        "kotlin", "dart", "xcode", "android studio"
    ],
    "cybersecurity": [
        "penetration testing", "ethical hacking", "cryptography", "soc",
        "network security", "vulnerability assessment", "kali linux", "owasp"
    ],
    "database": [
        "sql", "mysql", "postgresql", "mongodb", "redis",
        "firebase", "supabase", "oracle", "nosql", "sqlite"
    ],
    "blockchain": [
        "solidity", "ethereum", "smart contracts", "web3", "defi",
        "nft", "hyperledger", "cryptocurrency", "dapp"
    ],
}

# In-memory cache for AI-expanded skills (grows over app lifetime)
_ai_cache: dict[str, set[str]] = {}


# ═══════════════════════════════════════════
# LAYER 2: Fuzzy/Substring Matching
# ═══════════════════════════════════════════
ABBREVIATIONS = {
    "ml": "machine learning", "ai": "artificial intelligence",
    "dl": "deep learning", "ds": "data science",
    "fe": "frontend", "be": "backend", "fs": "full stack",
    "cv": "computer vision", "nlp": "natural language processing",
    "dsa": "data structures", "oop": "object oriented",
    "dbms": "database", "os": "operating system",
    "ui": "user interface", "ux": "user experience",
    "api": "application programming interface",
    "sde": "software development", "swe": "software engineer",
}


def fuzzy_match(skill: str, target: str) -> bool:
    """Check if skill partially matches target text"""
    s = skill.lower().strip()
    t = target.lower().strip()

    if not s or not t:
        return False

    # Direct substring
    if s in t or t in s:
        return True

    # Abbreviation match
    if s in ABBREVIATIONS and ABBREVIATIONS[s] in t:
        return True
    if t in ABBREVIATIONS and ABBREVIATIONS[t] in s:
        return True

    return False


# ═══════════════════════════════════════════
# LAYER 3: Gemini AI Dynamic Expansion
# ═══════════════════════════════════════════
async def ai_expand_skill(skill: str) -> set[str]:
    """Ask Gemini to find related skills. Result cached permanently."""
    skill_lower = skill.lower().strip()

    # Check in-memory cache first
    if skill_lower in _ai_cache:
        return _ai_cache[skill_lower]

    # Check DB cache (persists across server restarts)
    try:
        supabase = get_supabase()
        if supabase:
            result = supabase.table("skill_expansions").select("related_skills") \
                .eq("skill", skill_lower).execute()
            if result.data and len(result.data) > 0:
                skills = set(result.data[0]["related_skills"])
                _ai_cache[skill_lower] = skills
                return skills
    except Exception as e:
        logger.debug(f"DB cache check failed for skill '{skill_lower}': {e}")

    # Not cached → ask Gemini (only happens ONCE per skill, ever)
    try:
        import os
        import google.generativeai as genai
        from dotenv import load_dotenv
        from pathlib import Path

        env_path = Path(__file__).resolve().parent.parent.parent / '.env'
        load_dotenv(dotenv_path=env_path, override=True)

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {skill_lower}

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')

        prompt = f"""List exactly 15 technical skills closely related to "{skill}".
Return ONLY a comma-separated list, nothing else. No numbering, no explanations.
Example for "React": javascript, jsx, redux, next.js, hooks, components, virtual dom, webpack, babel, typescript, frontend, spa, state management, react native, material ui"""

        response = model.generate_content(prompt, request_options={'timeout': 15})
        related = {s.strip().lower() for s in response.text.split(",") if s.strip()}
        related.add(skill_lower)

        # Save to DB permanently
        try:
            supabase = get_supabase()
            if supabase:
                supabase.table("skill_expansions").upsert({
                    "skill": skill_lower,
                    "related_skills": list(related)
                }).execute()
        except Exception as e:
            logger.debug(f"Failed to cache skill expansion: {e}")

        _ai_cache[skill_lower] = related
        logger.info(f"AI expanded '{skill}' → {len(related)} related skills")
        return related

    except Exception as e:
        logger.warning(f"AI skill expansion failed for '{skill}': {e}")
        return {skill_lower}


# ═══════════════════════════════════════════
# MAIN FUNCTION: Combines all 3 layers
# ═══════════════════════════════════════════
async def get_related_skills(skill: str) -> set[str]:
    """Get all related skills using 3-layer approach"""
    skill_lower = skill.lower().strip()
    related = {skill_lower}

    # Layer 1: Static hierarchy
    found_in_static = False
    if skill_lower in SKILL_HIERARCHY:
        related.update(SKILL_HIERARCHY[skill_lower])
        found_in_static = True
    for parent, children in SKILL_HIERARCHY.items():
        if skill_lower in children:
            related.add(parent)
            related.update(children)
            found_in_static = True

    if found_in_static:
        return related  # Fast path — no AI needed!

    # Layer 3: AI expansion (only for unknown skills)
    ai_related = await ai_expand_skill(skill)
    related.update(ai_related)

    return related
