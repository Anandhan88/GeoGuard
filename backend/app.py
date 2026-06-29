import sys
import os

# Ensure the backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from routes.satellite import satellite_router, disaster_router
from services.satellite import satellite_manager

# Register Copernicus Satellite & Disaster Assessment Routers under multiple prefixes
app.include_router(satellite_router, prefix="/api/satellite")
app.include_router(satellite_router, prefix="/api/v1/satellite")
app.include_router(disaster_router, prefix="/api/disaster")
app.include_router(disaster_router, prefix="/api/v1/disaster")

# The satellite agent is launched inside the app lifespan in app/main.py

if __name__ == "__main__":
    import uvicorn
    # Pass the app object directly to avoid module naming collision with the app/ directory
    uvicorn.run(app, host="127.0.0.1", port=8000)
