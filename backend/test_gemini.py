import os
import json
from dotenv import load_dotenv
from backend.utils.gemini_client import GeminiClient

# Load env vars
load_dotenv()

def test_generation():
    print("Testing Gemini Client with current API KEY...")
    client = GeminiClient()
    
    if not client.api_key:
        print("ERROR: API Key not found.")
        return

    dummy_profile = {
        "skills": ["Python", "HTML", "CSS"],
        "experience": [],
        "projects": []
    }
    goal = "Full Stack Python Developer"

    print(f"Generating roadmap for goal: {goal}...")
    try:
        result = client.generate_roadmap(dummy_profile, goal)
        if "error" in result:
             print(f"FAILED: {result['error']}")
        else:
             print("SUCCESS! Roadmap generated.")
             print("Title:", result.get('title'))
             print("Phases:", len(result.get('phases', [])))
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    test_generation()
