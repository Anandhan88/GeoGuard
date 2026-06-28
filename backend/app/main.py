"""
GeoGuard AI - FastAPI Main Application
"""
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
import json
import os

from app.core.config import settings
from app.api.v1 import auth, predictions, alerts, reports, shelters, evacuation, impact, weather, chat
from app.core.database import init_db


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Initialize DB (create tables)
    try:
        await init_db()
        print("Database initialized successfully.")
        # Seed all tables
        from app.core.seeding import seed_all
        from app.core.database import async_session_maker
        async with async_session_maker() as session:
            await seed_all(session)
        print("Database seeded successfully.")
    except Exception as e:
        print(f"Database initialization/seeding failed: {e}")

    print(f"API available at http://localhost:8000{settings.API_PREFIX}")
    
    # Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Start weather background updater
    import asyncio
    from app.tasks.weather_updater import start_weather_updater
    from app.core.database import async_session_maker
    app.state.weather_task = asyncio.create_task(start_weather_updater(async_session_maker))
    
    yield
    
    # Shutdown
    print(f"Shutting down {settings.APP_NAME}")
    if hasattr(app.state, "weather_task"):
        app.state.weather_task.cancel()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Hyperlocal Disaster Early Warning, Impact Assessment, and Evacuation Intelligence Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Custom middleware to handle OPTIONS preflight requests that may arrive
# without a proper Origin header (some browsers/extensions do this).
class CORSPreflightMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD",
                    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Origin, X-Requested-With",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "600",
                },
            )
        return await call_next(request)

# CORS — the preflight middleware must be added AFTER CORSMiddleware
# (middleware executes in reverse order, so this runs first)
app.add_middleware(CORSPreflightMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files Mount for Image Uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# API Routes
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
app.include_router(predictions.router, prefix=f"{settings.API_PREFIX}/predictions", tags=["Predictions"])
app.include_router(alerts.router, prefix=f"{settings.API_PREFIX}/alerts", tags=["Alerts"])
app.include_router(reports.router, prefix=f"{settings.API_PREFIX}/reports", tags=["Citizen Reports"])
app.include_router(shelters.router, prefix=f"{settings.API_PREFIX}/shelters", tags=["Shelters"])
app.include_router(evacuation.router, prefix=f"{settings.API_PREFIX}/evacuation", tags=["Evacuation"])
app.include_router(impact.router, prefix=f"{settings.API_PREFIX}/impact", tags=["Impact Assessment"])
app.include_router(weather.router, prefix=f"{settings.API_PREFIX}/weather", tags=["Weather"])
app.include_router(chat.router, prefix=f"{settings.API_PREFIX}/chat", tags=["AI Chatbot"])


# WebSocket endpoint for real-time alerts
@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process incoming messages
            await websocket.send_json({"type": "ack", "message": "received"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Health check
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# Root
@app.get("/", tags=["System"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "api": settings.API_PREFIX,
    }
