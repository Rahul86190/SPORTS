# 2. Project Structure Analysis

The project implements a decoupled Client-Server architecture, utilizing **Next.js** for the frontend and **FastAPI** with Python for the backend, communicating over REST APIs. It is integrated with a **Supabase (PostgreSQL)** database for data persistence and authentication.

## 1. Root Directory (`e:\Projects\SPORTS`)
- **backend/**: Contains the Python application, API routers, database models, and web scrapers.
- **frontend/**: Contains the Next.js React application, user interfaces, components, and state management.
- **Architecture/**: Houses the generated analytical and reporting documents.
- **docs/**: Includes generation scripts for PDFs, docx, and synopses.

## 2. Frontend Structure (`frontend/`)
The frontend is built using Next.js App Router (`app/`).
- **`app/`**: Contains core route modules mapping to application pages.
  - `login/` & `signup/`: Authentication pages.
  - `onboarding/`: User profile initialization workflow.
  - `dashboard/`: The main authenticated application interface containing the Overview, Test Lab, Portfolio, etc.
  - `opportunities/`, `resources/`: Navigational subsections of the platform.
- **`components/`**: Reusable React components.
  - `dashboard/`: Contains tabs (e.g., OverviewTab) composing the main user view.
  - `roadmap/`: Visual nodes and modules rendering the AI-powered growth path.
  - `tutor/`, `resources/`: Specialized domain components.
  - UI generics: `JobDetailDrawer.tsx`, `AvatarUpload.tsx`, `SkillSelector.tsx`, `Navbar.tsx`.
- **`lib/`**: Contains utility functions and API clients configured for Next.js.

## 3. Backend Structure (`backend/`)
Built with Python 3.12+ and FastAPI.
- **`main.py`**: The application entry point binding all routers and CORS middleware.
- **`routers/`**: Distinct controllers handling application domains:
  - `chat.py`: LLM/chatbot interactions.
  - `roadmap.py`: Generating and fetching user learning paths.
  - `opportunities.py` & `job_detail.py`: Fetching jobs/hackathons and matching scores.
  - `prep.py`: Generating the simulated tests.
  - `resume.py`: Managing tailored resume generation via structured parsers.
  - `resources.py`: Handling content link generation.
- **`services/`**: Encapsulates core business logic decoupling the routers from data processing.
- **`scrapers/`**: Asynchronous tasks designed to pull live data from external platforms (e.g., `jobs.py`, `hackathons.py`).
- **`database.py` & `schema.sql`**: Configures the Supabase connection and defines the base table schemas (`profiles`, `jobs`, `hackathons`).
- **`adapters/`**: External API integration layers (e.g., Gemini AI, Supabase).
- **`scripts`**: Various operational python scripts for testing specific modules standalone (e.g., `test_gemini.py`, `verify_chat.py`).

## Summary
The codebase is cleanly layered. The division between modular routers within FastAPI ensures vertical slicing for features, while Next.js component segregation keeps the UI modular and cleanly scoped.
