import asyncio
from typing import List
import google.generativeai as genai
from core.config import settings

# Configure the Google Generative AI client
genai.configure(api_key=settings.gemini_api_key)

# Initialize the Gemini Pro model
model = genai.GenerativeModel('gemini-1.5-pro')

async def generate_followup_question(history: List[dict]) -> str:
    """
    Generates a follow-up question based on the conversation history.
    """
    context = "\n".join([msg["text"] for msg in history if "text" in msg])
    prompt = f"""Given the following conversation history, generate a thoughtful follow-up question to help continue the therapeutic conversation:

Conversation History:
{context}

Generate a follow-up question that:
- Shows empathy and understanding
- Encourages deeper reflection
- Helps explore emotions or thoughts
- Is appropriate for a therapy session

Follow-up question:"""

    # Run the blocking call in a thread pool
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, model.generate_content, prompt)
    
    return response.text

async def summarize_text_flow(text: str) -> str:
    """
    Summarizes the given text for therapy session analysis.
    """
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
