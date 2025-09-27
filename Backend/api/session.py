
import statistics
import requests
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from models.schemas import Message, MessageRole
from core.firebase import db
from core.genkit_gemini import generate_followup_question
from google.cloud.firestore_v1 import ArrayUnion
from core.auth import get_current_user
from datetime import datetime

router = APIRouter()

def analyze_messages(messages: List[dict]):
    # Placeholder: extract mood, intensity, emotions from messages
    moods = [m.get("mood") for m in messages if m.get("mood")]
    intensities = [m.get("intensity", 0) for m in messages if "intensity" in m]
    emotions = [m.get("emotion") for m in messages if m.get("emotion")]
    avg_intensity = statistics.mean(intensities) if intensities else 0
    mood_counts = {}
    for mood in moods:
        mood_counts[mood] = mood_counts.get(mood, 0) + 1
    emotion_counts = {}
    for emotion in emotions:
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
    return {
        "mood_counts": mood_counts,
        "avg_intensity": avg_intensity,
        "emotion_counts": emotion_counts
    }

def summarize_text(messages: List[dict]):
    # Use Gemini or another LLM to summarize the session
    context = "\n".join([m["text"] for m in messages if "text" in m])
    prompt = f"Summarize the following therapy session:\n{context}\nSummary:"
    return generate_followup_question([{"text": prompt}])

# --- Close session endpoint ---
@router.post("/close")
async def close_session(session_id: str, user=Depends(get_current_user)):
    session_ref = db.collection("sessions").document(session_id)
    session = session_ref.get()
    if not session.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    session_data = session.to_dict()
    if not session_data:
        raise HTTPException(status_code=404, detail="Session data not found")
    messages = session_data.get("messages", [])
    # Only summarize if session is long enough (e.g., 5+ messages)
    if len(messages) < 5:
        return {"status": "not summarized", "reason": "Session too short"}
    summary = summarize_text(messages)
    analytics = analyze_messages(messages)
    # Store summary and analytics in a separate collection
    db.collection("session_summaries").document(session_id).set({
        "session_id": session_id,
        "user_id": user["uid"],
        "summary": summary,
        "analytics": analytics,
        "created_at": session_data.get("created_at") if session_data else None
    })
    # Update overall summary for the user
    # Fetch all summaries for this user
    summaries = db.collection("session_summaries").where("user_id", "==", user["uid"]).stream()
    all_summaries = [s.to_dict() for s in summaries]
    overall_text = "\n".join([s.get("summary", "") for s in all_summaries if s.get("summary")])
    overall_summary = summarize_text([{"text": overall_text}]) if overall_text else ""
    # Average analytics
    all_intensities = [s["analytics"]["avg_intensity"] for s in all_summaries if s.get("analytics") and "avg_intensity" in s["analytics"]]
    avg_intensity = statistics.mean(all_intensities) if all_intensities else 0
    # Aggregate moods and emotions
    mood_totals = {}
    emotion_totals = {}
    for s in all_summaries:
        for mood, count in s.get("analytics", {}).get("mood_counts", {}).items():
            mood_totals[mood] = mood_totals.get(mood, 0) + count
        for emotion, count in s.get("analytics", {}).get("emotion_counts", {}).items():
            emotion_totals[emotion] = emotion_totals.get(emotion, 0) + count
    db.collection("user_summaries").document(user["uid"]).set({
        "user_id": user["uid"],
        "overall_summary": overall_summary,
        "avg_intensity": avg_intensity,
        "mood_totals": mood_totals,
        "emotion_totals": emotion_totals
    })
    return {"status": "summarized", "summary": summary, "analytics": analytics, "overall_summary": overall_summary}

from fastapi import APIRouter, Depends, HTTPException
from models.schemas import Message, MessageRole
from core.firebase import db
from core.genkit_gemini import generate_followup_question
from google.cloud.firestore_v1 import ArrayUnion
from core.auth import get_current_user
from datetime import datetime

router = APIRouter()

# Generate a follow-up question using Gemini and session history
@router.post("/generate-question")
async def generate_question(session_id: str, user=Depends(get_current_user)):
    session_ref = db.collection("sessions").document(session_id)
    session = session_ref.get()
    if not session.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    session_data = session.to_dict()
    if not session_data:
        raise HTTPException(status_code=404, detail="Session data not found")
    history = session_data.get("messages", [])
    question = generate_followup_question(history)
    return {"question": question}

@router.post("/")
async def start_session(user=Depends(get_current_user)):
    session_ref = db.collection("sessions").document()
    session_ref.set({
        "created_at": datetime.now(),
        "user_id": user["uid"],
        "messages": []
    })
    return {"session_id": session_ref.id, "status": "started", "user": user}


# Redefined endpoint to add a message (user or generated)

@router.post("/message")
async def add_message(message: Message, user=Depends(get_current_user)):
    session_ref = db.collection("sessions").document(message.session_id)
    session = session_ref.get()

    if not session.exists:
        return {"error": "Session not found"}

    # Check if session is summarized (exists in session_summaries)
    summary_ref = db.collection("session_summaries").document(message.session_id)
    summary_doc = summary_ref.get()
    if summary_doc.exists:
        # Remove the summary to "reopen" the session
        summary_ref.delete()

    # Determine the role: 'user' or 'generated'
    role = message.role if hasattr(message, 'role') else 'user'
    msg_data = {
        "text": message.text,
        "time": datetime.now(),
        "role": role
    }
    if role == "user":
        msg_data["user_id"] = user["uid"]

    session_ref.update({
        "messages": ArrayUnion([msg_data])
    })
    return {"status": "saved", "message": message.text, "role": role, "user": user, "reopened": summary_doc.exists}
