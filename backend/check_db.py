import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Supabase credentials missing")
else:
    supabase = create_client(url, key)
    response = supabase.table("profiles").select("*").execute()
    
    print(f"Found {len(response.data)} profiles.")
    for p in response.data:
        print(f"--- ID: {p.get('id')} ---")
        print(f"Name: {p.get('full_name')}")
        rd = p.get('resume_data', {})
        print(f"Resume Data Keys: {list(rd.keys()) if rd else 'None'}")
        if rd:
            print(f"  Start of Resume Data: {str(rd)[:200]}...")
