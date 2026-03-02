# 7. Visual Presentation Analysis

## Next.js UI/UX Architecture

The presentation layer of SPORTS uses a deeply modular approach built on React.

### 1. Dashboard Composability
The user's central hub operates using a dynamic tab-switching layout (`OverviewTab`, `Roadmap`, `Test Lab`). This prevents harsh DOM unmounts/remounts and enables fluid Single Page Application (SPA) behavior. The nested sidebars (`dashboard/Sidebar`) give standard SaaS navigability.

### 2. Interactive Micro-Components
- **Modals & Drawers:** The platform frequently uses slide-in interfaces (like `JobDetailDrawer.tsx` and `resume_patch.py/modal handlers`) to display deep data (like a job requirement) without forcing the user to leave their current context (e.g., the Opportunity Radar).
- **Skill Selector (`SkillSelector.tsx`):** Enables visual tagging of active capabilities. Displays visually distinct badges, enforcing cleaner data ingestion over basic free-text fields.
- **Avatar Engine (`AvatarUpload.tsx`):** Essential for maintaining a personalized, high-retention environment within the "Portfolio Vault."

### 3. The Roadmap Visualizer
The AI-generated roadmap maps mathematical trees to a visual canvas.
The geometry explicitly splits into "Retrospective" (darker, lower-opacity nodes indicating past completion) and "Predictive" (vibrant, forward-facing sprint nodes). This dual-layer visualization acts as a psychological anchor, converting a standard abstract learning plan into an interactive gaming-style "skill tree".

### Next Step Polish
While functional, maintaining extremely cohesive spacing constraints across `Tailored Resumes` renders within the `OverviewTab` will be paramount, as large text blocks from the Gemini engine can sometimes overflow mobile containers. All elements show strong desktop compatibility.
