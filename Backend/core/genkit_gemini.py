# Genkit Gemini integration for question generation
import os
import requests
from typing import List

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

def generate_followup_question(history: List[dict]) -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY environment variable not set.")
    context = "\n".join([msg["text"] for msg in history if "text" in msg])
    prompt = f"Given the following conversation history, generate a good follow-up question for therapy:\n{context}\nFollow-up question:"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    response = requests.post(
        f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
        json=payload
    )
    if response.status_code == 200:
        data = response.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            return "Could not parse Gemini response."
    else:
        return f"Gemini API error: {response.status_code} {response.text}"
