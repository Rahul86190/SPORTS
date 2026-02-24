"""
Platform Registry — Maps user country to available API sources.
Determines which adapters to call based on the user's location.
"""

PLATFORM_CONFIG = {
    "jsearch": {
        "regions": ["ALL"],
        "content_types": ["job", "internship"],
        "requires_key": True,
        "priority": 1,
        "max_results": 30,
    },
    "adzuna": {
        "regions": [
            "IN", "US", "GB", "UK", "AU", "DE", "FR", "CA",
            "NL", "BR", "IT", "PL", "RU", "SG", "ZA", "NZ", "AT"
        ],
        "content_types": ["job", "internship"],
        "requires_key": True,
        "priority": 2,
        "max_results": 20,
    },
    "remotive": {
        "regions": ["ALL"],
        "content_types": ["job"],
        "requires_key": False,
        "priority": 2,
        "max_results": 20,
    },
    "arbeitnow": {
        "regions": ["ALL"],
        "content_types": ["job"],
        "requires_key": False,
        "priority": 3,
        "max_results": 15,
    },
    "international_programs": {
        "regions": ["ALL"],
        "content_types": ["program"],
        "requires_key": False,
        "priority": 1,
        "max_results": 30,
    },
}


def get_sources_for_user(country: str) -> list[str]:
    """Select which platforms to query based on user's country"""
    sources = []
    for name, config in PLATFORM_CONFIG.items():
        if "ALL" in config["regions"] or country.upper() in config["regions"]:
            sources.append(name)
    return sorted(sources, key=lambda x: PLATFORM_CONFIG[x]["priority"])


def get_platform_config(name: str) -> dict:
    """Get config for a specific platform"""
    return PLATFORM_CONFIG.get(name, {})
