"""
Therapy App Backend - FastAPI Application Entry Point

This is the main application file that initializes the FastAPI server and configures
all routes, middleware, and core application settings for the AI-powered therapy app.

The app provides endpoints for:
- Session management (creating, managing therapy conversations)
- History tracking (retrieving past sessions and conversations)
- Statistics and analytics (mood tracking, progress analytics)

Key Features:
- Firebase Authentication integration
- Google Gemini AI for conversation assistance
- Firestore for data persistence
- Docker deployment ready

Author: Therapy App Team
Version: 0.1.0
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import session, history, statistics
from core.middleware import AuthMiddleware

# Initialize FastAPI application with metadata
app = FastAPI(
    title="AI Therapy App Backend",
    version="0.1.0",
    description="Backend API for AI-powered therapy application with session management, mood tracking, and conversation assistance.",
    docs_url="/docs",  # Swagger UI endpoint
    redoc_url="/redoc",  # ReDoc endpoint
)

# Configure CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication middleware disabled for demo purposes
# All endpoints are now publicly accessible with a test user
# app.add_middleware(AuthMiddleware)  # Commented out for demo

# Include API routers with organized endpoints
# Session management: conversation creation, message handling, AI assistance
app.include_router(
    session.router, 
    prefix="/session", 
    tags=["Session Management"]
)

# History tracking: past sessions, conversation retrieval
app.include_router(
    history.router, 
    prefix="/history", 
    tags=["Session History"]
)

# Analytics and statistics: mood tracking, progress metrics
app.include_router(
    statistics.router, 
    prefix="/statistics", 
    tags=["Analytics & Statistics"]
)

# Health check endpoint for deployment monitoring
@app.get("/health", tags=["System"])
async def health_check():
    """
    Health check endpoint for monitoring service availability.
    Used by load balancers and monitoring systems.
    """
    return {
        "status": "healthy",
        "service": "therapy-app-backend",
        "version": "0.1.0"
    }

# Root endpoint with API information
@app.get("/", tags=["System"])
async def root():
    """
    Root endpoint providing basic API information.
    """
    return {
        "message": "AI Therapy App Backend API - Demo Mode",
        "version": "0.1.0",
        "mode": "demo",
        "authentication": "disabled",
        "test_user": "demo-user-12345",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "sessions": "/session/",
            "history": "/history/",
            "statistics": "/statistics/",
            "debug": "/session/debug/sessions"
        }
    }

# Demo info endpoint
@app.get("/demo-info", tags=["System"])
async def demo_info():
    """
    Information about demo mode and available test endpoints.
    """
    return {
        "demo_mode": True,
        "description": "This is a demo instance of the therapy app backend",
        "features": {
            "authentication": "Disabled - all requests use test user",
            "database": "Connected to Firebase/Firestore",
            "ai_integration": "Google Gemini AI enabled",
            "session_management": "Full session lifecycle supported",
            "analytics": "Mood and emotion analysis from text"
        },
        "test_user": {
            "uid": "demo-user-12345",
            "email": "demo@therapyapp.com",
            "name": "Demo User"
        },
        "quick_start": {
            "1_create_session": "POST /session/",
            "2_add_message": "POST /session/message",
            "3_get_ai_question": "POST /session/generate-question?session_id=<id>",
            "4_view_sessions": "GET /session/debug/sessions",
            "5_get_statistics": "GET /statistics/"
        },
        "documentation": "/docs"
    }
