# Versatile Evaluator — Demo Guide

**Hackathon:** Anvesana Hack for Hire — Vulcan Learning Collective LLP
**Built by:** Stark (CTO, TheNextURL — Shivamogga, Karnataka, India)

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Create `.env.local` at project root:
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/versatile-evaluator?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ANTHROPIC_API_KEY=sk-ant-api03-xxxx
JUDGE0_API_KEY=your-rapidapi-key-for-judge0
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Seed the database
```bash
npm run seed
```

### 4. Start development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

| Role    | Email                | Password    |
|---------|----------------------|-------------|
| Student | student@test.com     | student123  |
| Admin   | admin@test.com       | admin123    |
| Teacher | teacher@test.com     | teacher123  |

---

## Feature Overview

### Phase 1 — Foundation
- Next.js 15 App Router setup with TypeScript + Tailwind CSS
- MongoDB + Mongoose ODM with all models (User, Question, QuestionFolder, Test, Interview)
- JWT auth with httpOnly cookies, bcrypt password hashing
- `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Landing page, login page, register page

### Phase 2 — Admin Panel (Question Management)
- `/admin/questions` — List, filter, search all questions
- `/admin/questions/new` — Create questions with rubric criteria builder
- `/admin/folders` — Create and manage question folders
- Role-based access (admin only)

### Phase 3 — Test Engine
- `/student/test` — Start a test: choose folder/domain
- `/api/tests/start` — Initialises a test session in MongoDB
- `/api/tests/[id]` — Fetch questions for a test
- `/api/ai/evaluate` — Claude-powered rubric-based grading (per question)
- `/api/ai/evaluate-batch` — Batch final evaluation + feedback
- `/api/tests/[id]` PATCH — Submit final test + AIRS score
- `/student/test/[id]` — Live test UI (Monaco editor for code, voice input, KaTeX for math)

### Phase 4 — Interview Engine
- `/student/interview` — Setup interview: role, mode (technical/HR/mixed), resume upload
- `/api/ai/parse-resume` — Claude parses resume text into structured JSON
- `/api/interviews/start` — Creates interview session
- `/api/interviews/[id]` — AI-powered conversation endpoint (cross-question follow-ups)
- AIRS score calculation (6 dimensions: resume strength, communication, technical knowledge, coding ability, problem solving, professional tone)

### Phase 5 — Teacher Review Panel
- `/teacher/dashboard` — All completed tests with filters (domain, status, pagination)
- `/teacher/review/[id]` — Detailed test review: per-question scores, AI feedback, override scores
- `/api/teacher/tests` — List all tests (teacher/admin)
- `/api/teacher/tests/[id]` — Fetch test details
- `/api/teacher/rubrics` — Submit override scores and comments

### Phase 6 — Dashboards + Polish (this phase)
- `/student/dashboard` — Student home: stats, progress chart, domain breakdown, recent tests/interviews
- `/admin` + `/admin/dashboard` — Admin overview: user stats, domain distribution, score distribution pie chart, top students leaderboard, recent activity
- `/api/dashboard/student` — Student dashboard data API
- `/api/dashboard/admin` — Admin dashboard data API
- `middleware.ts` — Edge-compatible route protection (cookie presence check)
- `app/not-found.tsx` — Styled 404 page
- `app/error.tsx` — Global error boundary
- `app/loading.tsx` — Global loading spinner

---

## Architecture Highlights

- **Rubric-switching AI** — Claude API with different system prompts per domain (English tone analysis, Math strict evaluation, HR STAR method, Coding complexity analysis)
- **AIRS Score** — Branded composite score (Adaptive Interview Rating Score) across 6 dimensions
- **Voice input** — Browser Web Speech API, works in Hindi/Kannada
- **Monaco Editor** — Live code editor with Judge0 API execution
- **Partial credit** — AI awards partial scores with per-criteria breakdown and explanations
- **Teacher override** — Teachers can manually adjust AI scores with comments
- **Responsive UI** — Full mobile support with collapsible sidebar

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Database | MongoDB + Mongoose |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Auth | JWT + bcryptjs + httpOnly cookies |
| Validation | Zod |
| Charts | Recharts |
| Code Editor | Monaco Editor |
| Code Execution | Judge0 API (RapidAPI) |
| Math Rendering | KaTeX |
| Icons | Lucide React |
| Resume Parsing | pdf-parse |
| Voice | Web Speech API (browser-native) |
