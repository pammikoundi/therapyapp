
from fastapi import APIRouter, Depends
from core.firebase import db
from core.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/")
async def get_statistics(user=Depends(get_current_user)):
    # Total sessions
    sessions = db.collection("sessions").where("user_id", "==", user["uid"]).stream()
    session_list = [s.to_dict() for s in sessions]
    total_sessions = len(session_list)

    # Consecutive days
    dates = sorted({s.get("created_at").date() for s in session_list if s.get("created_at")}, reverse=True)
    consecutive = 0
    if dates:
        consecutive = 1
        for i in range(1, len(dates)):
            if (dates[i-1] - dates[i]).days == 1:
                consecutive += 1
            else:
                break

    return {
        "total_sessions": total_sessions,
        "consecutive_days": consecutive
    }

@router.get("/goals")
async def get_user_goals(user=Depends(get_current_user)):
    goals = db.collection("goals").where("user_id", "==", user["uid"]).stream()
    return {"goals": [g.to_dict() for g in goals]}

@router.get("/mood-trends")
async def get_mood_trends(user=Depends(get_current_user)):
    moods = db.collection("moods").where("user_id", "==", user["uid"]).stream()
    mood_entries = [m.to_dict() for m in moods]
    mood_counts = {}
    for entry in mood_entries:
        mood = entry.get("mood")
        if mood:
            mood_counts[mood] = mood_counts.get(mood, 0) + 1
    return {"mood_trends": mood_counts}
