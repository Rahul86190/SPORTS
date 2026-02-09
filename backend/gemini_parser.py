import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

def parse_resume_to_json(text: str) -> dict:
    """
    Uses Gemini to extract structured data from resume text.
    """
    print(f"DEBUG: Using API Key: {os.environ.get('GEMINI_API_KEY')[:5]}... (Length: {len(os.environ.get('GEMINI_API_KEY'))})")
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are an expert Resume Parser. 
        Extract the following information from the resume text below and return ONLY valid JSON.
        Do not include markdown formatting (like ```json).
        
        Structure:
        {{
            "full_name": "string",
            "email": "string",
            "phone": "string",
            "education": [
                {{ "degree": "string", "institution": "string", "year": "string" }}
            ],
            "skills": ["string", "string"],
            "experience": [
                {{ "title": "string", "company": "string", "duration": "string", "details": "string" }}
            ],
            "projects": [
                 {{ "name": "string", "tech_stack": ["string"], "description": "string" }}
            ]
        }}
    
        Resume Text:
        {text}
        """
        
        print(f"DEBUG: Extracted {len(text)} chars from resume. Calling Gemini...")
        response = model.generate_content(prompt)

        print("DEBUG: Received response from Gemini.")
        raw_text = response.text
        print(f"DEBUG: Raw Gemini Response: {raw_text[:200]}...")

        # Clean response more aggressively
        clean_text = raw_text.replace("```json", "").replace("```", "").strip()
        
        # Try to find the first '{' and last '}'
        start_idx = clean_text.find('{')
        end_idx = clean_text.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
             clean_text = clean_text[start_idx:end_idx+1]
        
        return json.loads(clean_text)

    except json.JSONDecodeError as e:
        print(f"ERROR: Failed to decode JSON: {e}")
        print(f"ERROR: Invalid JSON Content: {clean_text}")
        return {"error": "Invalid JSON response from AI", "raw": clean_text}
    except Exception as e:
        print(f"Error parsing resume: {e}")
        return {
            "error": "Failed to parse resume",
            "details": str(e)
        }
