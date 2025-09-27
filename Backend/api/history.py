from fastapi import APIRouter
from core.firebase import db

router = APIRouter()



@router.get("/")
async def get_all_history():
    sessions = db.collection("sessions").stream()
    history = []
    for s in sessions:
        session_id = s.id
        created_at = s.to_dict().get("created_at")
        # Check if session is summarized
        summary_doc = db.collection("session_summaries").document(session_id).get()
        status = "summarized" if summary_doc.exists else "open"
        history.append({
            "session_id": session_id,
            "created_at": created_at,
            "status": status
        })
    return {"history": history}



@router.get("/session")
async def get_session_history(session_id: str):
    session_ref = db.collection("sessions").document(session_id).get()
    if session_ref.exists:
        data = session_ref.to_dict()
        if data:
            return {
                "session_id": session_id,
                "created_at": data.get("created_at"),
                "history": data.get("messages", [])
            }
        else:
            return {"session_id": session_id, "created_at": None, "history": []}
    return {"error": "Session not found"}
