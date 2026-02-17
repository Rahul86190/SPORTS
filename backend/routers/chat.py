from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
try:
    from backend.utils.gemini_client import GeminiClient
except ImportError:
    from utils.gemini_client import GeminiClient

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = "General Programming"

from fastapi.responses import StreamingResponse

@router.post("/")
async def chat_with_tutor(request: ChatRequest):
    try:
        client = GeminiClient()
        return StreamingResponse(
            client.chat_with_tutor_stream(request.message, request.context),
            media_type="text/plain"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
