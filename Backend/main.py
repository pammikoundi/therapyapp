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

# Register authentication middleware
# This handles Firebase token validation for all protected endpoints
app.add_middleware(AuthMiddleware)

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
        "message": "AI Therapy App Backend API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }
