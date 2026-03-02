# 6. Process Analysis

## Core Workflows Evaluated

### 1. The Resume Ingestion Process
- **Current Flow:** User provides a `.docx` -> FastAPI receives byte stream, decodes via `python-docx` -> Sends raw text to Gemini -> Maps to JSON -> Saves to `profiles.resume_data`.
- **Analysis:** Works securely. However, the system currently hard-rejects PDF architectures. A `TODO` inside `main.py` explicitly marks PDF expansion. Currently, text chunking isn't visible, meaning a massive 15-page CV might exceed the default context limits.

### 2. Market Scraping Process
- **Current Flow:** Web scrapers (`scrapers/jobs.py` & `hackathons.py`) activate via hitting `/api/scrape/*`.
- **Analysis:** Cleanly decoupled. Because web HTML frequently mutates, abstracting this prevents the main user thread from hanging. If a scraper fails, it successfully returns a caught exception without dragging the FastAPI router down, ensuring UI continuity.

### 3. Competency Assessment Process (Test Lab)
- **Current Flow:** React component state tracks question responses -> evaluates against a target -> adjusts difficulty.
- **Analysis:** Logical execution is sound. The frontend encapsulates the immediate test state securely. The synchronization to the immutable "Skill Transcript" ensures that "refresher nodes" only occur upon true failure logic, rather than random noise.

### 4. Roadmap Generation Loop
- **Current Flow:** Uses `roadmap.py` alongside `roadmap_data.json` artifacts for payload caching.
- **Analysis:** Employs a highly efficient loop. Saving the generative structure locally as JSON caches the heavy LLM response, dropping repetitive token costs, and vastly reducing UI render latency on repeat visits.
