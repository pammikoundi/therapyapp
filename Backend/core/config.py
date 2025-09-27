"""
Configuration Management Module

This module handles all application configuration using Pydantic Settings.
It loads environment variables from .env file and provides type-safe configuration
access throughout the application.

Environment Variables Required:
- ENVIRONMENT: Application environment (dev/staging/production)
- GOOGLE_APPLICATION_CREDENTIALS: Path to Firebase service account key
- SSL_CERT_FILE: Path to SSL certificate (for HTTPS)
- GEMINI_API_KEY: Google Gemini AI API key

Usage:
    from core.config import settings
    api_key = settings.gemini_api_key
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """
    Application settings class using Pydantic for type validation and environment management.
    
    All settings are loaded from environment variables or .env file.
    Provides default values where appropriate and validates required settings.
    """
    
    # Application environment configuration
    environment: str = "dev"  # Options: dev, staging, production
    
    # Firebase/Google Cloud configuration
    google_application_credentials: Optional[str] = None  # Path to service account JSON file
    
    # SSL configuration for HTTPS (optional in development)
    ssl_cert_file: Optional[str] = None  # Path to SSL certificate file
    
    # AI service configuration
    gemini_api_key: str  # Google Gemini AI API key for conversation assistance
    
    # Database configuration (inherited from Firebase)
    # Firestore is configured through the service account credentials
    
    class Config:
        """
        Pydantic configuration for settings loading.
        """
        env_file = ".env"  # Load from .env file in project root
        env_file_encoding = "utf-8"
        case_sensitive = False  # Allow case-insensitive environment variable names
        
    def is_development(self) -> bool:
        """Check if application is running in development mode."""
        return self.environment.lower() in ["dev", "development", "demo"]
        
    def is_production(self) -> bool:
        """Check if application is running in production mode."""
        return self.environment.lower() == "production"
        
    def is_demo(self) -> bool:
        """Check if application is running in demo mode."""
        return self.environment.lower() == "demo"


# Global settings instance
# Import this instance throughout the application for consistent configuration access
settings = Settings()
