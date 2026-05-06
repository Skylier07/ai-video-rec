# StudySnap

<a href="https://github.com/Skylier07/ai-video-rec"> <img alt="GitHub last commit (branch)" src="https://img.shields.io/github/last-commit/Skylier07/ai-video-rec/feat/backend-current-task"> </a>

StudySnap is a live chat and accurate video search chrome extension + website application. It utilizes Google's live-api for seemless interaction and overlay. It also serves as an accurate AI-powered YouTube search engine from questions using the extension overlay. Relying no longer on vague titles, but full context understanding through YouTube transcripts, giving users a combination of videos with exact timestamps to understand the needed concept ASAP without having to spend time on things outside of question scope. 
**Built for 2026 Google GLITCH 24 Hours Hackathon**

<img width="1920" height="1080" alt="Detection Gif" src="https://github.com/user-attachments/assets/53ef34b5-e4d1-465b-9355-904386c36951" />

### Inspiration

Before AI entered the market, when I feel stuck on a question (e.g. from my homework), I resort to finding YouTube videos online. If I have the option, I'd normally pick video explanation where the creator can draw and use animation freely over text as it makes it much easier for me to understand. Nowadays, students just send the entire question they don't understand to AI models, effectively "cheating" homework. While students can technically ask for a step by step guide, most struggle with textual learning and hence choose not to. However, if we ask modern models to find you videos that can help you solve the question, it often finds vague videos through it's title that can be hours long while all you really need are small snippets in the videos.

### What the application does
My tool aims to address this issue by incorporating live chat with transcript-loaded video recommendation with specified timestamps so Gemini can recommend exact video segments that you need to solve the question. Instead of giving you the answer right away, it hides the answer until the user attempts to gain understanding themselves through the videos recommended, encouraging users to fully learn the concept and fundamentals of the question without spending excess time on it.

### How it was built
The backend of the server is Fast API, the front end uses node.js, while the database is postgreSQL.
There are 3 gemini models used for the application. Gemini 3.1 Pro when users turn on accurate setting, Gemini 3.1 Flash when the user turn on the fast setting, and Gemini 3.1 Flash Live for live chat.
The tools I used to build this application includes Antigravity, Cursor, and Claude CLI, where the agents collaborate by defined, strict rules I laid out and they communicate responsibilites through their respective .md files.

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
