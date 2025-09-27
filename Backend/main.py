from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from api import session, history, statistics, speech
from core.middleware import AuthMiddleware

app = FastAPI(title="GenAI Therapy App", version="0.1.0")

# Register middleware
app.add_middleware(AuthMiddleware)

# Routers
app.include_router(session.router, prefix="/session", tags=["Session"])
app.include_router(history.router, prefix="/history", tags=["History"])
app.include_router(statistics.router, prefix="/statistics", tags=["Statistics"])
app.include_router(speech.router, prefix="/speech", tags=["Speech"])

# Mount static files
app.mount("/audio", StaticFiles(directory="audio_cache"), name="audio")
