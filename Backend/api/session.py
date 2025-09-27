"""
Session Management API Module

This module handles all therapy session-related operations including:
- Session creation and lifecycle management
- Message handling and conversation tracking
- AI-powered follow-up question generation
- Session closure with analytics and summarization
- User progress tracking and mood analysis

Key Features:
- Real-time message storage in Firestore
- Google Gemini AI integration for conversation assistance
- Automatic session summarization for long conversations
- Mood and emotion analysis from conversation content
- Aggregated user analytics across all sessions

Endpoints:
- POST /session/ - Create new therapy session
- POST /session/message - Add message to existing session
- POST /session/generate-question - Get AI follow-up question
- POST /session/close - Close session with analysis
"""

import statistics
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from models.schemas import Message
from core.firebase import db
from core.genkit_gemini import generate_followup_question, summarize_text_flow
from google.cloud.firestore_v1 import ArrayUnion
from core.auth import get_current_user
from datetime import datetime
import logging

# Configure logging for session operations
logger = logging.getLogger(__name__)

# Initialize FastAPI router for session endpoints
router = APIRouter()

def analyze_messages(messages: List[dict]) -> Dict[str, Any]:
    """
    Analyze therapy session messages for mood, emotions, and intensity patterns.
    
    This function processes conversation messages to extract psychological insights
    from the actual text content using keyword analysis and sentiment indicators.
    
    Args:
        messages (List[dict]): List of message objects from the session
        
    Returns:
        Dict[str, Any]: Analytics containing:
            - mood_counts: Frequency of different moods detected
            - avg_intensity: Average emotional intensity (0-10 scale)
            - emotion_counts: Frequency of different emotions detected
            - message_analysis: Breakdown of analysis
    """
    logger.info(f"Analyzing {len(messages)} messages for psychological insights")
    
    # Define mood and emotion keywords for basic sentiment analysis
    mood_keywords = {
        "happy": ["happy", "joy", "excited", "great", "wonderful", "amazing", "love", "fantastic", "thrilled"],
        "sad": ["sad", "depressed", "down", "unhappy", "miserable", "tearful", "crying", "grieving"],
        "anxious": ["anxious", "worried", "nervous", "stress", "panic", "fear", "scared", "overwhelmed"],
        "angry": ["angry", "mad", "furious", "irritated", "frustrated", "rage", "annoyed"],
        "neutral": ["okay", "fine", "normal", "regular", "usual"],
        "confused": ["confused", "lost", "uncertain", "unclear", "puzzled", "bewildered"]
    }
    
    emotion_keywords = {
        "joy": ["joy", "happiness", "delight", "pleasure", "bliss", "elation"],
        "sadness": ["sadness", "sorrow", "grief", "melancholy", "despair"],
        "fear": ["fear", "terror", "dread", "phobia", "fright", "alarm"],
        "anger": ["anger", "fury", "wrath", "resentment", "hostility"],
        "surprise": ["surprise", "shock", "amazement", "astonishment"],
        "disgust": ["disgust", "revulsion", "loathing", "repulsion"]
    }
    
    mood_counts = {}
    emotion_counts = {}
    intensities = []
    user_messages = [m for m in messages if m.get("role") == "user"]
    
    logger.info(f"Analyzing {len(user_messages)} user messages out of {len(messages)} total messages")
    
    for message in user_messages:
        text = message.get("text", "").lower()
        
        if not text.strip():
            continue
            
        # Calculate basic intensity based on text characteristics
        intensity = 5  # Base intensity
        
        # Adjust intensity based on text features
        if "!" in text:
            intensity += 1
        if "?" in text:
            intensity += 0.5
        if any(word in text for word in ["very", "extremely", "really", "so", "too"]):
            intensity += 1
        if len(text) > 100:  # Longer messages might indicate more emotional content
            intensity += 0.5
        
        # Cap intensity at 10
        intensity = min(10, intensity)
        intensities.append(intensity)
        
        # Analyze mood keywords
        for mood, keywords in mood_keywords.items():
            if any(keyword in text for keyword in keywords):
                mood_counts[mood] = mood_counts.get(mood, 0) + 1
        
        # Analyze emotion keywords
        for emotion, keywords in emotion_keywords.items():
            if any(keyword in text for keyword in keywords):
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
    
    # Calculate average intensity
    avg_intensity = statistics.mean(intensities) if intensities else 5.0
    
    # If no moods detected, assign neutral
    if not mood_counts and user_messages:
        mood_counts["neutral"] = len(user_messages)
    
    analytics = {
        "mood_counts": mood_counts,
        "avg_intensity": round(avg_intensity, 2),
        "emotion_counts": emotion_counts,
        "message_analysis": {
            "total_messages": len(messages),
            "user_messages": len(user_messages),
            "analyzed_messages": len([m for m in user_messages if m.get("text", "").strip()]),
            "avg_message_length": round(sum(len(m.get("text", "")) for m in user_messages) / len(user_messages), 2) if user_messages else 0
        }
    }
    
    logger.info(f"Session analysis complete: {len(mood_counts)} moods detected, {len(emotion_counts)} emotions, avg intensity {avg_intensity:.2f}")
    return analytics

