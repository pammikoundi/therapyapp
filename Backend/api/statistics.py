from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_statistics():
    return {"total_sessions": 5, "avg_length": 10}

@router.get("/mood")
async def get_mood_statistics():
    return {"happy": 3, "sad": 2, "neutral": 5}
