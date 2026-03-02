import requests
import json
import uuid

# Get history for the test user
user_id = "test_user_id"  # Usually we use a static user ID in testing or fetch one
res_history = requests.get(f"http://localhost:8000/api/resume/history?user_id={user_id}")

print("History response code:", res_history.status_code)
history_data = res_history.json()

if history_data and len(history_data) > 0:
    first_id = history_data[0]['id']
    print("Found resume ID:", first_id)
    
    # Try fetching it
    res_saved = requests.get(f"http://localhost:8000/api/resume/saved/{first_id}?user_id={user_id}")
    print("Saved fetch response code:", res_saved.status_code)
    
    if res_saved.status_code == 200:
        saved_data = res_saved.json()
        print("Successfully fetched saved resume.")
        print("Keys returned:", list(saved_data.keys()))
        print("resume_data is type:", type(saved_data.get('resume_data')))
    else:
        print("Error fetching saved resume:", res_saved.text)
else:
    print("No history found for test_user_id. Cannot test direct fetch.")
