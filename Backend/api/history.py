from fastapi import APIRouter
from core.firebase import db

router = APIRouter()

@router.get("/")
async def get_all_history():
    sessions = db.collection("sessions").stream()
    history = [{s.id: s.to_dict()} for s in sessions]
    return {"history": history}

@router.get("/session")
async def get_session_history(session_id: str):
    session_ref = db.collection("sessions").document(session_id).get()
    if session_ref.exists:
        return session_ref.to_dict()
    return {"error": "Session not found"}
