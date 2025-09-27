from fastapi import FastAPI
from api import session, history, statistics
from core.middleware import AuthMiddleware

app = FastAPI(title="GenAI Therapy App", version="0.1.0")

# Register middleware
app.add_middleware(AuthMiddleware)

# Routers
app.include_router(session.router, prefix="/session", tags=["Session"])
app.include_router(history.router, prefix="/history", tags=["History"])
app.include_router(statistics.router, prefix="/statistics", tags=["Statistics"])
