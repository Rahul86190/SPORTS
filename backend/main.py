from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SPORTS Backend", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to SPORTS API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

try:
    from .routers import roadmap
except ImportError:
    from routers import roadmap
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["Roadmap"])

from fastapi import UploadFile, File, HTTPException
from gemini_parser import parse_resume_to_json
import io
import docx

@app.post("/api/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    print(f"DEBUG: Received file upload: {file.filename}")
    text = ""
    
    if file.filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(await file.read()))
        text = "\n".join([para.text for para in doc.paragraphs])
    elif file.filename.endswith(".txt"):
        content = await file.read()
        text = content.decode("utf-8")
    else:
        # TODO: Add PDF support (pypdf or similar)
        raise HTTPException(status_code=400, detail="Only .docx and .txt files are supported for now.")

    print(f"DEBUG: Extraction complete. Text length: {len(text)}")
    print(f"DEBUG: Preview: {text[:500]}")
    
    if not text.strip():
        print("ERROR: Extracted text is empty!")
        raise HTTPException(status_code=400, detail="Could not extract text from file.")

    parsed_data = parse_resume_to_json(text)
    return parsed_data

from scrapers.jobs import JobScraper
from scrapers.hackathons import HackathonScraper

@app.post("/api/scrape/jobs")
async def trigger_job_scrape():
    try:
        scraper = JobScraper()
        scraper.run()
        return {"message": "Job scraping completed successfully"}
    except Exception as e:
        print(f"Error: {e}")
        # Return success anyway for MVP so UI doesn't break if one site fails
        return {"message": f"Scraping attempted: {str(e)}"}

@app.post("/api/scrape/hackathons")
async def trigger_hackathon_scrape():
    try:
        scraper = HackathonScraper()
        scraper.run()
        return {"message": "Hackathon scraping completed successfully"}
    except Exception as e:
        print(f"Error: {e}")
        return {"message": f"Scraping attempted: {str(e)}"}
