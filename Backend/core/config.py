from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    environment: str = "dev"
    google_application_credentials: str
    ssl_cert_file: str
    gemini_api_key: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
