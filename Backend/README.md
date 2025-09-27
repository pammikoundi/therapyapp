# Therapy App Backend

An AI-powered therapy application backend built with FastAPI, featuring conversational AI assistance, session management, mood tracking, and comprehensive analytics.

## 🎯 Project Overview

This backend provides a comprehensive API for a digital therapy platform that combines human-like conversation with AI assistance. The system manages therapy sessions, tracks user progress, provides mood analytics, and offers AI-generated follow-up questions to enhance therapeutic conversations.

### Key Features

- **AI-Powered Conversations**: Google Gemini AI integration for generating thoughtful follow-up questions
- **Session Management**: Create, manage, and track therapy conversation sessions
- **Smart Summarization**: Automatic session summarization with mood and emotion analysis
- **User Analytics**: Comprehensive mood tracking, progress metrics, and therapy goal management
- **Firebase Integration**: Secure authentication and real-time database with Firestore
- **Production Ready**: Docker containerization and Google Cloud Run deployment

## 🏗️ Project Structure

```
Backend/
├── main.py                 # FastAPI application entry point and server configuration
├── requirements.txt        # Python dependencies and package versions
├── test_gemini.py         # Test script for Gemini AI integration verification
├── .env.example           # Environment variables template
├── 
├── api/                   # API route handlers and endpoint logic
│   ├── session.py         # Session management endpoints (create, message, AI assistance)
│   ├── history.py         # Session history and conversation retrieval endpoints
│   └── statistics.py      # Analytics, mood tracking, and progress metrics endpoints
│
├── core/                  # Core application services and configuration
│   ├── config.py          # Application configuration and environment management
│   ├── firebase.py        # Firebase Admin SDK initialization and client setup
│   ├── auth.py            # Authentication services and user verification
│   ├── middleware.py      # Custom middleware for request processing and auth
│   └── genkit_gemini.py   # Google Gemini AI integration for conversation assistance
│
└── models/                # Data models and schema definitions
    ├── schemas.py         # Pydantic models for request/response validation
    └── user_stats.py      # User statistics and analytics data models
```

## 📁 File Descriptions

### Core Application Files

| File | Purpose |
|------|---------|
| **main.py** | FastAPI application entry point that configures routes, middleware, CORS, and health endpoints |
| **requirements.txt** | Python package dependencies including FastAPI, Firebase, Gemini AI, and scientific computing libraries |
| **test_gemini.py** | Verification script for testing Google Gemini AI integration and API connectivity |

### API Endpoints (`api/`)

| File | Purpose |
|------|---------|
| **session.py** | Manages therapy sessions including creation, message handling, AI question generation, and session closure with analytics |
| **history.py** | Provides access to conversation history, past sessions, and session status tracking |
| **statistics.py** | Delivers user analytics including mood trends, therapy goals, session statistics, and progress metrics |

### Core Services (`core/`)

| File | Purpose |
|------|---------|
| **config.py** | Centralized configuration management using Pydantic Settings for environment variables and app settings |
| **firebase.py** | Firebase Admin SDK initialization, Firestore database client, and authentication service setup |
| **auth.py** | User authentication logic with Firebase ID token validation and development mode bypasses |
| **middleware.py** | Custom HTTP middleware for request processing, authentication enforcement, and CORS handling |
| **genkit_gemini.py** | Google Gemini AI integration for generating contextual follow-up questions and session summarization |

### Data Models (`models/`)

| File | Purpose |
|------|---------|
| **schemas.py** | Pydantic models for API request/response validation, message structures, and data serialization |
| **user_stats.py** | Data models for user statistics, mood entries, therapy goals, and analytics structures |

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- Google Cloud Project with Firebase enabled
- Google Gemini API key
- Firebase service account key

### Installation

1. **Clone and navigate to backend directory**
   ```bash
   git clone <repository-url>
   cd therapyapp/Backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

   Required environment variables:
   ```env
   ENVIRONMENT=dev
   GEMINI_API_KEY=your_gemini_api_key
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   SSL_CERT_FILE=/path/to/ssl/cert.pem  # Optional for development
   ```

### Running the Application

1. **Development Server**
   ```bash
   uvicorn main:app --reload
   ```
   Access the API at: `http://127.0.0.1:8000`

2. **API Documentation**
   - Swagger UI: `http://127.0.0.1:8000/docs`
   - ReDoc: `http://127.0.0.1:8000/redoc`

3. **Health Check**
   ```bash
   curl http://127.0.0.1:8000/health
   ```