async def summarize_text(messages: List[dict]):
    # Use Gemini to summarize the session
    context = "\n".join([m["text"] for m in messages if "text" in m])
    return await summarize_text_flow(context)

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
    summary = await summarize_text(messages)
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
    overall_summary = await summarize_text([{"text": overall_text}]) if overall_text else ""
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
    question = await generate_followup_question(history)
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


@router.get("/debug/sessions")
async def debug_get_all_sessions(user=Depends(get_current_user)):
    """
    Debug endpoint to list all sessions for the current user.
    Helps with troubleshooting session creation and retrieval.
    """
    try:
        if db is None:
            return {
                "sessions": [
                    {"session_id": "mock-session-1", "created_at": "2024-01-01", "messages": []},
                    {"session_id": "mock-session-2", "created_at": "2024-01-02", "messages": []}
                ],
                "status": "development_mode"
            }
        
        sessions_query = db.collection("sessions").where("user_id", "==", user["uid"])
        sessions = list(sessions_query.stream())
        
        session_list = []
        for session_doc in sessions:
            session_data = session_doc.to_dict()
            session_list.append({
                "session_id": session_doc.id,
                "created_at": str(session_data.get("created_at")),
                "message_count": len(session_data.get("messages", [])),
                "messages": session_data.get("messages", [])[:3]  # Show first 3 messages
            })
        
        return {
            "sessions": session_list,
            "total_sessions": len(session_list),
            "user_id": user["uid"],
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error in debug endpoint: {e}")
        return {"error": str(e), "status": "error"}


@router.post("/debug/create-test-session")
async def debug_create_test_session(user=Depends(get_current_user)):
    """
    Debug endpoint to create a test session with sample messages.
    Helps test the complete session workflow including analysis.
    """
    try:
        if db is None:
            return {
                "session_id": "mock-test-session",
                "messages_added": 3,
                "status": "development_mode"
            }
        
        # Create session
        session_ref = db.collection("sessions").document()
        session_ref.set({
            "created_at": datetime.now(),
            "user_id": user["uid"],
            "messages": []
        })
        
        # Add test messages
        test_messages = [
            {"text": "I've been feeling really anxious about work lately.", "time": datetime.now(), "role": "user", "user_id": user["uid"]},
            {"text": "That sounds stressful. Can you tell me more about what specifically is causing this anxiety?", "time": datetime.now(), "role": "generated"},
            {"text": "I keep worrying that I'm not doing well enough and my boss will be disappointed.", "time": datetime.now(), "role": "user", "user_id": user["uid"]},
            {"text": "It's understandable to want to do well at work. These feelings of worry are valid.", "time": datetime.now(), "role": "generated"},
            {"text": "Sometimes I feel overwhelmed and can't sleep because I'm thinking about work.", "time": datetime.now(), "role": "user", "user_id": user["uid"]}
        ]
        
        for msg in test_messages:
            session_ref.update({
                "messages": ArrayUnion([msg])
            })
        
        return {
            "session_id": session_ref.id,
            "messages_added": len(test_messages),
            "test_messages": test_messages,
            "status": "success",
            "next_step": f"Try closing this session: POST /session/close?session_id={session_ref.id}"
        }
        
    except Exception as e:
        logger.error(f"Error creating test session: {e}")
        return {"error": str(e), "status": "error"}
