# 10. Runtime Logs Strategy

To diagnose stuck API calls, silent failures, and latent bugs, the project must implement a unified logging strategy across both stacks.

## 1. Backend Python Logging (FastAPI)
Relying on standard `print()` is dangerous for production because it is untraceable and blocks the GIL in massive volumes.

**Strategy: Implement `logging` with JSON formatters.**
1. Create a `logger.py` utility using Python's core `logging` module.
2. Bind an interceptor for every FastAPI request/response.
3. Log schema:
   ```json
   {
      "timestamp": "2026-03-02T14:25:52Z",
      "level": "ERROR",
      "endpoint": "/api/roadmap/generate",
      "user_uuid": "1234-abcd...",
      "latency_ms": 1405,
      "message": "Gemini API Timeout after 15s",
      "traceback": "..."
   }
   ```
4. Output these logs to `stdout` temporarily, but pipe them into a centralized system like **Datadog** or **Logtail** in production.

## 2. Frontend React Logging (Next.js)
Client-side UI failures (white screens, undefined mapping errors) must be aggregated.

**Strategy: Implement Sentry (`@sentry/nextjs`).**
1. Wrap the entire React tree in `Sentry.ErrorBoundary`.
2. Sentry will automatically capture the React component stack trace, the OS string (Windows), the browser cache state, and the exact line `OverviewTab.tsx` crashed on.
3. It separates "Frontend Errors" from "Network Errors".

## 3. The "Stuck" Resolution Protocol
If a student reports being "stuck" (e.g., loading wheel never finishes):
1. Identify their `user.id`.
2. Query Sentry for frontend Promise rejections related to that ID.
3. Query the Python JSON logs using `grep` corresponding to that specific `user_uuid`.
4. This instantly isolates whether the Next.js `fetch` threw an `AbortError`, or if the FastAPI router threw a `500 Internal Server Error`.
