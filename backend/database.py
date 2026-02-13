import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Explicitly load .env from project root
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

def get_supabase() -> Client:
    if not url or not key:
        print("Warning: SUPABASE_URL or SUPABASE_KEY not set.")
        return None
    try:
        return create_client(url, key)
    except Exception as e:
        print(f"Error creating Supabase client: {e}")
        return None
