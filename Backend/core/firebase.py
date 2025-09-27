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
    # Check if we should use Cloud Run's default service account
    use_service_account = os.getenv('USE_SERVICE_ACCOUNT', 'false').lower() == 'true'
    
    if use_service_account:
        # Cloud Run production mode - use default service account
        logger.info("Using Cloud Run service account for Firebase authentication")
        firebase_admin.initialize_app()
        logger.info("Firebase Admin SDK initialized with Cloud Run service account")
        
    elif settings.is_development():
        # Development mode - check for credentials file or use default
        if hasattr(settings, 'google_application_credentials') and os.path.exists(settings.google_application_credentials):
            # Use local service account file
            cred = credentials.Certificate(settings.google_application_credentials)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized with local service account file")
        else:
            # Try default credentials or create mock setup
            try:
                firebase_admin.initialize_app()
                logger.info("Firebase Admin SDK initialized with default credentials")
            except Exception as dev_e:
                logger.warning(f"Could not initialize Firebase with default credentials: {dev_e}")
                logger.warning("Running in mock mode - some features will be limited")
                
    else:
        # Fallback to credential file for other environments
        if hasattr(settings, 'google_application_credentials'):
            cred = credentials.Certificate(settings.google_application_credentials)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized with credential file")
        else:
            raise ValueError("No Firebase credentials configuration found")
        
except Exception as e:
    logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
    if settings.environment.lower() in ["dev", "development", "demo"]:
        # In development/demo, log the error but continue
        logger.warning(f"Continuing in {settings.environment} mode without Firebase services")
        logger.info("API will use mock data for demonstration purposes")
    else:
        # In production, this is a critical error
        raise

try:
    # Initialize Firestore client for database operations
    db = firestore.client()
    logger.info("Firestore client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Firestore client: {e}")
    if settings.is_development() or settings.environment.lower() == "demo":
        # Create a mock db object for development/demo
        db = None
        logger.warning(f"Using mock database in {settings.environment} mode - Firestore not available")
    else:
        raise

try:
    # Initialize Firebase Auth client for user authentication
    auth_client = auth
    logger.info("Firebase Auth client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Firebase Auth client: {e}")
    if settings.is_development() or settings.environment.lower() == "demo":
        auth_client = None
        logger.warning(f"Using mock auth in {settings.environment} mode - Firebase Auth not available")
    else:
        raise

logger.info("Firebase services configuration completed")
