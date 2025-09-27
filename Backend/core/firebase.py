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

# Configure logging for Firebase operations
logger = logging.getLogger(__name__)

try:
    # Initialize Firebase Admin SDK with service account credentials
    # The credentials file path is loaded from environment configuration
    cred = credentials.Certificate(settings.google_application_credentials)
    firebase_admin.initialize_app(cred)
    
    logger.info("Firebase Admin SDK initialized successfully")
    
except Exception as e:
    logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
    raise

# Initialize Firestore client for database operations
# This provides access to all Firestore collections and documents
db = firestore.client()

# Initialize Firebase Auth client for user authentication
# Used for verifying ID tokens from the frontend application
auth_client = auth

logger.info("Firebase services configured successfully")
