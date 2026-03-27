# StudySnap

Upload a photo of a problem. Get YouTube video snippets that teach the concepts — without spoiling the answer.

## Setup

### Prerequisites
- Node.js 20+
- Python 3.11+
- Gemini API key (https://ai.google.dev/)
- YouTube Data API v3 key (https://console.cloud.google.com/)

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your API keys in .env
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:3000

## API Keys

- **GEMINI_API_KEY**: Get from https://ai.google.dev/
- **YOUTUBE_API_KEY**: Enable "YouTube Data API v3" in Google Cloud Console, create an API key

## Environment Variables

| Variable | Service | Purpose |
|----------|---------|---------|
| `GEMINI_API_KEY` | Backend | Gemini 2.5-pro (analyze) + 2.0-flash (rank) |
| `YOUTUBE_API_KEY` | Backend | YouTube Data API v3 search |
| `NEXT_PUBLIC_API_URL` | Frontend | Points to backend (default: http://localhost:8000) |
