from backend.database import get_supabase

def main():
    supabase = get_supabase()
    
    # Jobs
    print("Fetching Jobs...")
    res = supabase.table('jobs').select('source').execute()
    jobs = res.data
    
    job_stats = {}
    for j in jobs:
        src = j.get('source') or 'Unknown'
        # Normalize simple check
        if 'Internshala' in src: key = 'Internshala'
        elif 'LinkedIn' in src: key = 'LinkedIn'
        elif 'Unstop' in src: key = 'Unstop'
        elif 'AICTE' in src: key = 'AICTE'
        elif 'Vikash' in src: key = 'Research (VikashPR)'
        else: key = src
        
        job_stats[key] = job_stats.get(key, 0) + 1
        
    print("\nJob/Internship Counts:")
    for k, v in job_stats.items():
        print(f"  {k}: {v}")
        
    # Hackathons
    print("\nFetching Hackathons...")
    res = supabase.table('hackathons').select('source').execute()
    hacks = res.data
    
    hack_stats = {}
    for h in hacks:
        src = h.get('source') or 'Unknown'
        # Normalize
        if 'Unstop' in src: key = 'Unstop'
        elif 'HackerEarth' in src: key = 'HackerEarth'
        elif 'Devpost' in src: key = 'Devpost'
        elif 'MLH' in src: key = 'MLH'
        else: key = src
        
        hack_stats[key] = hack_stats.get(key, 0) + 1
        
    print("\nHackathon Counts:")
    for k, v in hack_stats.items():
        print(f"  {k}: {v}")

if __name__ == "__main__":
    main()
