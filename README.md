# AI Counsellor

An AI-powered study abroad guidance platform that helps students navigate their journey through personalized university recommendations, realistic assessments, and guided application support.

## Features

- **4-Stage Journey**: Profile Building → University Discovery → Decision Finalization → Application Execution
- **AI Counsellor**: Natural language chat with GPT-4 for personalized guidance
- **Smart Matching**: Universities categorized as Dream/Target/Safe based on profile
- **Backend Guards**: Strict stage-based access control
- **Task Management**: AI-generated and manual application tasks

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, TypeScript
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: GPT-4o via OpenRouter with function calling

## Quick Start

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `database/schema.sql`
3. Copy your project URL and keys from Settings > API

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file and fill in values
cp .env.example .env
# Edit .env with your Supabase and OpenRouter keys

# Run the server
uvicorn main:app --reload
```

Backend will run at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy env file and fill in values
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Run the dev server
npm run dev
```

Frontend will run at `http://localhost:3000`

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
ai-counsellor/
├── frontend/                 # Next.js 14
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities
│   │   └── types/           # TypeScript types
│   └── package.json
│
├── backend/                  # FastAPI
│   ├── app/
│   │   ├── api/             # Route handlers
│   │   ├── core/            # Config, security, guards
│   │   ├── schemas/         # Pydantic models
│   │   └── services/        # Business logic
│   ├── main.py
│   └── requirements.txt
│
└── database/
    └── schema.sql           # Supabase schema
```

## API Endpoints

- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/onboarding` - Complete onboarding
- `GET /api/universities` - List universities
- `GET /api/universities/shortlist` - Get user's shortlist
- `POST /api/universities/shortlist` - Add to shortlist
- `POST /api/universities/lock/{id}` - Lock university
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `POST /api/counsellor/chat` - Chat with AI

## Stage System

1. **Profile (Stage 1)**: Complete onboarding
2. **Discover (Stage 2)**: Explore and shortlist universities
3. **Finalize (Stage 3)**: Lock universities for application
4. **Apply (Stage 4)**: Track tasks and deadlines

Stages advance automatically based on user actions.

## Backend Guards

The backend enforces strict rules that cannot be bypassed:

- Must complete onboarding before shortlisting
- Must shortlist before locking
- Must lock before creating university-specific tasks

## License

Built for the AI Hackathon 2025.
