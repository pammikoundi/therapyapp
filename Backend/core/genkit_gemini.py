import asyncio
from typing import List
import google.generativeai as genai
from core.config import settings

# Configure the Google Generative AI client
genai.configure(api_key=settings.gemini_api_key)

# Initialize the Gemini 2.5 Flash model
model = genai.GenerativeModel('gemini-2.5-flash')

async def generate_followup_question(history: List[dict]) -> str:
    """
    Generates a follow-up question based on the conversation history.
    """
    try:
        context = "\n".join([msg["text"] for msg in history if "text" in msg])
    prompt = f"""Given the following conversation history, generate a brief therapeutic response (1-2 lines maximum).

Conversation History:
{context}

Your response should be:
- Very short (1-2 lines only)
- Either a concise follow-up question OR a supportive statement
- Empathetic and appropriate for therapy
- Sometimes just acknowledge with statements like "I understand", "I hear you", "That sounds difficult", "I'm here to listen"
- Other times ask a brief question to explore deeper

Response:"""

        # Run the blocking call in a thread pool
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, model.generate_content, prompt)
        
        return response.text
    except Exception as e:
        print(f"Error generating follow-up question: {e}")
        # Return a short, supportive fallback response
        return "I'm here to listen. How are you feeling?"

async def summarize_text_flow(text: str) -> str:
    """
    Summarizes the given text for therapy session analysis.
    """
    try:
        prompt = f"""Summarize the following therapy session conversation, focusing on:
- Main topics discussed
- Emotions expressed
- Key insights or breakthroughs
- Overall mood and tone

Keep the summary professional and respectful:

Session Content:
{text}

Summary:"""

        # Run the blocking call in a thread pool
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, model.generate_content, prompt)
        
        return response.text
    except Exception as e:
        print(f"Error summarizing text: {e}")
        # Return a fallback summary
        return "Session summary: The user shared their thoughts and feelings during this conversation."
