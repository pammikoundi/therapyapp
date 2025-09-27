# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AI-powered therapy app with two main components:
- **Backend**: FastAPI-based API server with Firebase/Firestore integration and Gemini AI
- **Frontend**: React Native/Expo mobile app with file-based routing

## Architecture

### Backend Structure
- `main.py`: FastAPI application entry point with middleware and router registration
- `api/`: Route handlers for sessions, history, and statistics endpoints
- `core/`: Core services (auth, Firebase, Gemini AI integration, config)
- `models/`: Pydantic schemas and data models

### Frontend Structure
- `app/`: File-based routing with tabs layout (`(tabs)/`)
- `components/`: Reusable UI components including themed components and icons
- `hooks/`: Custom React hooks for color scheme and theme management
- `constants/`: Theme and styling constants

### Key API Endpoints (from architecture.md)
- `/session/` - Session management
- `/session/generate-question` - AI-generated follow-up questions
- `/session/message` - Add user messages to sessions
- `/history` - Session history
- `/statistics` - User analytics and mood tracking

## Technology Stack

### Backend
- **Framework**: FastAPI with Uvicorn server
- **Database**: Firebase/Firestore for data persistence
- **AI**: Google Generative AI (Gemini) for text generation and summarization
- **Auth**: Firebase Authentication
- **Additional**: spaCy for NLP, Pydantic for data validation

### Frontend
- **Framework**: React Native with Expo
- **Navigation**: Expo Router with file-based routing
- **UI**: React Native components with theming support
- **State**: React hooks-based state management

## Development Commands

### Backend
```bash
# Install dependencies
cd Backend
pip install -r requirements.txt

# Run development server
cd Backend
uvicorn main:app --reload

# Run with specific host/port
cd Backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
# Install dependencies
cd Frontend
npm install

# Start development server
cd Frontend
npx expo start

# Platform-specific development
cd Frontend
npx expo start --android  # Android emulator
npx expo start --ios      # iOS simulator
npx expo start --web      # Web browser

# Lint code
cd Frontend
npm run lint

# Reset project (moves starter code to app-example)
cd Frontend
npm run reset-project
```

## Session Management Architecture

The app implements a sophisticated session-based conversation system:

1. **Session Creation**: Each therapy session creates a unique session document in Firestore
2. **Message Storage**: User and AI messages are stored as arrays within session documents
3. **Session Analysis**: When sessions close, they're analyzed for:
   - Mood tracking and sentiment analysis
   - Intensity scoring
   - Emotion categorization
4. **Summarization**: Long sessions (5+ messages) are automatically summarized using Gemini AI
5. **Overall Analytics**: User summaries aggregate data across all sessions

## Firebase Integration

- Authentication handled via Firebase Auth with custom middleware
- Firestore collections:
  - `sessions`: Active conversation sessions
  - `session_summaries`: Analyzed and summarized completed sessions
  - `user_summaries`: Aggregated user analytics and overall summaries
- Real-time message updates using Firestore's ArrayUnion operations

## AI Integration

The app uses Google's Gemini AI for:
- Generating contextual follow-up questions based on conversation history
- Summarizing session content for analytics
- Creating overall user summaries from multiple session summaries

## Environment Setup

### Backend Requirements
- Google Cloud credentials for Firebase/Firestore access
- Gemini API key for AI functionality
- SSL certificates for secure communication
- Create `.env` file with required environment variables (see `core/config.py`)

### Frontend Requirements
- Node.js and npm
- Expo CLI
- React Native development environment (for native builds)