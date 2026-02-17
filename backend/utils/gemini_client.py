import os
import google.generativeai as genai
import json
from dotenv import load_dotenv

from pathlib import Path

# Load environment variables from project root
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class GeminiClient:
    def __init__(self):
        # Force reload .env to pick up changes without restarting server
        load_dotenv(dotenv_path=env_path, override=True)
        
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("Warning: GEMINI_API_KEY not found in environment variables.")
            self.model = None
        else:
            print(f"DEBUG: GEMINI_API_KEY found (starts with {self.api_key[:4]}...)")
            genai.configure(api_key=self.api_key)
            # Use a valid model from the list
            # Switched to 'gemini-flash-latest' (1.5 Flash stable) for better quotas
            self.model = genai.GenerativeModel('gemini-flash-latest')

    def generate_roadmap(self, profile_data: dict, goal: str) -> dict:
        if not self.model:
             return {"error": "GEMINI_API_KEY is missing in backend/.env"}

        """
        Generates a phased roadmap based on the user's profile and goal.
        """
        
        prompt = f"""
        You are an expert Career Coach and Curriculum Designer.
        Create a personalized, step-by-step learning roadmap for a student.

        **Student Profile:**
        - Current Skills: {', '.join(profile_data.get('skills', []))}
        - Experience Level: {self._get_experience_level(profile_data)}
        - Goal Role: {goal}

        **Requirements:**
        1.  **Phased Approach**: Break the journey into logical "Phases" (e.g., Foundation, Intermediate, Advanced, Mastery).
        2.  **Time Estimates**: Provide a total estimated time for each Phase (e.g., "4 Weeks") and for each specific Node (e.g., "3 Hours"). These should be realistic for a student.
        3.  **Specific Focus**: For each node, explain EXACTLY what to learn and what to skip to avoid information overload.
        4.  **Resources**: Provide 1-2 high-quality, FREE, PUBLIC links (Official Docs, YouTube, FreeCodeCamp, etc.) for each node.

        **Output Format:**
        Return ONLY valid JSON with the following structure:
        {{
            "roadmap": {{
                "title": "Roadmap Title",
                "description": "Brief overview",
                "phases": [
                    {{
                        "id": "phase_1",
                        "title": "Phase 1: Title",
                        "estimated_time": "4 Weeks",
                        "description": "Goal of this phase",
                        "nodes": [
                            {{
                                "id": "node_1",
                                "title": "Main Topic",
                                "estimated_time": "5 Hours",
                                "description": "Overview...",
                                "subtopics": [
                                    {{ "title": "Subtopic 1", "time": "1h" }},
                                    {{ "title": "Subtopic 2", "time": "30m" }}
                                ],
                                "specific_focus": "Focus on...",
                                "resources": [
                                    {{ "title": "Resource Name", "url": "https://..." }}
                                ]
                            }}
                        ]
                    }}
                ]
            }}
        }}
        """

        retries = 3
        base_delay = 2

        for attempt in range(retries):
            try:
                # Increased timeout to 600s to handle complex prompt with subtopics
                from google.api_core import retry
                response = self.model.generate_content(
                    prompt, 
                    request_options={'timeout': 600}
                )
                # Clean response to ensure valid JSON
                text = response.text
                if text.startswith("```json"):
                    text = text.replace("```json", "").replace("```", "")
                data = json.loads(text)
                return data.get("roadmap", data)
            except Exception as e:
                error_str = str(e)
                if "429" in error_str and attempt < retries - 1:
                    import time
                    sleep_time = base_delay * (2 ** attempt)
                    print(f"Gemini 429 Rate Limit. Retrying in {sleep_time}s...")
                    time.sleep(sleep_time)
                    continue
                
                print(f"Error generating roadmap (Attempt {attempt+1}): {e}")
                if attempt == retries - 1:
                    return {"error": str(e)}

    def chat_with_tutor(self, message: str, context: str) -> str:
        if not self.model:
            return "Error: AI not configured."
        
        system_prompt = f"""
        You are a friendly and knowledgeable AI Tutor for the SPORTS platform.
        Your goal is to help the student understand the following topic:
        
        CONTEXT: {context}
        
        Keep your answers concise, encouraging, and focused on the context. 
        If the user asks something unrelated, gently guide them back or answer briefly.
        Use Markdown for formatting code or lists.
        """
        
        try:
            # We use a simple generation here. For full chat history, we'd need a chat session object.
            # For this MVP, we treat each message as a standalone query with context.
            full_prompt = f"{system_prompt}\n\nStudent: {message}\nTutor:"
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"Chat Error: {e}")
            return "Sorry, I'm having trouble thinking right now. Please try again."

    def chat_with_tutor_stream(self, message: str, context: str):
        if not self.model:
            yield "Error: AI not configured."
            return
        
        system_prompt = f"""
        You are "Player 0", a friendly and knowledgeable AI Tutor for the SPORTS platform.
        Your goal is to help the student understand the following topic:
        
        CONTEXT: {context}
        
        Keep your answers concise, encouraging, and focused on the context. 
        If the user asks something unrelated, gently guide them back or answer briefly.
        Use Markdown for formatting code or lists.
        """
        
        try:
            full_prompt = f"{system_prompt}\n\nStudent: {message}\nTutor:"
            response = self.model.generate_content(full_prompt, stream=True)
            for chunk in response:
                yield chunk.text
        except Exception as e:
            print(f"Chat Stream Error: {e}")
            yield "Sorry, I'm having trouble thinking right now. Please try again."

    def _get_experience_level(self, profile: dict) -> str:
        # Simple heuristic
        if len(profile.get('experience', [])) > 0:
            return "Professional / Experienced"
        if len(profile.get('projects', [])) > 2:
            return "Intermediate Student"
        return "Beginner Student"
