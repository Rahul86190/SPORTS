import requests
import json

def test_root():
    try:
        url = "http://localhost:8000/"
        print(f"Testing {url}...")
        response = requests.get(url, timeout=5)
        print(f"Root Status: {response.status_code}")
    except Exception as e:
        print(f"Root Error: {e}")

def test_chat():
    test_root()
    url = "http://localhost:8000/api/chat/"
    payload = {
        "message": "Hello, verify me.",
        "context": "Verification"
    }
    
    try:
        print(f"Testing {url}...")
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("SUCCESS: Chat endpoint is working.")
        else:
            print("FAILURE: Endpoint returned non-200.")
            
    except Exception as e:
        print(f"ERROR: Could not connect to {url}. {e}")
        # Try without trailing slash just in case
        try:
            url_no_slash = "http://localhost:8000/api/chat"
            print(f"Retrying with {url_no_slash}...")
            response = requests.post(url_no_slash, json=payload, timeout=10)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e2:
            print(f"ERROR: {e2}")

if __name__ == "__main__":
    test_chat()
