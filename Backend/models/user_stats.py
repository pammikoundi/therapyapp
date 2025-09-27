from pydantic import BaseModel
from typing import Optional

class UserGoal(BaseModel):
    user_id: str
    goal: str
    created_at: str  # ISO date string

class MoodEntry(BaseModel):
    user_id: str
    mood: str
    date: str  # ISO date string
