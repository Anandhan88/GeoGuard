"""
GeoGuard AI - Chatbot API Endpoint
"""
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.ml.nlp.disaster_chat import DisasterRAGChatbot

router = APIRouter()

@router.get("/")
async def chat_interaction(
    query: str = Query(..., description="User message to the assistant"),
    lang: str = Query("en", description="Preferred response language ('en', 'ta', 'hi')"),
    db: AsyncSession = Depends(get_db)
):
    """Interact with the RAG Disaster Assistant chatbot."""
    bot = DisasterRAGChatbot(db)
    response = await bot.get_response(query, lang)
    return {"response": response, "query": query, "lang": lang}
