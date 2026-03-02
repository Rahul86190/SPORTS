import urllib.request
import json
import uuid

req_data = {
    "user_id": str(uuid.uuid4()),
    "job_id": "internshala-123",
    "job_title": "SWE",
    "company_name": "Google",
    "job_description": "",
    "job_requirements": [],
    "resume_data": {
        "fullName": "User",
        "headline": "Student",
        "email": "test@test.com",
        "phone": "",
        "website": "",
        "github": "",
        "linkedin": "",
        "location": "",
        "avatarUrl": "",
        "skills": [],
        "education": [],
        "experience": [],
        "projects": [],
        "country": "",
        "state": "",
        "city": "",
        "careerGoal": "",
        "experienceLevel": "",
        "yearOfStudy": ""
    }
}

req = urllib.request.Request(
    'http://localhost:8000/api/resume/tailor', 
    headers={'Content-Type': 'application/json'}, 
    data=json.dumps(req_data).encode('utf-8')
)
try:
    resp = urllib.request.urlopen(req)
    print("SUCCESS")
    print(resp.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print(e.read().decode())
except Exception as e:
    print("CONNECTION ERROR:", str(e))
