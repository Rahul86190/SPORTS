"""
Seed script for international programs.
Run this once to populate the international_programs table in Supabase.
Usage: python -m backend.data.seed_programs
"""

import json
import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.database import get_supabase


def seed_programs():
    """Load programs from JSON and insert into Supabase"""
    json_path = Path(__file__).parent / "international_programs.json"

    if not json_path.exists():
        print(f"ERROR: {json_path} not found!")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        programs = json.load(f)

    supabase = get_supabase()
    if not supabase:
        print("ERROR: Could not connect to Supabase")
        return

    print(f"Loading {len(programs)} international programs...")

    # Clear existing data first (idempotent seeding)
    try:
        supabase.table("international_programs").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("  Cleared existing programs.")
    except Exception as e:
        print(f"  Warning: Could not clear existing data: {e}")

    for prog in programs:
        try:
            supabase.table("international_programs").insert(prog).execute()
            print(f"  ✓ {prog['name']}")
        except Exception as e:
            print(f"  ✗ {prog['name']}: {e}")

    print(f"\nDone! Seeded {len(programs)} programs.")


if __name__ == "__main__":
    seed_programs()
