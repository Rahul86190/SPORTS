from backend.database import get_supabase

def reset_data():
    supabase = get_supabase()
    if not supabase:
        print("Failed to initialize Supabase client.")
        return

    print("Clearing Jobs...")
    try:
        res = supabase.table("jobs").delete().neq("title", "THIS_STRING_SHOULD_NOT_EXIST").execute()
        print(f"Deleted jobs: {len(res.data)}")
    except Exception as e:
        print(f"Error clearing jobs: {e}")

    print("Clearing Hackathons...")
    try:
         res = supabase.table("hackathons").delete().neq("name", "THIS_STRING_SHOULD_NOT_EXIST").execute()
         print(f"Deleted hackathons: {len(res.data)}")
    except Exception as e:
        print(f"Error clearing hackathons: {e}")

if __name__ == "__main__":
    reset_data()
