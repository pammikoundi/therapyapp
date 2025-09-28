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
from core.genkit_gemini import generate_followup_question, summarize_text_flow, analyze_goals_from_session, generate_contextual_followup_question
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
    Analyze conversation messages for emotional patterns and intensity.
    
    This function processes conversation messages to understand the emotional landscape
    from the actual text content using comprehensive keyword analysis.
    
    Args:
        messages (List[dict]): List of message objects from the session
        
    Returns:
        Dict[str, Any]: Analytics containing:
            - emotion_percentages: All emotions as percentages that sum to 1.0
            - avg_intensity: Average emotional intensity (0-10 scale)
            - message_analysis: Breakdown of analysis
    """
    logger.info(f"Analyzing {len(messages)} messages for emotional insights")
    
    # Define comprehensive emotion keywords - all emotions you requested
    emotion_keywords = {
        "anxiety": ["anxious", "worried", "nervous", "stress", "panic", "fear", "scared", "overwhelmed", "tense", "uneasy"],
        "happy": ["happy", "joy", "joyful", "excited", "great", "wonderful", "amazing", "fantastic", "thrilled", "cheerful", "delighted"],
        "sad": ["sad", "depressed", "down", "unhappy", "miserable", "tearful", "crying", "grieving", "heartbroken", "melancholy"],
        "disgust": ["disgusted", "grossed out", "revolted", "sickened", "repulsed", "appalled", "nauseated"],
        "fear": ["afraid", "terrified", "frightened", "scared", "fearful", "petrified", "alarmed", "spooked"],
        "anger": ["angry", "mad", "furious", "irritated", "frustrated", "rage", "annoyed", "livid", "pissed", "heated"],
        "envy": ["envious", "jealous", "resentful", "covet", "bitter", "green with envy", "wish I had"],
        "embarrassment": ["embarrassed", "ashamed", "humiliated", "mortified", "awkward", "self-conscious", "uncomfortable"],
        "content": ["content", "satisfied", "peaceful", "calm", "serene", "comfortable", "at ease", "relaxed"],
        "relief": ["relieved", "grateful", "thankful", "better", "freed", "unburdened", "lifted weight"]
    }
    
    # Initialize all emotions with 0 count to ensure they all appear in results
    emotion_counts = {
        "anxiety": 0, "happy": 0, "sad": 0, "disgust": 0, "fear": 0,
        "anger": 0, "envy": 0, "embarrassment": 0, "content": 0, "relief": 0
    }
    
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
        
        # Analyze emotion keywords - each message can contribute to multiple emotions
        for emotion, keywords in emotion_keywords.items():
            if any(keyword in text for keyword in keywords):
                emotion_counts[emotion] += 1
    
    # Calculate average intensity
    avg_intensity = statistics.mean(intensities) if intensities else 5.0
    
    # Convert counts to percentages that sum to 1.0
    total_emotions = sum(emotion_counts.values())
    
    if total_emotions == 0:
        # If no emotions detected, distribute evenly with slight bias toward content
        emotion_percentages = {
            "anxiety": 0.05, "happy": 0.10, "sad": 0.05, "disgust": 0.05, "fear": 0.05,
            "anger": 0.05, "envy": 0.05, "embarrassment": 0.05, "content": 0.50, "relief": 0.05
        }
    else:
        # Calculate percentages based on detected emotions
        emotion_percentages = {
            emotion: round(count / total_emotions, 3) for emotion, count in emotion_counts.items()
        }
        
        # Ensure they sum to exactly 1.0 by adjusting the largest percentage if needed
        current_sum = sum(emotion_percentages.values())
        if current_sum != 1.0:
            # Find the emotion with the highest percentage and adjust
            max_emotion = max(emotion_percentages.keys(), key=lambda k: emotion_percentages[k])
            emotion_percentages[max_emotion] += round(1.0 - current_sum, 3)
    
    analytics = {
        "emotion_percentages": emotion_percentages,
        "emotion_counts": emotion_counts,  # Keep raw counts for debugging
        "avg_intensity": round(avg_intensity, 2),
        "message_analysis": {
            "total_messages": len(messages),
            "user_messages": len(user_messages),
            "analyzed_messages": len([m for m in user_messages if m.get("text", "").strip()]),
            "avg_message_length": round(sum(len(m.get("text", "")) for m in user_messages) / len(user_messages), 2) if user_messages else 0
        }
    }
    
    # Verify percentages sum to 1.0
    percentage_sum = sum(emotion_percentages.values())
    logger.info(f"Session analysis complete: {len([k for k, v in emotion_counts.items() if v > 0])} emotions detected, avg intensity {avg_intensity:.2f}, percentages sum: {percentage_sum}")
    return analytics

async def track_goals_from_session(session_id: str, messages: List[dict], user_id: str):
    """
    Automatically track and update goals based on session content using AI analysis.
    
    This function:
    1. Uses AI to identify goals mentioned in the session
    2. Checks against existing goals in the database
    3. Creates new goals or updates existing ones
    4. Tracks goal progress through the lifecycle: imagined → started → done → abandoned
    """
    logger.info(f"Analyzing session {session_id} for goal tracking")
    
    try:
        # Use AI to analyze the session for goals
        goal_analysis = await analyze_goals_from_session(messages)
        detected_goals = goal_analysis.get("goals", [])
        
        if not detected_goals:
            logger.info(f"No goals detected in session {session_id}")
            return {"goals_processed": 0, "new_goals": 0, "updated_goals": 0}
        
        logger.info(f"Detected {len(detected_goals)} goals in session {session_id}")
        
        # Get existing goals for the user
        existing_goals_query = db.collection("goals").where("user_id", "==", user_id)
        existing_goals_docs = list(existing_goals_query.stream())
        existing_goals = {doc.id: doc.to_dict() for doc in existing_goals_docs}
        
        new_goals_count = 0
        updated_goals_count = 0
        
        for detected_goal in detected_goals:
            goal_text = detected_goal.get("goal", "").lower().strip()
            if not goal_text or detected_goal.get("confidence", 0) < 0.6:
                continue  # Skip low-confidence goals
            
            # Check if this goal already exists (fuzzy matching)
            existing_goal_id = None
            for goal_id, goal_data in existing_goals.items():
                existing_text = goal_data.get("goal", "").lower().strip()
                # Simple similarity check - could be enhanced with more sophisticated matching
                if goal_text in existing_text or existing_text in goal_text or \
                   len(set(goal_text.split()) & set(existing_text.split())) >= 2:
                    existing_goal_id = goal_id
                    break
            
            current_time = datetime.now().isoformat()
            
            if existing_goal_id:
                # Update existing goal
                existing_goal = existing_goals[existing_goal_id]
                goal_ref = db.collection("goals").document(existing_goal_id)
                
                # Update status if it has progressed
                current_status = existing_goal.get("status", "imagined")
                new_status = detected_goal.get("status", "imagined")
                
                # Only allow forward progression or to abandoned
                status_order = {"imagined": 0, "started": 1, "done": 2}
                should_update_status = (new_status == "abandoned" or 
                                      status_order.get(new_status, 0) > status_order.get(current_status, 0))
                
                update_data = {
                    "last_mentioned": current_time,
                    "session_mentions": existing_goal.get("session_mentions", []) + [session_id]
                }
                
                if should_update_status:
                    update_data["status"] = new_status
                    logger.info(f"Updated goal status from {current_status} to {new_status}: {goal_text}")
                
                goal_ref.update(update_data)
                updated_goals_count += 1
                
            else:
                # Create new goal
                goal_ref = db.collection("goals").document()
                goal_data = {
                    "user_id": user_id,
                    "goal": detected_goal.get("goal", ""),
                    "status": detected_goal.get("status", "imagined"),
                    "created_at": current_time,
                    "last_mentioned": current_time,
                    "session_mentions": [session_id],
                    "confidence_score": detected_goal.get("confidence", 0.0),
                    "category": detected_goal.get("category", "other")
                }
                
                goal_ref.set(goal_data)
                new_goals_count += 1
                logger.info(f"Created new goal ({detected_goal.get('status')}): {goal_text}")
        
        result = {
            "goals_processed": len(detected_goals),
            "new_goals": new_goals_count,
            "updated_goals": updated_goals_count
        }
        
        logger.info(f"Goal tracking complete for session {session_id}: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error tracking goals from session {session_id}: {e}")
        return {"goals_processed": 0, "new_goals": 0, "updated_goals": 0, "error": str(e)}

async def get_relevant_session_context(user_id: str, current_session_id: str, current_messages: List[dict]) -> dict:
    """
    Get relevant context from previous session SUMMARIES ONLY to inform question generation.
    
    This function:
    1. Retrieves recent session summaries (NOT full messages)
    2. Gets active user goals for context
    3. Returns concise historical context for question generation
    
    Privacy-focused: Only uses processed summaries, never raw messages from previous sessions.
    """
    try:
        # Get recent session summaries (last 3 sessions, excluding current)
        # Using summaries ensures privacy and efficiency
        summaries_query = db.collection("session_summaries")\
            .where("user_id", "==", user_id)\
            .order_by("created_at", direction="DESCENDING")\
            .limit(3)
        
        summaries = list(summaries_query.stream())
        recent_summaries = []
        
        for summary_doc in summaries:
            if summary_doc.id == current_session_id:
                continue  # Skip current session
            summary_data = summary_doc.to_dict()
            if summary_data and summary_data.get("summary"):
                # Only store the summary text, not full session data
                summary_text = summary_data.get("summary", "").strip()
                if summary_text:
                    recent_summaries.append({
                        "summary": summary_text[:200],  # Limit length to keep context focused
                        "session_date": summary_data.get("created_at")
                    })
        
        # Get recent active goals for context
        goals_query = db.collection("goals")\
            .where("user_id", "==", user_id)\
            .where("status", "in", ["started", "imagined"])\
            .order_by("last_mentioned", direction="DESCENDING")\
            .limit(3)
        
        recent_goals = []
        goals_docs = list(goals_query.stream())
        for goal_doc in goals_docs:
            goal_data = goal_doc.to_dict()
            if goal_data:
                recent_goals.append({
                    "goal": goal_data.get("goal", ""),
                    "status": goal_data.get("status", ""),
                    "category": goal_data.get("category", "")
                })
        
        # Create brief historical context from summaries only
        historical_context = ""
        if recent_summaries:
            # Combine the most recent 1-2 summaries into brief context
            context_parts = []
            for i, summary_data in enumerate(recent_summaries[:2]):
                summary_text = summary_data["summary"]
                # Keep each summary very brief for context
                brief_summary = summary_text[:100] + "..." if len(summary_text) > 100 else summary_text
                context_parts.append(f"Recent session {i+1}: {brief_summary}")
            
            historical_context = " | ".join(context_parts)
        
        context = {
            "session_summaries": recent_summaries[:2],  # Most recent 2 summaries
            "recent_goals": recent_goals,
            "historical_context": historical_context
        }
        
        logger.info(f"Retrieved summary-based context for session {current_session_id}: {len(recent_summaries)} summaries, {len(recent_goals)} goals")
        return context
        
    except Exception as e:
        logger.error(f"Error getting session context: {e}")
        return {"session_summaries": [], "recent_goals": [], "historical_context": ""}

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
    
    # Track goals from this session
    goal_tracking_result = await track_goals_from_session(session_id, messages, user["uid"])
    
    # Store summary and analytics in a separate collection
    db.collection("session_summaries").document(session_id).set({
        "session_id": session_id,
        "user_id": user["uid"],
        "summary": summary,
        "analytics": analytics,
        "goal_tracking": goal_tracking_result,
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
    
    # Calculate average emotion percentages across all sessions
    emotion_averages = {
        "anxiety": 0, "happy": 0, "sad": 0, "disgust": 0, "fear": 0,
        "anger": 0, "envy": 0, "embarrassment": 0, "content": 0, "relief": 0
    }
    
    if all_summaries:
        # Sum up percentages from each session
        for s in all_summaries:
            if s.get("analytics") and "emotion_percentages" in s["analytics"]:
                for emotion, percentage in s["analytics"]["emotion_percentages"].items():
                    emotion_averages[emotion] += percentage
        
        # Average the percentages
        num_sessions = len(all_summaries)
        emotion_averages = {emotion: round(total / num_sessions, 3) for emotion, total in emotion_averages.items()}
        
        # Ensure they still sum to 1.0
        current_sum = sum(emotion_averages.values())
        if current_sum != 1.0 and current_sum > 0:
            # Adjust the largest percentage to make sum exactly 1.0
            max_emotion = max(emotion_averages.keys(), key=lambda k: emotion_averages[k])
            emotion_averages[max_emotion] += round(1.0 - current_sum, 3)
    
    db.collection("user_summaries").document(user["uid"]).set({
        "user_id": user["uid"],
        "overall_summary": overall_summary,
        "avg_intensity": avg_intensity,
        "emotion_percentages": emotion_averages
    })
    return {
        "status": "summarized", 
        "summary": summary, 
        "analytics": analytics, 
        "overall_summary": overall_summary,
        "goal_tracking": goal_tracking_result
    }

@router.get("/summary/{session_id}")
async def get_session_summary(session_id: str, user=Depends(get_current_user)):
    """
    Get the summary and emotional analysis for a single session.
    
    This endpoint returns the AI-generated summary and comprehensive emotion analysis
    for a completed session. If the session hasn't been closed/summarized yet,
    it will analyze the current messages and provide a live analysis.
    """
    # First check if session has been summarized
    summary_ref = db.collection("session_summaries").document(session_id)
    summary_doc = summary_ref.get()
    
    if summary_doc.exists:
        # Return existing summary
        summary_data = summary_doc.to_dict()
        return {
            "session_id": session_id,
            "status": "completed",
            "summary": summary_data.get("summary", ""),
            "emotion_analysis": summary_data.get("analytics", {}),
            "created_at": str(summary_data.get("created_at", "")),
            "note": "This session has been completed and analyzed"
        }
    
    # If not summarized, get current session data and analyze it
    session_ref = db.collection("sessions").document(session_id)
    session = session_ref.get()
    
    if not session.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = session.to_dict()
    if not session_data:
        raise HTTPException(status_code=404, detail="Session data not found")
    
    # Verify user owns this session
    if session_data.get("user_id") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied to this session")
    
    messages = session_data.get("messages", [])
    
    if len(messages) == 0:
        return {
            "session_id": session_id,
            "status": "empty",
            "summary": "No messages in this session yet.",
            "emotion_analysis": {
                "emotion_percentages": {
                    "anxiety": 0.0, "happy": 0.0, "sad": 0.0, "disgust": 0.0, "fear": 0.0,
                    "anger": 0.0, "envy": 0.0, "embarrassment": 0.0, "content": 1.0, "relief": 0.0
                },
                "avg_intensity": 5.0,
                "message_analysis": {
                    "total_messages": 0,
                    "user_messages": 0,
                    "analyzed_messages": 0,
                    "avg_message_length": 0
                }
            },
            "created_at": str(session_data.get("created_at", "")),
            "note": "Session is empty - no analysis available yet"
        }
    
    # Generate live analysis
    analytics = analyze_messages(messages)
    
    # Generate summary if session has enough content
    if len(messages) >= 3:
        summary = await summarize_text(messages)
    else:
        summary = "Session is still in progress. Not enough content for a meaningful summary yet."
    
    return {
        "session_id": session_id,
        "status": "active",
        "summary": summary,
        "emotion_analysis": analytics,
        "created_at": str(session_data.get("created_at", "")),
        "message_count": len(messages),
        "note": "Live analysis of active session - summary will be more comprehensive when session is closed"
    }

@router.post("/generate-question")
async def generate_question(session_id: str, user=Depends(get_current_user)):
    """
    Generate a brief therapeutic response (1-2 lines) and add it to the message history.
    
    This endpoint generates either a supportive statement or a concise follow-up
    question based primarily on the current conversation, with relevant context
    from previous sessions to maintain continuity.
    """
    session_ref = db.collection("sessions").document(session_id)
    session = session_ref.get()
    if not session.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    session_data = session.to_dict()
    if not session_data:
        raise HTTPException(status_code=404, detail="Session data not found")
    
    # Check if session is summarized (exists in session_summaries)
    summary_ref = db.collection("session_summaries").document(session_id)
    summary_doc = summary_ref.get()
    if summary_doc.exists:
        # Remove the summary to "reopen" the session
        summary_ref.delete()
        logger.info(f"Reopened session {session_id} by removing summary")
    
    # Get current session messages (primary focus)
    current_history = session_data.get("messages", [])
    
    # Get relevant context from previous sessions (secondary context)
    historical_context = await get_relevant_session_context(user["uid"], session_id, current_history)
    
    # Generate response with weighted context
    response = await generate_contextual_followup_question(current_history, historical_context)
    
    # Add the generated question/response to the message history
    msg_data = {
        "text": response,
        "time": datetime.now(),
        "role": "generated"
    }
    
    session_ref.update({
        "messages": ArrayUnion([msg_data])
    })
    
    logger.info(f"Generated contextual question added to session {session_id}: {response[:50]}...")
    
    return {
        "response": response,
        "type": "therapeutic_response",
        "note": "This response prioritizes current conversation with historical context",
        "message_added": True,
        "reopened": summary_doc.exists,
        "used_historical_context": len(historical_context.get("session_summaries", [])) > 0 or len(historical_context.get("recent_goals", [])) > 0
    }

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
        
        # Add test messages with specific details for AI to reference
        test_messages = [
            {"text": "I've been feeling really anxious about my new marketing project at work.", "time": datetime.now(), "role": "user", "user_id": user["uid"]},
            {"text": "That sounds stressful. Can you tell me more about this marketing project?", "time": datetime.now(), "role": "generated"},
            {"text": "It's a big campaign for our biggest client, Johnson & Co. My boss Sarah said it's really important.", "time": datetime.now(), "role": "user", "user_id": user["uid"]},
            {"text": "I understand. Working on important projects can feel overwhelming.", "time": datetime.now(), "role": "generated"},
            {"text": "The deadline is next Friday and I'm worried I won't finish in time. I've been staying up until 2am working on it.", "time": datetime.now(), "role": "user", "user_id": user["uid"]},
            {"text": "That sounds exhausting. How are you managing the stress?", "time": datetime.now(), "role": "generated"},
            {"text": "Not well. I had a panic attack yesterday during the team meeting about the project.", "time": datetime.now(), "role": "user", "user_id": user["uid"]}
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
