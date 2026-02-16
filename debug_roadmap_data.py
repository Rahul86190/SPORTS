import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
sys.path.append(os.getcwd())

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

try:
    response = supabase.table("profiles").select("id, roadmap_data").execute()
    data = response.data
    
    if not data:
        print("No profiles found")
    else:
        for profile in data:
            print(f"Profile: {profile['id']}")
            rd = profile.get("roadmap_data")
            if not rd:
                print("Roadmap Data: None/Empty")
            else:
                if 'phases' in rd:
                    print(f"Roadmap Phases Found: {len(rd['phases'])}")
                else:
                    print("Roadmap Phases MISSING")
                if 'notes' in rd:
                     print(f"Notes Found: {len(rd['notes'])}")
                else:
                    print("Notes MISSING")
                
                print(f"Keys: {rd.keys()}")

except Exception as e:
    print(f"Error: {e}")
