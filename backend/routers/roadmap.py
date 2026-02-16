from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from backend.database import get_supabase
from backend.utils.gemini_client import GeminiClient

router = APIRouter()

class RoadmapRequest(BaseModel):
    user_id: str
    goal: str

@router.post("/generate")
async def generate_roadmap(request: RoadmapRequest):
    supabase = get_supabase()
    
    # 1. Fetch User Profile
    try:
        response = supabase.table("profiles").select("*").eq("id", request.user_id).single().execute()
        profile = response.data
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # 2. Check if roadmap already exists? 
    # For now, we regenerate if requested explicitly via this endpoint.
    # In future, frontend might check existence before calling.
    
    # 3. Call Gemini
    try:
        client = GeminiClient()
        roadmap_data = client.generate_roadmap(profile.get('resume_data', {}), request.goal)
        
        if "error" in roadmap_data:
            print(f"Roadmap Generation Error: {roadmap_data['error']}")
            if "429" in roadmap_data['error']:
                 raise HTTPException(status_code=429, detail="AI Rate Limit Reached. Please try again in a minute.")
            raise HTTPException(status_code=500, detail=f"AI Generation failed: {roadmap_data['error']}")
            
        # 4. Save to Database
        supabase.table("profiles").update({"roadmap_data": roadmap_data}).eq("id", request.user_id).execute()
        
        return {"message": "Roadmap generated successfully", "roadmap": roadmap_data}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"CRITICAL ERROR in generate_roadmap: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
class UpdateProgressRequest(BaseModel):
    user_id: str
    node_id: str
    completed: bool

@router.put("/progress")
async def update_progress(request: UpdateProgressRequest):
    supabase = get_supabase()
    
    # 1. Fetch current roadmap
    try:
        response = supabase.table("profiles").select("roadmap_data").eq("id", request.user_id).single().execute()
        if not response.data or not response.data.get("roadmap_data"):
             raise HTTPException(status_code=404, detail="Roadmap not found")
        
        roadmap = response.data["roadmap_data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # 2. Update the specific node/subtopic
    updated = False
    
    # Helper to traverse and update
    if "phases" in roadmap:
        for phase in roadmap["phases"]:
            for node in phase["nodes"]:
                # Check Main Node
                if node["id"] == request.node_id:
                    node["completed"] = request.completed
                    updated = True
                    break
                
                # Check Subtopics
                if "subtopics" in node:
                    # Subtopic IDs might need to be generated if they aren't unique in the JSON yet.
                    # Frontend currently generates IDs like "node_id-sub-index". 
                    # We need to rely on the frontend sending a recognizable ID or index.
                    # Let's assume frontend sends "node_id-sub-index" and we parse it,
                    # OR we add IDs to subtopics during generation. 
                    # FAST FIX: Frontend sends "node_id-sub-index". We parse `index` from it.
                    if request.node_id.startswith(node["id"] + "-sub-"):
                        try:
                            # extract index from "node_1-sub-2" -> 2
                            sub_idx = int(request.node_id.split("-sub-")[-1])
                            if 0 <= sub_idx < len(node["subtopics"]):
                                node["subtopics"][sub_idx]["completed"] = request.completed
                                updated = True
                        except:
                            pass
                
                if updated: break
            if updated: break

    if not updated:
        raise HTTPException(status_code=404, detail="Node ID not found in roadmap")

    # 3. Save back to DB
    try:
        supabase.table("profiles").update({"roadmap_data": roadmap}).eq("id", request.user_id).execute()
        return {"message": "Progress updated", "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save progress: {str(e)}")

class Note(BaseModel):
    id: str
    content: str
    x: float
    y: float
    width: Optional[float] = 200
    height: Optional[float] = 200
    color: Optional[str] = "#fef3c7" # Default yellow

class UpdateNotesRequest(BaseModel):
    user_id: str
    notes: list[Note]

@router.post("/notes")
async def update_notes(request: UpdateNotesRequest):
    supabase = get_supabase()
    
    try:
        # 1. Fetch current roadmap
        response = supabase.table("profiles").select("roadmap_data").eq("id", request.user_id).single().execute()
        if not response.data:
             raise HTTPException(status_code=404, detail="User not found")
        
        roadmap = response.data.get("roadmap_data", {}) or {}
        
        # 2. Update notes field (merging or overwriting?)
        # For simplicity, we overwrite the notes array with the new state from frontend
        roadmap["notes"] = [note.dict() for note in request.notes]
        
        # 3. Save back
        supabase.table("profiles").update({"roadmap_data": roadmap}).eq("id", request.user_id).execute()
        
        return {"message": "Notes saved", "success": True}
    except Exception as e:
        print(f"Error saving notes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save notes: {str(e)}")
