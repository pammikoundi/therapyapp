import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    environment: str = os.getenv("ENVIRONMENT", "dev")  # dev | prod
    firebase_storage_bucket: str = os.getenv("FIREBASE_STORAGE_BUCKET", "your-bucket.appspot.com")
    google_credentials: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")

settings = Settings()
