from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserGoal(BaseModel):
    user_id: str
    goal: str
    status: str  # imagined, started, done, abandoned
    created_at: str  # ISO date string
    last_mentioned: str  # Last session where this goal was discussed
    session_mentions: List[str] = []  # List of session IDs where goal was mentioned
    confidence_score: float = 0.0  # AI confidence in goal identification (0-1)
    category: Optional[str] = None  # anxiety, relationships, work, health, etc.

class MoodEntry(BaseModel):
    user_id: str
    mood: str
    date: str  # ISO date string
