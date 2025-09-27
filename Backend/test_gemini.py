#!/usr/bin/env python3
"""
Test script for Gemini AI integration.
Run this to verify that the Google Generative AI is working correctly.

Make sure you have GEMINI_API_KEY set in your environment or .env file.
"""

import asyncio
import os
from core.genkit_gemini import generate_followup_question, summarize_text_flow

async def test_gemini_integration():
    """Test the Gemini AI functions"""
    
    print("Testing Gemini AI integration...")
    
    # Test data
    sample_history = [
        {"text": "I've been feeling really anxious lately.", "role": "user"},
        {"text": "I understand that anxiety can be overwhelming. Can you tell me more about when these feelings started?", "role": "generated"},
        {"text": "It started about two weeks ago when I got this new job.", "role": "user"}
    ]
    
    sample_text = """
    User: I've been having trouble sleeping lately. I keep worrying about work.
    Assistant: That sounds really stressful. Work-related worry can definitely impact sleep. 
    User: Yes, I just can't seem to turn my brain off at night. I keep thinking about all the things I need to do tomorrow.
    Assistant: It sounds like your mind is very active when you're trying to rest. Have you tried any techniques to help calm your thoughts before bed?
    """
    
    try:
        print("\n1. Testing follow-up question generation...")
        question = await generate_followup_question(sample_history)
        print(f"Generated question: {question}")
        
        print("\n2. Testing text summarization...")
        summary = await summarize_text_flow(sample_text)
        print(f"Generated summary: {summary}")
        
        print("\n✅ All tests passed! Gemini AI integration is working correctly.")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        print("Make sure:")
        print("1. Your GEMINI_API_KEY is set in your .env file")
        print("2. You have an internet connection")
        print("3. Your API key is valid and has quota available")

if __name__ == "__main__":
    asyncio.run(test_gemini_integration())