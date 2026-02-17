from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from backend.database import get_supabase

router = APIRouter(prefix="/api/resources", tags=["resources"])

class ResourceBase(BaseModel):
    user_id: str
    title: str
    url: str
    type: str # 'video', 'article', etc.
    phase_id: Optional[str] = None
    image_url: Optional[str] = None
    tags: List[str] = []

class ResourceCreate(ResourceBase):
    pass

class Resource(ResourceBase):
    id: str
    created_at: str

@router.post("/")
async def toggle_resource(resource: ResourceCreate):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Check if resource already exists for this user and URL
        print(f"DEBUG: Toggling resource for user {resource.user_id}, URL: {resource.url}")
        existing = supabase.table("resources").select("*").eq("user_id", resource.user_id).eq("url", resource.url).execute()
        print(f"DEBUG: Existing records found: {len(existing.data) if existing.data else 0}")
        
        if existing.data and len(existing.data) > 0:
            # Resource exists -> Remove it (Toggle OFF)
            resource_id = existing.data[0]['id']
            supabase.table("resources").delete().eq("id", resource_id).execute()
            return {"message": "Resource removed", "action": "removed", "url": resource.url}
        else:
            # Resource does not exist -> Create it (Toggle ON)
            data = resource.dict()
            response = supabase.table("resources").insert(data).execute()
            
            if not response.data:
                raise HTTPException(status_code=400, detail="Failed to create resource")
                
            return {"message": "Resource saved", "action": "added", "resource": response.data[0]}

    except Exception as e:
        print(f"Error toggling resource: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[Resource])
async def get_resources(user_id: str, type: Optional[str] = None, phase_id: Optional[str] = None):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        query = supabase.table("resources").select("*").eq("user_id", user_id)
        
        if type:
            query = query.eq("type", type)
            
        if phase_id:
            query = query.eq("phase_id", phase_id)
            
        # Order by created_at desc
        query = query.order("created_at", desc=True)
        
        response = query.execute()
        return response.data
    except Exception as e:
        print(f"Error fetching resources: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{resource_id}")
async def delete_resource(resource_id: str, user_id: str): # user_id for verification
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Verify ownership (RLS handles this but good to be explicit/safe)
        # Actually RLS handles it if we use auth token, but we are using service role key often in dev?
        # No, database.py likely uses the anon key or service role.
        # If service role, we MUST verify ownership manually.
        # But for now, let's just try to delete where id and user_id match.
        
        response = supabase.table("resources").delete().eq("id", resource_id).eq("user_id", user_id).execute()
        
        if not response.data:
            # Maybe it didn't exist or wasn't owned by user
            return {"message": "Resource not found or deleted"}
            
        return {"message": "Resource deleted successfully"}
    except Exception as e:
        print(f"Error deleting resource: {e}")
        raise HTTPException(status_code=500, detail=str(e))
