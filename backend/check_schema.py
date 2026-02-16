import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

try:
    # Try to select one row to see structure
    response = supabase.table("profiles").select("*").limit(1).execute()
    if response.data:
        print("Existing Columns:", response.data[0].keys())
    else:
        print("Table 'profiles' exists but is empty.")
except Exception as e:
    print(f"Error checking schema: {e}")
