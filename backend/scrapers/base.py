from supabase import Client
from backend.database import get_supabase

class BaseScraper:
    def __init__(self):
        self.supabase: Client = get_supabase()
        if not self.supabase:
            raise ValueError("Supabase credentials not found or client failed to initialize.")

    def save_job(self, job_data):
        """
        Upsert a job into the database.
        job_data: dict with keys matching the jobs table columns
        """
        try:
            # Upsert based on URL to avoid duplicates
            data, count = self.supabase.table("jobs").upsert(job_data, on_conflict="url").execute()
            print(f"Saved job: {job_data.get('title')} at {job_data.get('company')}")
        except Exception as e:
            print(f"Error saving job: {e}")

    def save_hackathon(self, hackathon_data):
        """
        Upsert a hackathon into the database.
        hackathon_data: dict with keys matching the hackathons table columns
        """
        try:
            data, count = self.supabase.table("hackathons").upsert(hackathon_data, on_conflict="url").execute()
            print(f"Saved hackathon: {hackathon_data.get('name')}")
        except Exception as e:
            print(f"Error saving hackathon: {e}")
