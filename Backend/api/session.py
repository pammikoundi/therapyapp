from fastapi import APIRouter, Depends
from models.schemas import Message
from core.firebase import db, firestore
from core.auth import get_current_user
from datetime import datetime

router = APIRouter()

@router.post("/")
async def start_session(user=Depends(get_current_user)):
    session_ref = db.collection("sessions").document()
    session_ref.set({
        "created_at": datetime.now(),
        "user_id": user["uid"],
        "messages": []
    })
    return {"session_id": session_ref.id, "status": "started", "user": user}

@router.post("/add-user-message")
async def add_user_message(message: Message, user=Depends(get_current_user)):
    session_ref = db.collection("sessions").document(message.session_id)
    session = session_ref.get()

    if not session.exists:
        return {"error": "Session not found"}

    session_ref.update({
        "messages": firestore.ArrayUnion([{
            "text": message.text,
            "time": datetime.now(),
            "user_id": user["uid"]
        }])
    })
    return {"status": "saved", "message": message.text, "user": user}
