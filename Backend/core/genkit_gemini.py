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
        # Extract conversation context with speaker roles for better understanding
        context_parts = []
        for msg in history:
            if "text" in msg and msg["text"].strip():
                role = msg.get("role", "user")
                speaker = "You" if role == "user" else "Therapist"
                context_parts.append(f"{speaker}: {msg['text']}")
        
        context = "\n".join(context_parts)
        prompt = f"""Given the following conversation history, generate a gentle, supportive response (1-2 lines maximum).

Conversation History:
{context}

Your response should be:
- Very short and gentle (1-2 lines only)
- Use a warm, conversational tone (like a caring friend)
- Avoid intense or probing questions
- Often just offer gentle acknowledgment like "That makes sense", "I can understand that", "It sounds like you're going through a lot"
- When asking questions, keep them soft and optional (e.g., "Would you like to share more about that?" rather than direct questions)
- Reference what they've shared in a gentle way (e.g., "How has that been for you?" rather than "Tell me more about...")
- Focus on validation and support rather than analysis
- Use phrases like "if you're comfortable sharing", "when you're ready", "that sounds really hard"
- Keep it light and non-pressuring

Response:"""

        # Run the blocking call in a thread pool
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, model.generate_content, prompt)
        
        return response.text
    except Exception as e:
        print(f"Error generating follow-up question: {e}")
        # Return a gentle, supportive fallback response
        return "I'm here if you'd like to share anything."

async def summarize_text_flow(text: str) -> str:
    """
    Summarizes the given text in a friendly, supportive way.
    """
    try:
        prompt = f"""Write a warm, friendly summary of this conversation as if you're a supportive friend reflecting back on what was shared. Focus on:

- What main things were talked about
- The feelings and emotions that came up
- Any moments of insight or understanding
- The overall emotional journey

Write in a caring, non-clinical tone - like a friend who was really listening and wants to acknowledge what was shared. Avoid therapy jargon or clinical language. Use "you" to address the person directly.

Conversation:
{text}

Friendly Summary:"""

        # Run the blocking call in a thread pool
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, model.generate_content, prompt)
        
        return response.text
    except Exception as e:
        print(f"Error summarizing text: {e}")
        # Return a friendly fallback summary
        return "It sounds like you shared some meaningful thoughts and feelings in this conversation. Thanks for opening up."

async def analyze_goals_from_session(messages: List[dict]) -> dict:
    """
    Analyzes session messages to identify, track, and update goals automatically.
    """
    try:
        # Extract only user messages for goal analysis
        user_messages = [msg for msg in messages if msg.get("role") == "user"]
        if not user_messages:
            return {"goals": [], "updates": []}
        
        # Create conversation context
        conversation_text = "\n".join([f"User: {msg.get('text', '')}" for msg in user_messages])
        
        prompt = f"""Analyze this conversation to identify goals and their progress. Look for:

1. NEW GOALS mentioned (things they want to achieve, change, or work on)
2. PROGRESS updates on existing goals (started working on, made progress, completed, gave up)
3. The current STATUS of each goal

For each goal found, determine:
- Goal description (clear, specific)
- Status: "imagined" (just thought about), "started" (taking action), "done" (completed), "abandoned" (gave up)
- Category: anxiety, relationships, work, health, personal_growth, sleep, other
- Confidence (0.0-1.0): How confident are you this is actually a goal?

Conversation:
{conversation_text}

Return ONLY a JSON object in this exact format:
{{
  "goals": [
    {{
      "goal": "specific goal description",
      "status": "imagined|started|done|abandoned",
      "category": "category_name",
      "confidence": 0.8,
      "evidence": "quote from conversation showing this goal"
    }}
  ]
}}

If no clear goals are found, return: {{"goals": []}}"""

        # Run the blocking call in a thread pool
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, model.generate_content, prompt)
        
        # Parse the JSON response
        import json
        try:
            result = json.loads(response.text.strip())
            return result
        except json.JSONDecodeError:
            # Try to extract JSON from response if it has extra text
            text = response.text.strip()
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end != -1:
                json_str = text[start:end]
                result = json.loads(json_str)
                return result
            else:
                print(f"Could not parse goal analysis JSON: {text}")
                return {"goals": []}
        
    except Exception as e:
        print(f"Error analyzing goals from session: {e}")
        return {"goals": []}
