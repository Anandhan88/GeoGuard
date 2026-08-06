"""
GeoGuard AI - Chatbot API Endpoint (MongoDB Atlas / Beanie ODM)
"""
from fastapi import APIRouter, Query
from app.ml.nlp.disaster_chat import DisasterRAGChatbot

router = APIRouter()

@router.get("/")
async def chat_interaction(
    query: str = Query(..., description="User message to the assistant"),
    lang: str = Query("en", description="Preferred response language ('en', 'ta', 'hi')")
):
    """Interact with the RAG Disaster Assistant chatbot."""
    bot = DisasterRAGChatbot()
    response = await bot.get_response(query, lang)
    return {"response": response, "query": query, "lang": lang}
