import json
import urllib.request
try:
    print(urllib.request.urlopen("http://localhost:8000/api/resume/history?user_id=f6c7ecf4-5d4d-491c-87f6-a9543725c311").read().decode("utf-8"))
except Exception as e:
    print(e)
