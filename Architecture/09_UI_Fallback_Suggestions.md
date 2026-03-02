# 9. UI Fallback Messages for API Failures

A major SaaS application must handle API timeouts seamlessly. Below are exact suggestions for where and how Next.js should handle FastAPI connection drops or LLM timeouts.

### 1. Generating Future Path (Roadmap Tab)
- **Scenario:** The user requests a new path, but Gemini times out or the backend errors.
- **Fallback UI Component:** Replace the loading spinner with a custom Empty State Box.
- **Suggested Message:** *"We hit a snag mapping your future! Our AI is currently recalibrating market trends. In the meantime, focus on your active 'In Progress' node or try generating again in a few moments."*
- **Action Button:** `[Retry Generation]`

### 2. Market Opportunities (Placement Hub)
- **Scenario:** The Next.js fetch to `/api/opportunities` fails, or Supabase is down.
- **Fallback UI Component:** A Skeleton Loader replaces the list. If it fails after 3 tries, show a Card.
- **Suggested Message:** *"The job boards are currently out of reach. Don't worry, your Compatibility Scores are safe. While we reconnect, why not brush up your skills in the Test Lab?"*
- **Action Button:** `[Go to Test Lab]`

### 3. Resume Tailoring Engine
- **Scenario:** Processing the `.docx` fails or the user uploads an unsupported PDF.
- **Fallback UI Component:** Red Toast Notification + Inline Error below the Dropzone.
- **Suggested Message (Unsupported):** *"Oops! We only support .docx and .txt files right now. PDF support is coming soon. Please convert your file and upload again."*
- **Suggested Message (LLM Crash):** *"Our Resume Engine is currently overloaded polishing other student resumes. Please hit retry, or proceed with your default portfolio profile."*
- **Action Button:** `[Upload Different File]`

### 4. General Global Fallback (Axios/Fetch Interceptor)
- Implement a global Error Boundary in React (`error.tsx` in the Next.js App router).
- **Suggested Message:** *"Connection Lost. We couldn't sync your latest progress. Reconnecting automatically..."* (With a passive CSS loading bar).
