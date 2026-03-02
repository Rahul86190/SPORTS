# 8. Bugs and Latency Issues

This document lists identified architectural friction points, potential bugs, and latency traps.

## Current & Potential Bugs
1. **Document Parsing Overlap:**
   - *Bug/Risk:* Uploading a massive `.docx` file may cause the string extract to exceed Gemini's context window.
   - *Fix Needed:* Implement semantic chunking before passing the string to the LLM.
2. **Missing PDF Support:**
   - *Bug/Risk:* Hardcoded in `main.py` is a throw on `.pdf`. Standard users predominantly use PDFs for resumes, causing an immediate UX break.
3. **Scraper Failures Crashing State:**
   - *Bug/Risk:* If `Devpost` or a job board changes its DOM, the `BeautifulSoup`/XPath selectors in Python will return `NoneType`. If unhandled, this might insert `NULL` properties into Supabase, which Next.js map functions might trip over, causing white screens.
4. **Race Conditions in Supabase Triggers:**
   - *Bug/Risk:* If a user attempts to update their profile immediately upon OAuth return but before the Supabase PostgreSQL trigger `handle_new_user()` commits the row, Next.js will hit a 404 on the `UPDATE` call.

## Latency Issues
1. **LLM Generation Bottleneck:**
   - *Issue:* Hitting `/api/roadmap/generate` relies on a synchronous block waiting for Gemini to generate JSON. This can take 5-15 seconds.
   - *Solution/Fix:* The backend must wrap this in a true async worker (e.g., Celery/Redis or FastAPI `BackgroundTasks`) and return a `TaskID` to Next.js. Next.js can then poll `status` or use WebSockets, displaying a dynamic loading bar instead of hanging the main thread.
2. **Scraping Cold Boots:**
   - *Issue:* Running the scraper inline during a user request will freeze the request until the DOM is fetched.
   - *Solution/Fix:* Scrapers must be strictly decoupled via Cron jobs (e.g., scraping Jobs nightly at 3 AM into Supabase) so the user only queries Postgres, guaranteeing <50ms load times.
