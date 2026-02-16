import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

sql = """
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS roadmap_data JSONB;
"""

try:
    # Supabase-py doesn't expose raw SQL execution easily on free tier sometimes, 
    # but let's try via rpc if a function exists, or just use the dashboard?
    # Wait, the python client doesn't support raw SQL execution directly unless we have a function.
    # Actually, we can't run DDL (ALTER TABLE) from the client usually due to permissions.
    
    # Correction: I will print the SQL and ask the user to run it in the dashboard 
    # because I cannot execute DDL from here with the anon/service key usually.
    # BUT, I can try to use the REST API if I had the service key, but I only have the key in .env
    # Let's see if there's a workaround or just instruct the user.
    
    print("Cannot execute DDL directly via Python client without a stored procedure.")
    print("Please run this in your Supabase SQL Editor:")
    print(sql)

except Exception as e:
    print(f"Error: {e}")
