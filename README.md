# The Versatile Evaluator

**AI-Powered Universal Testing & Assessment Platform**

**Live:** [https://vulcanprep.in](https://vulcanprep.in)

Built for **Vulcan Learning Collective** — an intelligent exam platform that can grade any type of answer (text, voice, code, math) using AI that understands meaning, not just keywords.

---

## Features

### Multi-Domain Assessment
- **Text answers** — essays, letters, explanations with AI semantic grading
- **Coding questions** — in-browser code editor with Judge0 sandbox execution and test case validation
- **Voice answers** — mic recording with speech-to-text transcription + AI evaluation
- **MCQ, Fill-in-blanks, Matching, Multi-select** — deterministic auto-grading
- **Math & Aptitude** — logical reasoning evaluation with partial credit

### AI-Powered Grading Engine
- **Semantic understanding** — "50 km/h" = "fifty kilometers per hour"
- **Rubric switching** — auto-selects grading criteria based on question domain (English → grammar/tone, Math → accuracy/logic, Code → correctness/efficiency)
- **Partial credit** — rewards correct reasoning even if final answer is wrong
- **Diagnostic feedback** — not just a score, but exactly where and why marks were lost

### Smart Test Engine
- **Resume-aware question selection** — matches questions to candidate's skills and role
- **Role-domain mapping** — 40+ roles mapped to relevant question domains
- **Cross-folder scoring** — pulls best-fit questions across all published folders
- **Difficulty distribution** — enforces 30% easy, 50% medium, 20% hard

### Admin Dashboard
- **Question Bank** — create, edit, organize questions in folders with tags
- **AI Auto-Generate** — upload PDF/DOCX and AI generates questions automatically
- **Folder Management** — edit folder names, tags, publish/unpublish
- **Image & Audio support** — attach images (Google Drive/upload) and audio clips to questions
- **500+ seeded questions** — 50 folders across coding, aptitude, math, english, HR, communication

### Student Experience
- **Interview flow** — resume upload → role selection → AI-personalized test
- **Proctored testing** — webcam monitoring, fullscreen enforcement, tab-switch detection
- **One question at a time** — timer, progress tracking, question navigation
- **Instant results** — per-question rubric breakdown with AI feedback
- **Code execution** — write, run, and test code against test cases before submitting

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **Language** | TypeScript, React 19 |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Auth** | Clerk (role-based: admin/teacher/student) |
| **Database** | MongoDB with Mongoose |
| **AI (Primary)** | Google Gemini AI |
| **AI (Fallback)** | Groq (Llama) |
| **Code Execution** | Judge0 CE API (RapidAPI) |
| **Code Editor** | Monaco Editor (@monaco-editor/react) |
| **Math Rendering** | KaTeX |
| **Charts** | Recharts |
| **File Parsing** | pdf-parse, mammoth (DOCX) |
| **Audio Proxy** | Custom Google Drive proxy for CORS bypass |
| **Deployment** | Vercel |

---

## Project Structure

```
app/
├── admin/                  # Admin dashboard & auto-generate
├── student/
│   ├── dashboard/          # Student home
│   ├── interview/          # Resume upload + role selection
│   └── test/[id]/          # Test-taking interface
├── api/
│   ├── tests/start/        # Smart test engine (resume-aware)
│   ├── tests/[id]/answer/  # AI grading + code execution
│   ├── code/run/           # Run code against test cases
│   ├── questions/          # CRUD + auto-generate
│   ├── folders/            # Folder management
│   ├── ai/parse-resume/    # Resume parsing
│   ├── proxy/audio/        # Google Drive media proxy
│   └── upload/             # File uploads
components/
├── admin/                  # QuestionForm, QuestionTable, FolderManager
├── test/                   # CodeEditor, QuestionCard, ProctorProvider
├── shared/                 # AudioPlayer
└── ui/                     # BrandLoader, common UI
lib/
├── ai/                     # Evaluator, test question generator
├── code/                   # Judge0 executor
├── db/                     # MongoDB models (Question, Test, Folder, User)
└── utils/                  # URL helpers
scripts/
└── seed-questions.ts       # Seed 500 questions across 50 folders
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB database
- API keys: Clerk, Google Gemini, Groq, Judge0 (RapidAPI)

### Setup

```bash
git clone https://github.com/Aditya1156/HackForHire.git
cd HackForHire
npm install
```

Create `.env.local`:

```env
MONGODB_URI=your_mongodb_uri
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
JUDGE0_API_KEY=your_judge0_rapidapi_key
```

### Run

```bash
npm run dev          # Start dev server (Turbopack)
npm run seed         # Seed 500 questions into database
npm run build        # Production build
```

---

## How It Works

```
Student uploads resume → Selects role → Starts test
                                            ↓
              Smart engine scores questions by resume + role relevance
                                            ↓
                    Student answers (text / code / voice / MCQ)
                                            ↓
              ┌─────────────┬──────────────┬──────────────┐
              │   Text/Voice │    Code      │   MCQ/Match  │
              │   → AI eval  │ → Judge0 run │ → Exact match│
              │   + rubric   │ + AI review  │   scoring    │
              └─────────────┴──────────────┴──────────────┘
                                            ↓
                  Score + diagnostic feedback per criterion
```

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/tests/start` | Start test with smart question selection |
| POST | `/api/tests/[id]/answer` | Submit answer for AI grading |
| POST | `/api/code/run` | Run code against test cases |
| GET/POST | `/api/questions` | CRUD questions |
| POST | `/api/questions/auto-generate` | AI generate from PDF/DOCX |
| GET/POST | `/api/folders` | Manage question folders |
| POST | `/api/ai/parse-resume` | Parse resume for skills extraction |
| GET | `/api/proxy/audio` | Proxy Google Drive media |

---

## Team

Built for **Vulcan Learning Collective** hackathon — empowering 21,000+ learners with AI-driven assessment that coaches, not just proctors.

---

## License

MIT
