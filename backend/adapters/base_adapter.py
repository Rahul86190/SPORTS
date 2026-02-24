"""
Base adapter and unified OpportunityResult model.
All API adapters normalize their responses into this format.
"""

from dataclasses import dataclass, field, asdict
from typing import Optional
import uuid


@dataclass
class OpportunityResult:
    """Unified opportunity format returned by all adapters"""
    title: str
    company: str
    location: str
    url: str
    source: str
    type: str = "job"                # "internship", "job", "hackathon", "program"
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = ""
    is_remote: bool = False
    salary: Optional[str] = None
    posted_date: Optional[str] = None
    tags: list = field(default_factory=list)
    description: Optional[str] = None
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    is_international: bool = False
    is_fully_funded: bool = False
    deadline: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


class BaseAdapter:
    """Base class for all API adapters"""

    SOURCE_NAME = "unknown"

    def _detect_remote(self, text: str) -> bool:
        """Detect if a job is remote from location/title text"""
        remote_keywords = ["remote", "work from home", "wfh", "anywhere", "distributed"]
        text_lower = text.lower()
        return any(kw in text_lower for kw in remote_keywords)

    def _detect_type(self, title: str, description: str = "") -> str:
        """Detect if a listing is an internship, job, etc."""
        combined = (title + " " + description).lower()
        if "intern" in combined or "trainee" in combined or "apprentice" in combined:
            return "internship"
        if "hackathon" in combined or "competition" in combined:
            return "hackathon"
        return "job"

    def _clean_text(self, text: str) -> str:
        """Remove HTML tags from text"""
        import re
        if not text:
            return ""
        return re.sub(r'<[^>]+>', '', text).strip()
