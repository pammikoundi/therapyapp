import asyncio
from typing import List
import google.generativeai as genai
from core.config import settings

# Configure the Google Generative AI client
genai.configure(api_key=settings.gemini_api_key)

# Initialize the Gemini Pro model
model = genai.GenerativeModel('gemini-pro')

async def generate_followup_question(history: List[dict]) -> str:
    """
    Generates a follow-up question based on the conversation history.
    """
    try:
        # Extract conversation context with speaker roles for better understanding
        context_parts = []
        for msg in history:
            if "text" in msg and msg["text"].strip():
                role = msg.get("role", "user")
                speaker = "You" if role == "user" else "Therapist"
                context_parts.append(f"{speaker}: {msg['text']}")
        
        context = "\n".join(context_parts)
        prompt = f"""Given the following conversation history, generate a brief therapeutic response (1-2 lines maximum).

Conversation History:
{context}

Your response should be:
- Very short (1-2 lines only)
- Either a concise follow-up question OR a supportive statement
- Reference specific details from the conversation when appropriate (e.g., "How is your project going?", "How are things with your boss?", "Is work still stressing you?")
- Show that you're actively listening by mentioning things they've shared
- Sometimes just acknowledge with statements like "I understand", "I hear you", "That sounds difficult"
- Make it personal and connected to what they've actually said
- Empathetic and appropriate for therapy

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
