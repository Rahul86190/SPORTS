import sys
import os
import uvicorn

# Ensure the root project directory is in the Python path
sys.path.insert(0, os.path.abspath(".."))

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
