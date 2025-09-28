from fastapi import APIRouter, Depends
from core.firebase import db
from core.auth import get_current_user
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
async def get_all_history(user=Depends(get_current_user)):
    """
    Get all session history for the current user, including message counts.
    
    Returns:
        List of sessions with session_id, created_at, status, and message_count
    """
    try:
        if db is None:
            logger.warning("Database not available - returning mock history")
            return {
                "history": [
                    {
                        "session_id": "mock-session-1",
                        "created_at": "2024-01-01",
                        "status": "summarized",
                        "message_count": 12,
                        "user_message_count": 6
                    },
                    {
                        "session_id": "mock-session-2", 
                        "created_at": "2024-01-02",
                        "status": "open",
                        "message_count": 8,
                        "user_message_count": 4
                    }
                ],
                "status": "development_mode"
            }
        
        # Get all sessions for the user
        sessions_query = db.collection("sessions").where("user_id", "==", user["uid"])
        sessions = list(sessions_query.stream())
        
        history = []
        for session_doc in sessions:
            session_id = session_doc.id
            session_data = session_doc.to_dict()
            
            if not session_data:
                continue
                
            messages = session_data.get("messages", [])
            total_message_count = len(messages)
            user_message_count = len([m for m in messages if m.get("role") == "user"])
            
            # Check if session is summarized
            summary_doc = db.collection("session_summaries").document(session_id).get()
            status = "summarized" if summary_doc.exists else "open"
            
            history.append({
                "session_id": session_id,
                "created_at": str(session_data.get("created_at", "")),
                "status": status,
                "message_count": total_message_count,
                "user_message_count": user_message_count
            })
        
        # Sort by creation date (newest first)
        history.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        logger.info(f"Retrieved history for user {user.get('uid')}: {len(history)} sessions")
        return {
            "history": history,
            "total_sessions": len(history),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error retrieving history: {e}")
        return {"error": str(e), "status": "error"}

@router.get("/session")
async def get_session_history(session_id: str, user=Depends(get_current_user)):
    """
    Get detailed history for a specific session, including message counts and breakdown.
    
    Returns:
        Session details with full message history, counts, and analysis
    """
    try:
        if db is None:
            logger.warning("Database not available - returning mock session history")
            return {
                "session_id": session_id,
                "created_at": "2024-01-01",
                "message_count": 6,
                "user_message_count": 3,
                "ai_message_count": 3,
                "status": "open",
                "history": [
                    {"text": "Mock user message", "role": "user", "time": "2024-01-01"},
                    {"text": "Mock AI response", "role": "generated", "time": "2024-01-01"}
                ],
                "status": "development_mode"
            }
        
        session_ref = db.collection("sessions").document(session_id).get()
        if not session_ref.exists:
            return {"error": "Session not found"}
        
        session_data = session_ref.to_dict()
        if not session_data:
            return {"error": "Session data not found"}
        
        # Verify user owns this session
        if session_data.get("user_id") != user["uid"]:
            return {"error": "Access denied to this session"}
        
        messages = session_data.get("messages", [])
        total_message_count = len(messages)
        user_message_count = len([m for m in messages if m.get("role") == "user"])
        ai_message_count = len([m for m in messages if m.get("role") == "generated"])
        
        # Check if session is summarized
        summary_doc = db.collection("session_summaries").document(session_id).get()
        status = "summarized" if summary_doc.exists else "open"
        
        # Get summary info if available
        summary_info = None
        if summary_doc.exists:
            summary_data = summary_doc.to_dict()
            if summary_data:
                summary_info = {
                    "summary": summary_data.get("summary", ""),
                    "emotion_analysis": summary_data.get("analytics", {}),
                    "goal_tracking": summary_data.get("goal_tracking", {})
                }
        
        result = {
            "session_id": session_id,
            "created_at": str(session_data.get("created_at", "")),
            "status": status,
            "message_count": total_message_count,
            "user_message_count": user_message_count,
            "ai_message_count": ai_message_count,
            "history": messages
        }
        
        # Add summary info if available
        if summary_info:
            result["summary_info"] = summary_info
        
        logger.info(f"Retrieved session {session_id} history: {total_message_count} total messages ({user_message_count} user, {ai_message_count} AI)")
        return result
        
    except Exception as e:
        logger.error(f"Error retrieving session history: {e}")
        return {"error": str(e)}
