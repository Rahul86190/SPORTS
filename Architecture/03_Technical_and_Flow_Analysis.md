# 3. Technical, Database, and Flow Analysis

## Codebase Analysis
The SPORTS platform employs a robust separation of concerns by splitting the frontend (Next.js) and the backend (FastAPI). 
**Frontend:** The UI extensively relies on React Hooks and context (`AuthProvider.tsx`) to manage real-time states (like user authentication via Supabase). Reusable components (`JobDetailDrawer.tsx`, `SkillSelector.tsx`, `AvatarUpload.tsx`) ensure rapid scaling. 
**Backend:** The backend leverages FastAPI, guaranteeing high-performance async routing. Python enables seamless integration with heavy data modules, like document parsing (`extract_docx.py`, `resume_patch.py`) and GenAI prompt handling (`gemini_parser.py`). Web scraping runs via decoupled asynchronous modules (`scrapers/jobs.py`, `scrapers/hackathons.py`).

## Database Analysis
SPORTS relies on a PostgreSQL instance managed by **Supabase**, leveraging Row Level Security (RLS) policies.
- **`profiles`:** Stores the unified ID. It connects to the `auth.users` via UUID foreign keys. It caches crucial structured fields, `skills` and `resume_data`, in flexible `jsonb` columns.
- **`jobs` & `hackathons`:** Independent tables acting as active bulletin boards for parsed external opportunities. Both rely on UUID keys and basic columns (`url`, `source`, `tags`).

## API Connectivity
All logic sits behind Next.js fetch calls invoking `http://localhost:8000/api/...`
Key connections:
1. **Frontend <-> Supabase:** Direct client-side calls for Auth and Profile mutations (bypassing the custom Python backend where business logic isn't needed).
2. **Frontend <-> FastAPI:** Complex processing endpoints (generating roadmaps, evaluating tests, generating customized resumes).
3. **FastAPI <-> Gemini:** The core LLM node (powered by Google's Gemini models) operates as the AI-brain behind parsing unstructured resumes into JSON maps, and generating dynamic future trees.
4. **FastAPI <-> Web:** Scrapers routinely ping job boards to fill local tables.

## Complete Process Flow
1. **User Auth:** User signs up. Supabase automatically triggers `public.handle_new_user()` creating a profile row.
2. **Onboarding:** User passes the onboarding screen mapping out foundational `skills`; frontend updates the `profiles` table.
3. **The AI Loop (Roadmap):** The frontend hits `/api/roadmap/generate`. The Python endpoint scrapes the current `skills`, queries the LLM, parses the returned tree, saves the updated tree node map locally, and streams the geometry back to the React UI router for SVG rendering.
4. **Validation (Prep Lab):** User attempts an assessment. Scores bounce back; if Tier 3 validation fails, an augmentation is sent to the Roadmap engine triggering a new path regeneration.
