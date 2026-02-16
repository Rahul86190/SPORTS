import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env vars
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not set in .env")
    exit(1)

supabase: Client = create_client(url, key)

def view_roadmap(email_or_id=None):
    try:
        query = supabase.table("profiles").select("id, full_name, roadmap_data")
        
        if email_or_id:
            # Try matching ID
            query = query.eq("id", email_or_id)
        
        response = query.execute()
        profiles = response.data

        if not profiles:
            print("No profiles found.")
            return

        for p in profiles:
            print(f"\n--- User: {p.get('full_name', 'No Name')} ---")
            print(f"ID: {p['id']}")
            
            roadmap = p.get('roadmap_data')
            if roadmap:
                print("Roadmap Data Found:")
                print(json.dumps(roadmap, indent=2))
                
                # Save to a temp file for easy viewing
                filename = f"roadmap_{p['id']}.json"
                with open(filename, "w") as f:
                    json.dump(roadmap, f, indent=2)
                print(f"\n[Saved to {filename}]")
            else:
                print("No roadmap data generated for this user.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # You can pass an email/id as an argument if you want specific
    print("Fetching all roadmaps...")
    view_roadmap()
