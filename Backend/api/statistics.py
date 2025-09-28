"""
Statistics API Module

This module provides analytics endpoints for the therapy app including:
- Session statistics and activity tracking
- Mood trends analysis from session data
- User goals management
- Progress metrics and insights

Endpoints:
- GET /statistics/ - General user statistics
- GET /statistics/goals - User therapy goals
- GET /statistics/mood-trends - Mood analysis
"""

from fastapi import APIRouter, Depends, HTTPException
from core.firebase import db
from core.auth import get_current_user
from datetime import datetime, timedelta
from typing import Dict, Any, List
import logging

# Configure logging for statistics operations
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def get_statistics(user=Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get comprehensive user statistics including session counts and activity patterns.
    
    Returns:
        Dict containing total_sessions, consecutive_days, and activity metrics
    """
    try:
        # Check if database is available (handles dev mode gracefully)
        if db is None:
            logger.warning("Database not available - returning mock statistics for development")
            return {
                "total_sessions": 5,
                "consecutive_days": 3,
                "status": "development_mode"
            }
        
        logger.info(f"Fetching statistics for user: {user.get('uid')}")
        
        # Get all sessions for the user
        sessions_query = db.collection("sessions").where("user_id", "==", user["uid"])
        sessions = list(sessions_query.stream())
        session_list = [s.to_dict() for s in sessions]
        total_sessions = len(session_list)
        
        logger.info(f"Found {total_sessions} sessions for user")
        
        # Calculate consecutive days with proper date handling
        dates = []
        for session in session_list:
            created_at = session.get("created_at")
            if created_at:
                try:
                    # Handle both datetime objects and timestamps
                    if hasattr(created_at, 'date'):
                        dates.append(created_at.date())
                    elif hasattr(created_at, 'seconds'):  # Firestore timestamp
                        date_obj = datetime.fromtimestamp(created_at.seconds)
                        dates.append(date_obj.date())
                    else:
                        # Try parsing as ISO string
                        date_obj = datetime.fromisoformat(str(created_at))
                        dates.append(date_obj.date())
                except Exception as e:
                    logger.warning(f"Could not parse date {created_at}: {e}")
                    continue
        
        # Remove duplicates and sort
        unique_dates = sorted(set(dates), reverse=True)
        consecutive = 0
        
        if unique_dates:
            consecutive = 1
            for i in range(1, len(unique_dates)):
                if (unique_dates[i-1] - unique_dates[i]).days == 1:
                    consecutive += 1
                else:
                    break
        
        # Get additional metrics from session summaries
        summaries_query = db.collection("session_summaries").where("user_id", "==", user["uid"])
        summaries = list(summaries_query.stream())
        analyzed_sessions = len(summaries)
        
        result = {
            "total_sessions": total_sessions,
            "consecutive_days": consecutive,
            "analyzed_sessions": analyzed_sessions,
            "active_dates": len(unique_dates),
            "status": "success"
        }
        
        logger.info(f"Statistics calculated: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error fetching statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {str(e)}")

@router.get("/goals")
async def get_user_goals(user=Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get user's therapy goals with AI-tracked progress.
    
    Returns comprehensive goal tracking including:
    - All goals with their current status (imagined, started, done, abandoned)
    - Progress statistics and breakdowns
    - Recent goal activity
    """
    try:
        if db is None:
            logger.warning("Database not available - returning mock goals for development")
            return {
                "goals": [
                    {
                        "goal": "Improve sleep quality", 
                        "status": "started", 
                        "category": "health",
                        "created_at": "2024-01-01", 
                        "session_mentions": ["session1", "session3"],
                        "confidence_score": 0.9
                    },
                    {
                        "goal": "Manage anxiety better", 
                        "status": "imagined", 
                        "category": "anxiety",
                        "created_at": "2024-01-02", 
                        "session_mentions": ["session2"],
                        "confidence_score": 0.8
                    }
                ],
                "status": "development_mode"
            }
        
        logger.info(f"Fetching goals for user: {user.get('uid')}")
        
        goals_query = db.collection("goals").where("user_id", "==", user["uid"])
        goals = list(goals_query.stream())
        goal_list = []
        
        # Organize goals by status
        status_counts = {"imagined": 0, "started": 0, "done": 0, "abandoned": 0}
        category_counts = {}
        recent_activity = []
        
        for goal_doc in goals:
            goal_data = goal_doc.to_dict()
            goal_data["goal_id"] = goal_doc.id  # Include document ID
            goal_list.append(goal_data)
            
            # Count by status
            status = goal_data.get("status", "imagined")
            status_counts[status] = status_counts.get(status, 0) + 1
            
            # Count by category
            category = goal_data.get("category", "other")
            category_counts[category] = category_counts.get(category, 0) + 1
            
            # Track recent activity (last mentioned in last 7 days)
            last_mentioned = goal_data.get("last_mentioned")
            if last_mentioned:
                try:
                    from datetime import datetime, timedelta
                    last_date = datetime.fromisoformat(last_mentioned.replace('Z', '+00:00'))
                    if datetime.now().replace(tzinfo=last_date.tzinfo) - last_date < timedelta(days=7):
                        recent_activity.append({
                            "goal": goal_data.get("goal", ""),
                            "status": status,
                            "last_mentioned": last_mentioned
                        })
                except Exception as e:
                    logger.warning(f"Could not parse last_mentioned date: {e}")
        
        # Sort goals by last mentioned (most recent first)
        goal_list.sort(key=lambda g: g.get("last_mentioned", ""), reverse=True)
        
        logger.info(f"Found {len(goal_list)} goals for user with status breakdown: {status_counts}")
        
        return {
            "goals": goal_list,
            "total_goals": len(goal_list),
            "status_breakdown": status_counts,
            "category_breakdown": category_counts,
            "recent_activity": recent_activity,
            "progress_summary": {
                "completion_rate": round(status_counts["done"] / max(len(goal_list), 1) * 100, 1),
                "active_goals": status_counts["started"],
                "total_completed": status_counts["done"]
            },
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error fetching goals: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch goals: {str(e)}")


@router.get("/mood-trends")
async def get_mood_trends(user=Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get mood trends analysis from session summaries and mood entries.
    
    This endpoint analyzes mood data from both direct mood entries and
    session summaries to provide comprehensive mood tracking.
    
    Returns:
        Dict containing mood trends, counts, and analysis
    """
    try:
        if db is None:
            logger.warning("Database not available - returning mock mood trends for development")
            return {
                "mood_trends": {
                    "happy": 5,
                    "neutral": 3,
                    "anxious": 2,
                    "sad": 1
                },
                "status": "development_mode"
            }
        
        logger.info(f"Fetching mood trends for user: {user.get('uid')}")
        
        # Get mood data from multiple sources
        mood_counts = {}
        
        # 1. Direct mood entries (if any exist)
        moods_query = db.collection("moods").where("user_id", "==", user["uid"])
        mood_entries = list(moods_query.stream())
        
        for entry_doc in mood_entries:
            entry = entry_doc.to_dict()
            mood = entry.get("mood")
            if mood:
                mood_counts[mood] = mood_counts.get(mood, 0) + 1
        
        # 2. Mood data from session summaries (more comprehensive)
        summaries_query = db.collection("session_summaries").where("user_id", "==", user["uid"])
        summaries = list(summaries_query.stream())
        
        for summary_doc in summaries:
            summary = summary_doc.to_dict()
            analytics = summary.get("analytics", {})
            session_moods = analytics.get("mood_counts", {})
            
            # Aggregate mood counts from session analytics
            for mood, count in session_moods.items():
                mood_counts[mood] = mood_counts.get(mood, 0) + count
        
        # Calculate additional metrics
        total_mood_entries = sum(mood_counts.values())
        most_common_mood = max(mood_counts.items(), key=lambda x: x[1])[0] if mood_counts else None
        
        result = {
            "mood_trends": mood_counts,
            "total_entries": total_mood_entries,
            "most_common_mood": most_common_mood,
            "mood_diversity": len(mood_counts),
            "from_sessions": len(summaries),
            "from_direct_entries": len(mood_entries),
            "status": "success"
        }
        
        logger.info(f"Mood trends calculated: {len(mood_counts)} different moods, {total_mood_entries} total entries")
        return result
        
    except Exception as e:
        logger.error(f"Error fetching mood trends: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch mood trends: {str(e)}")
