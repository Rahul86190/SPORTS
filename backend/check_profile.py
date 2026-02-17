import asyncio
from database import get_supabase
import os
from dotenv import load_dotenv

load_dotenv()

async def check_profile():
    supabase = get_supabase()
    # Fetch all profiles
    response = supabase.table("profiles").select("*").execute()
    
    if response.data:
        print(f"Found {len(response.data)} profiles.")
        for profile in response.data:
            print(f"ID: {profile.get('id')}")
            print(f"Name: {profile.get('full_name')}")
            print(f"Avatar URL: {profile.get('avatar_url')}")
            print("-" * 20)
    else:
        print("No profiles found.")

if __name__ == "__main__":
    asyncio.run(check_profile())
