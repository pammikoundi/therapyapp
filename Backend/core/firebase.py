"""
Firebase Integration Module

This module initializes and configures Firebase services for the therapy app:
- Firebase Admin SDK initialization
- Firestore database client for data persistence
- Firebase Auth client for user authentication

Firestore Collections Used:
- sessions: Active therapy conversation sessions
- session_summaries: Analyzed and summarized completed sessions
- user_summaries: Aggregated user analytics and overall summaries
- goals: User-defined therapy goals
- moods: Mood tracking entries

Usage:
    from core.firebase import db, auth_client
    
    # Database operations
    sessions = db.collection('sessions').stream()
    
    # Authentication
    user = auth_client.verify_id_token(token)
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth
from core.config import settings
import logging
import os

# Configure logging for Firebase operations
logger = logging.getLogger(__name__)

# Initialize Firebase services with error handling for different environments
try:
    # Check if we're in a testing environment or if credentials exist
    if settings.is_development() and not os.path.exists(settings.google_application_credentials):
        # Development mode without credentials - create mock services
        logger.warning("Development mode: Firebase credentials not found, using mock services")
        
        # Create a mock Firebase app for development
        try:
            # Try to initialize with default credentials (for local dev)
            firebase_admin.initialize_app()
            logger.info("Firebase Admin SDK initialized with default credentials")
        except Exception:
            # If that fails, create a minimal mock setup
            logger.warning("Could not initialize Firebase - some features will be limited in development")
            
    else:
        # Production/staging mode - require proper credentials
        cred = credentials.Certificate(settings.google_application_credentials)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully with service account")
        
except Exception as e:
    logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
    if not settings.is_development():
        # In production, this is a critical error
        raise
    else:
        # In development, log the error but continue
        logger.warning("Continuing in development mode without Firebase services")

try:
    # Initialize Firestore client for database operations
    db = firestore.client()
    logger.info("Firestore client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Firestore client: {e}")
    if settings.is_development():
        # Create a mock db object for development
        db = None
        logger.warning("Using mock database in development mode")
    else:
        raise

try:
    # Initialize Firebase Auth client for user authentication
    auth_client = auth
    logger.info("Firebase Auth client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Firebase Auth client: {e}")
    if settings.is_development():
        auth_client = None
        logger.warning("Using mock auth in development mode")
    else:
        raise

logger.info("Firebase services configuration completed")