4. **Test AI Integration**
   ```bash
   python test_gemini.py
   ```

## 📊 Database Schema (Firestore Collections)

### `sessions`
Active therapy conversation sessions
```json
{
  "session_id": "auto-generated",
  "user_id": "firebase-user-uid",
  "created_at": "timestamp",
  "messages": [
    {
      "text": "user message",
      "time": "timestamp",
      "role": "user|generated",
      "user_id": "firebase-uid"
    }
  ]
}
```

### `session_summaries`
Analyzed and summarized completed sessions
```json
{
  "session_id": "session-reference",
  "user_id": "firebase-user-uid",
  "summary": "AI-generated session summary",
  "analytics": {
    "mood_counts": {"happy": 3, "anxious": 1},
    "avg_intensity": 6.5,
    "emotion_counts": {"joy": 2, "worry": 1}
  },
  "created_at": "timestamp"
}
```

### `user_summaries`
Aggregated user analytics and overall summaries
```json
{
  "user_id": "firebase-user-uid",
  "overall_summary": "Comprehensive user progress summary",
  "avg_intensity": 7.2,
  "mood_totals": {"happy": 15, "sad": 3},
  "emotion_totals": {"joy": 12, "anxiety": 5}
}
```

## 🔐 Authentication

The application uses Firebase Authentication with JWT tokens:

- **Development Mode**: Authentication bypass with mock user data
- **Production Mode**: Required Bearer token validation
- **Token Format**: `Authorization: Bearer <firebase-id-token>`

## 🤖 AI Integration

### Gemini AI Features

1. **Follow-up Question Generation**
   - Analyzes conversation context
   - Generates empathetic, therapeutic questions
   - Encourages deeper emotional exploration

2. **Session Summarization**
   - Identifies main discussion topics
   - Extracts emotional insights
   - Provides professional session summaries

## 📈 API Endpoints

### Session Management
- `POST /session/` - Create new therapy session
- `POST /session/message` - Add message to session
- `POST /session/generate-question` - Get AI-generated follow-up question
- `POST /session/close` - Close session with analytics

### History & Analytics
- `GET /history/` - Get all user sessions
- `GET /history/session` - Get specific session details
- `GET /statistics/` - Get user statistics
- `GET /statistics/goals` - Get therapy goals
- `GET /statistics/mood-trends` - Get mood analytics

### System Endpoints
- `GET /` - API information
- `GET /health` - Health check for monitoring
- `GET /docs` - Interactive API documentation

## 🐳 Deployment

### Docker
```bash
# Build image
docker build -f ../docker/Dockerfile -t therapyapp-backend .

# Run container
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_key \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json \
  therapyapp-backend
```

### Google Cloud Run
See `../DEPLOYMENT.md` for comprehensive deployment instructions including:
- Google Cloud setup
- GitHub Actions CI/CD
- Secret management
- Production configuration

## 🧪 Testing

### Unit Tests
```bash
# Run basic import tests
python -c "from main import app; print('✅ FastAPI app loads successfully')"
python -c "from core.genkit_gemini import generate_followup_question; print('✅ AI integration loads successfully')"
```

### API Testing
```bash
# Health check
curl http://127.0.0.1:8000/health

# Create session (development mode)
curl -X POST http://127.0.0.1:8000/session/

# Test AI question generation
curl -X POST "http://127.0.0.1:8000/session/generate-question?session_id=your-session-id"
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENVIRONMENT` | Application environment | `dev` | No |
| `GEMINI_API_KEY` | Google Gemini AI API key | - | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Firebase service account key path | - | Yes |
| `SSL_CERT_FILE` | SSL certificate path | - | No |

### Development vs Production

**Development Mode** (`ENVIRONMENT=dev`):
- Authentication bypass enabled
- Detailed error messages
- CORS allows all origins
- Mock user data

**Production Mode** (`ENVIRONMENT=production`):
- Strict Firebase authentication
- Secure error handling
- Restricted CORS origins
- Full security measures

## 📝 Logging

The application uses Python's built-in logging with different levels:

- **INFO**: Normal operation events
- **DEBUG**: Development debugging (dev mode only)
- **WARNING**: Authentication issues, validation errors
- **ERROR**: Service failures, integration errors

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Add comprehensive tests
4. Update documentation
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: GitHub Issues for bug reports
- **Documentation**: `/docs` endpoint for API reference
- **Logs**: Check application logs for debugging information

---

**Built with ❤️ for better mental health support**