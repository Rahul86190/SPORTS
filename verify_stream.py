import requests
import json
import sys

def test_stream_chat():
    url = "http://localhost:8000/api/chat/"
    payload = {
        "message": "Write a hello world in python",
        "context": "Verification"
    }
    
    print(f"Testing Streaming {url}...")
    try:
        with requests.post(url, json=payload, stream=True, timeout=10) as response:
            if response.status_code == 200:
                print("Connected! Receiving stream:")
                print("-" * 20)
                for chunk in response.iter_content(chunk_size=None):
                    if chunk:
                        text = chunk.decode('utf-8')
                        sys.stdout.write(text)
                        sys.stdout.flush()
                print("\n" + "-" * 20)
                print("Stream complete.")
            else:
                print(f"FAILURE: Status Code {response.status_code}")
                print(response.text)
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_stream_chat()
