# SPORTS: Master Project Architecture & Analysis Document

**SPORTS (Student Progress Organizer and Record Track of Study)** is a comprehensive student support platform designed to act as a dynamic, living roadmap for career growth. 

This document serves as the **Master Output** of the complete system analysis, covering the architecture, data flow, component design, latency evaluation, and future roadmap.

---

## 1. Project Requirements & Objective
The primary objective of SPORTS is to track, assess, and guide a student's educational and professional development through data-driven insights and AI integration.

### Key Modules Evaluated:
*   **The Portfolio Vault (Unified Identity):** Acts as a central digital identity replacing static resumes. Features a verifiable locker for certifications and outputs a public profile link.
*   **Generate Future Path (AI-Powered Growth Engine):** Generates specialized learning paths calculating the shortest route to a target job role using predictive mapping.
*   **The Test Lab (Adaptive Assessment):** Replaces static quizzes with an adaptive competency-based validation system identifying specific skill gaps.
*   **Placement & Interview Hub (Predictive Intelligence):** Matches industry job requirements against verified student skills and simulates company-specific interviews.
*   **Strategic Analytics (Resume & Radar):** Tailors resumes per job role automatically and predicts hackathons the student has a high likelihood of winning.

---

## 2. Project Structure Analysis
The architecture utilizes a decoupled **Next.js (React)** frontend and a **FastAPI (Python)** backend.

### Frontend (`/frontend`)
*   **App Router (`/app`):** Contains the core functional pages (`login`, `signup`, `onboarding`, `dashboard`, `opportunities`).
*   **Components (`/components`):** Reusable, highly modular React elements (e.g., `JobDetailDrawer.tsx`, `SkillSelector.tsx`, `AvatarUpload.tsx`).
*   **State Management:** Relies efficiently on React Contexts (`AuthProvider.tsx`) and hooks.

### Backend (`/backend`)
*   **FastAPI Core (`main.py`):** The primary server entry point managing CORS and mounting domain-specific routers.
*   **Routers (`/routers`):** Vertically sliced APIs handling `chat`, `roadmap`, `opportunities`, `prep`, and `resume`.
*   **Scrapers (`/scrapers`):** Asynchronous python scripts dynamically pulling competitive programming and job data from external sources.

---

## 3. Technical, Database & API Flow

### Database Schema (Supabase / PostgreSQL)
*   `profiles`: The centralized user spine linked to Supabase Auth. Utilizes `jsonb` scaling for flexible `skills` and `resume_data` parameters.
*   `jobs` & `hackathons`: Bulletin board tables operating independently with Row Level Security (RLS) enabled.

### API Connectivity
1.  **Frontend → Supabase:** Client-side mutations for rapid perceived performance (e.g., updating avatars).
2.  **Frontend → FastAPI:** Forwarding heavy compute tasks (test evaluations, roadmap generation).
3.  **FastAPI → Gemini AI:** Acts as the cognitive engine for unstructured resume parsing and complex learning tree generation.

### Logical Process Flow
*   **Ingestion:** User signs up → Supabase triggers `public.handle_new_user()` → `profiles` row is created.
*   **AI Generation:** User requests Roadmap → Next.js hits `/api/roadmap/generate` → Python asks Gemini → Returns JSON tree → Visualized on React canvas.

---

## 4. Current Working Ecosystem Review
After a comprehensive local execution review (`npm run dev` & `uvicorn`):
*   **Stability:** Next.js and FastAPI start cleanly with no strict crashing build errors.
*   **Defensive Programming:** Backend routers use `try-except ImportError` logic to ensure application uptime even if a modular python file is displaced.
*   **Document Engine:** The `/api/parse-resume` correctly intercepts `.docx`, decodes it via `python-docx`, and pipes it into Gemini.

---

## 5. System Architectural Models (UML Summary)
*   **Architecture:** The system flows from User Interface (React) -> Load Balancer/API (FastAPI) -> Core Engine (Gemini LLM) -> Persistence (Supabase).
*   **Roadmap Sequence:** A highly synchronous loop where the AI Adapter translates natural language competencies into mathematical JSON arrays for the UI to map geographically.

---

## 6. Process & Workflow Analysis
*   **The Resume Ingestion:** Works flawlessly on `.docx`. It decodes bytes to strings locally before executing an AI call.
*   **Market Scraping:** Fully abstracted into independent endpoint triggers (`/api/scrape/*`). This guarantees that a slow job-board website won't accidentally hang a student's login request.
*   **Competency Assessments:** UI state securely gates the user's progress until completion, preventing spoofed test completions being sent to the backend.

---

## 7. Visual Presentation & UI
*   **SPA Composability:** The `Dashboard` leverages seamless nested components (Overview, Roadmap, Test Lab) eliminating full page reloads.
*   **Deep Integration Modules:** Heavy reliance on Drawers and Modals (`JobDetailDrawer.tsx`) to surface deep data (e.g., job descriptions) while keeping the user anchored on their primary view.
*   **Visual Roadmap Canvas:** Geometrically splits into "Retrospective" (past skills) and "Predictive" (future skills) creating an immersive, gaming-style skill-tree experience.

---

## 8. Identifying Bugs & Latency Traps
To ensure production readiness, the following areas require immediate defensive coding:

### Potential Bugs
*   **PDF Support Omission:** The backend explicitly rejects `.pdf` files. Since most resumes are PDFs, this causes immediate UX friction.
*   **Scraper Brittleness:** If an external job board updates its HTML tags, `BeautifulSoup` scrapers may return `None` and crash the data insertion loops.

### Latency Traps
*   **Synchronous LLM Calls:** `/api/roadmap/generate` forces the user to wait synchronously for Gemini. This can cause the browser to look frozen.

---

## 9. Recommended UI Fallback States
Due to the latency traps above, these targeted UI fallbacks should be added:
*   **Roadmap Timeouts:** *"We hit a snag mapping your future! Our AI is currently recalibrating market trends. Try generating again in a few moments."*
*   **Job Scraper Failures:** *"The job boards are currently out of reach. Don't worry, your Compatibility Scores are safe. While we reconnect, why not brush up your skills in the Test Lab?"*
*   **Resume Crashes:** *"Our Resume Engine is overloaded right now. Please hit retry, or proceed with your default profile."*

---

## 10. Runtime Logs Strategy
To properly monitor the system in production, we must drop standard `print()` statements:
1.  **Backend (Python):** Shift to standard JSON `logging`. Every error log must output the `user_uuid`, `latency_ms`, and `endpoint` so we can track exactly which endpoint the LLM failed on.
2.  **Frontend (Next.js):** Wrap the application in `Sentry.ErrorBoundary` to capture device stats, browser cache states, and React component stack traces for white-screen failures.

---

## 11. Future Enhancements & Extensibility
To evolve SPORTS from an isolated "Single-Player" tool to a "Multiplayer" ecosystem:
1.  **Code Colosseum:** Introduce an embedded web-IDE (like Monaco) allowing real-time technical test simulations instead of just multiple choice questions.
2.  **Alumni Connect Network:** A mentorship engine mapping freshmen lacking a skill to seniors who aced the Test Lab for that exact skill.
3.  **Real-Time Interview Sandbox:** Use WebRTC browser microphones and Gemini Vocals to conduct a physically spoken AI interview.
