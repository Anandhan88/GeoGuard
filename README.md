# GeoGuard AI

GeoGuard AI is an intelligent disaster response, situational awareness, and safe evacuation routing platform. The system leverages AI-driven threat classification, real-time alert systems, dynamic routing avoiding danger zones, and weather monitoring.

## System Architecture

The project consists of three main components:
- **Backend (`/backend`)**: A FastAPI application interacting with a PostGIS database and Redis for caching/real-time message passing.
- **Frontend (`/frontend`)**: A React + TypeScript application built using Vite, featuring interactive Leaflet maps and real-time dashboard capabilities.
- **Machine Learning (`/ml`)**: Machine learning models and utilities for image classification and risk assessment.

## Getting Started

### Prerequisites

Make sure you have the following installed:
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### Running the Application

You can start the entire stack using Docker Compose:

```bash
docker-compose up --build
```

This will launch:
- **Database**: PostgreSQL with PostGIS extension on port `5432`
- **Cache**: Redis on port `6379`
- **Backend API**: FastAPI on `http://localhost:8000`
- **Frontend**: Vite + React dev server on `http://localhost:5173`

## Key Features

1. **AI Chatbot**: Generative AI assistance for emergency queries and instructions.
2. **Computer Vision Classifier**: Automated damage and threat level assessment from uploaded images.
3. **Safe Evacuation Routing**: Dynamic pathfinding using OpenStreetMap data (A* algorithm) that automatically avoids hazard and risk zones.
4. **Live Weather & Forecasts**: Real-time integration with the Open-Meteo API.
5. **Real-time Push Notifications**: Instant broadcast of critical alerts to authorities and users.
