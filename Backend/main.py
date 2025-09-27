from fastapi import FastAPI
from app.api import session, history, statistics, speech
from app.core.middleware import AuthMiddleware

app = FastAPI(title="Talking Buddy")

# Register middleware
app.add_middleware(AuthMiddleware)

# Routers
app.include_router(session.router, prefix="/session", tags=["Session"])
app.include_router(history.router, prefix="/history", tags=["History"])
app.include_router(statistics.router, prefix="/statistics", tags=["Statistics"])
app.include_router(speech.router, prefix="/speech", tags=["Speech"])
