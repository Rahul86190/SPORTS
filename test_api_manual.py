import requests
try:
    print(requests.get('http://localhost:8000/api/resume/history?user_id=f6c7ecf4-5d4d-491c-87f6-a9543725c311').json())
    print(requests.get('http://localhost:8000/api/prep/history?user_id=f6c7ecf4-5d4d-491c-87f6-a9543725c311').json())
except Exception as e:
    print("Error:", e)
