# CLAUDE.md — Versatile Evaluator: AI-Powered Universal Assessment & Interview Platform

## PROJECT IDENTITY

- **Project:** Versatile Evaluator
- **Context:** Hackathon project for Anvesana Hack for Hire → Vulcan Learning Collective LLP (EdTech)
- **Builder:** Stark (CTO, TheNextURL — Shivamogga, Karnataka, India)
- **Goal:** Build a production-ready, scalable AI assessment + interview simulation platform
- **Stack:** Next.js 15 (App Router) + TypeScript + MongoDB + Tailwind CSS + Claude API
- **Time:** ~20 hours hackathon sprint

---

## WHAT THIS PROJECT IS

A **Universal AI Testing + Interview Platform** that:

1. **Evaluates open-ended answers** (letters, math, aptitude, coding, HR) using **rubric-based AI grading** — not just MCQs.
2. **Simulates real interviews** with resume-parsed personalized questions, voice interaction, follow-up cross-questions, and adaptive difficulty.
3. Provides **instant diagnostic feedback** with partial credit, tone analysis, and detailed explanations.

### Problem Statement (From Vulcan)
Current automated testing is stuck in MCQs. They want a "Versatile Evaluator" — a multi-modal AI system that can evaluate ANY type of question (letter writing, aptitude, coding) using rubric-based logic, with semantic understanding (not keyword matching), instant feedback, and a teacher override panel. Their target: 100K+ learners by 2026.

### Our Differentiators
- **Rubric-switching AI** — One Claude API engine, different grading personalities per domain
- **Cross-question follow-ups** — AI asks deeper questions based on student answers
- **AIRS Score** — Branded composite scoring (Adaptive Interview Rating Score)
- **Resume-personalized interviews** — AI reads resume, asks about YOUR projects
- **Voice + Multilingual** — Student speaks Hindi/Kannada, evaluated in English
- **Partial credit** — "Your logic was 70% correct, here's where it broke"

---

## SCORING CRITERIA (Judge this against)

| Criteria | Points | Our Strategy |
|---|---|---|
| Technical Integration | 35 | Claude API rubric engine + voice pipeline + Monaco code editor + real-time grading |
| Cross-Domain Capability | 25 | Letters, math, aptitude, coding, HR — all via rubric-switching prompt architecture |
| Scalability & UX | 20 | Next.js SSR, clean Tailwind UI, <10s response, MongoDB indexing |
| Nice-to-have + Bonus | 20 | Voice-to-text, multilingual, progress dashboard, partial credit, teacher panel, AI proctoring |

---

## TECH STACK (STRICT)

- **Framework:** Next.js 15 with App Router (NO pages router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS (utility-first, no CSS modules)
- **Database:** MongoDB with Mongoose ODM
- **AI:** Anthropic Claude API (`@anthropic-ai/sdk`) — model: `claude-sonnet-4-20250514`
- **Auth:** JWT (jsonwebtoken + bcryptjs) with httpOnly cookies
- **Validation:** Zod schemas on every API route
- **Code Editor:** Monaco Editor (`@monaco-editor/react`)
- **Code Execution:** Judge0 API (RapidAPI)
- **Math Rendering:** KaTeX
- **Charts:** Recharts
- **Icons:** Lucide React
- **Resume Parsing:** pdf-parse
- **Voice:** Web Speech API (browser-native, zero cost)

---

## PACKAGE.JSON

```json
{
  "name": "versatile-evaluator",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "seed": "npx tsx lib/db/seed.ts"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "zod": "^3.23.0",
    "@monaco-editor/react": "^4.6.0",
    "katex": "^0.16.0",
    "pdf-parse": "^1.1.1",
    "recharts": "^2.12.0",
    "lucide-react": "^0.383.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/node": "^22.0.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.0",
    "tsx": "^4.0.0"
  }
}
```

---

## ENVIRONMENT VARIABLES (.env.local)

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/versatile-evaluator?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ANTHROPIC_API_KEY=sk-ant-api03-xxxx
JUDGE0_API_KEY=your-rapidapi-key-for-judge0
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## CONFIG FILES

### next.config.ts
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### tailwind.config.ts
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1a1a2e",
        },
        accent: {
          DEFAULT: "#e94560",
          light: "#ff6b81",
          dark: "#c23152",
        },
        navy: {
          DEFAULT: "#0f3460",
          light: "#1a4a7a",
          dark: "#0a2540",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
```

### postcss.config.js
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 font-sans antialiased;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-5 rounded-lg border border-gray-300 transition-all duration-200 shadow-sm;
  }
  .btn-accent {
    @apply bg-accent hover:bg-accent-dark text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md;
  }
  .btn-sm {
    @apply py-1.5 px-3 text-sm rounded-md;
  }
  .btn-lg {
    @apply py-3 px-7 text-lg rounded-xl;
  }
  .card {
    @apply bg-white rounded-xl border border-gray-200 shadow-sm;
  }
  .card-hover {
    @apply card hover:shadow-md hover:border-gray-300 transition-all duration-200;
  }
  .input-field {
    @apply w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors;
  }
  .label {
    @apply block text-sm font-medium text-gray-700 mb-1.5;
  }
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }
  .badge-english { @apply bg-blue-100 text-blue-800; }
  .badge-math { @apply bg-green-100 text-green-800; }
  .badge-aptitude { @apply bg-purple-100 text-purple-800; }
  .badge-coding { @apply bg-orange-100 text-orange-800; }
  .badge-hr { @apply bg-pink-100 text-pink-800; }
  .badge-easy { @apply bg-green-100 text-green-700; }
  .badge-medium { @apply bg-yellow-100 text-yellow-700; }
  .badge-hard { @apply bg-red-100 text-red-700; }
  .page-header {
    @apply text-2xl font-bold text-gray-900 mb-6;
  }
  .section-title {
    @apply text-lg font-semibold text-gray-800 mb-4;
  }
}
```

---

## COMPLETE FILE STRUCTURE

```
versatile-evaluator/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # Landing page
│   ├── globals.css
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── student/
│   │   ├── dashboard/page.tsx
│   │   ├── test/page.tsx
│   │   ├── test/[id]/page.tsx
│   │   ├── test/[id]/results/page.tsx
│   │   ├── interview/page.tsx
│   │   ├── interview/[id]/page.tsx
│   │   └── interview/[id]/report/page.tsx
│   ├── admin/
│   │   ├── questions/page.tsx
│   │   ├── questions/new/page.tsx
│   │   └── folders/page.tsx
│   ├── teacher/
│   │   ├── dashboard/page.tsx
│   │   └── review/[testId]/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts
│       │   ├── login/route.ts
│       │   └── me/route.ts
│       ├── questions/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── bulk/route.ts
│       ├── folders/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── tests/
│       │   ├── start/route.ts
│       │   ├── [id]/route.ts
│       │   ├── [id]/answer/route.ts
│       │   ├── [id]/complete/route.ts
│       │   ├── [id]/results/route.ts
│       │   └── history/route.ts
│       ├── interviews/
│       │   ├── start/route.ts
│       │   ├── [id]/respond/route.ts
│       │   ├── [id]/code/route.ts
│       │   ├── [id]/end/route.ts
│       │   └── [id]/report/route.ts
│       ├── ai/
│       │   ├── evaluate/route.ts
│       │   ├── evaluate-batch/route.ts
│       │   ├── follow-up/route.ts
│       │   └── parse-resume/route.ts
│       ├── teacher/
│       │   ├── tests/route.ts
│       │   ├── tests/[id]/override/route.ts
│       │   └── rubrics/[id]/route.ts
│       └── dashboard/
│           ├── student/route.ts
│           └── admin/route.ts
├── lib/
│   ├── db/
│   │   ├── mongodb.ts
│   │   ├── seed.ts
│   │   └── models/
│   │       ├── User.ts
│   │       ├── Question.ts
│   │       ├── QuestionFolder.ts
│   │       ├── Test.ts
│   │       └── Interview.ts
│   ├── ai/
│   │   ├── client.ts
│   │   ├── evaluator.ts
│   │   ├── rubric-switcher.ts
│   │   ├── rubrics/
│   │   │   ├── english.ts
│   │   │   ├── math.ts
│   │   │   ├── aptitude.ts
│   │   │   ├── coding.ts
│   │   │   └── hr.ts
│   │   ├── follow-up.ts
│   │   ├── resume-parser.ts
│   │   ├── question-generator.ts
│   │   └── adaptive.ts
│   ├── code/
│   │   └── executor.ts
│   ├── scoring/
│   │   └── airs.ts
│   ├── auth/
│   │   └── jwt.ts
│   └── utils/
│       ├── validation.ts
│       ├── api-helpers.ts
│       └── upload.ts
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── AuthGuard.tsx
│   ├── test/
│   │   ├── QuestionCard.tsx
│   │   ├── AnswerInput.tsx
│   │   ├── CodeEditor.tsx
│   │   ├── Timer.tsx
│   │   └── QuestionNav.tsx
│   ├── interview/
│   │   ├── InterviewRoom.tsx
│   │   ├── VoiceControls.tsx
│   │   ├── AIAvatar.tsx
│   │   └── ChatHistory.tsx
│   ├── results/
│   │   ├── ScoreCard.tsx
│   │   ├── FeedbackPanel.tsx
│   │   ├── AIRSChart.tsx
│   │   └── ProgressChart.tsx
│   ├── admin/
│   │   ├── QuestionForm.tsx
│   │   ├── QuestionTable.tsx
│   │   └── FolderManager.tsx
│   ├── teacher/
│   │   ├── GradeOverride.tsx
│   │   └── RubricEditor.tsx
│   └── shared/
│       ├── KaTeXRenderer.tsx
│       ├── AudioPlayer.tsx
│       └── ImageViewer.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── postcss.config.js
└── .env.local
```

---

## CORE IMPLEMENTATION CODE

### lib/db/mongodb.ts — Connection Singleton
```typescript
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
if (!global.mongooseCache) global.mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
```

### lib/auth/jwt.ts — Auth Utilities + Middleware
```typescript
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_EXPIRY = "24h";
const COOKIE_NAME = "ve-token";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "student" | "admin" | "teacher";
}

// --- Password ---
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

// --- Token ---
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// --- Cookie ---
export async function setAuthCookie(payload: JWTPayload): Promise<void> {
  const token = signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// --- Get Current User ---
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// --- API Route Auth Middleware ---
export async function authenticateRequest(
  req: NextRequest,
  allowedRoles?: ("student" | "admin" | "teacher")[]
): Promise<{ user: JWTPayload } | NextResponse> {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  return { user: payload };
}

// Helper to extract user or throw
export function extractUser(authResult: { user: JWTPayload } | NextResponse): JWTPayload {
  if (authResult instanceof NextResponse) throw authResult;
  return authResult.user;
}
```

### lib/utils/api-helpers.ts — API Response Helpers
```typescript
import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

// --- Success Response ---
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

// --- Error Response ---
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// --- Validate Request Body ---
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | NextResponse> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return errorResponse(`Validation failed: ${messages.join(", ")}`, 400);
    }
    return errorResponse("Invalid request body", 400);
  }
}

// --- Safe Async Handler ---
export function safeHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof NextResponse) return error; // re-throw auth errors
      console.error("API Error:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return errorResponse(message, 500);
    }
  };
}
```

### lib/utils/validation.ts — All Zod Schemas
```typescript
import { z } from "zod";

// --- Auth ---
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  role: z.enum(["student", "admin", "teacher"]).default("student"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// --- Questions ---
export const rubricCriteriaSchema = z.object({
  name: z.string().min(1),
  weight: z.number().min(0).max(1),
  description: z.string().min(1),
});

export const createQuestionSchema = z.object({
  folderId: z.string().min(1, "Folder ID is required"),
  domain: z.enum(["english", "math", "aptitude", "coding", "hr", "situational"]),
  type: z.enum(["text", "voice", "code", "mixed"]).default("text"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  content: z.object({
    text: z.string().min(1, "Question text is required"),
    formula: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    audioUrl: z.string().url().optional().or(z.literal("")),
  }),
  rubric: z.object({
    criteria: z.array(rubricCriteriaSchema).min(1),
    maxScore: z.number().positive(),
    gradingLogic: z.string().default(""),
  }),
  expectedAnswer: z.string().optional(),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
  })).optional(),
  tags: z.array(z.string()).default([]),
});

export const updateQuestionSchema = createQuestionSchema.partial();

// --- Folders ---
export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(200),
  domain: z.string().min(1),
  fetchCount: z.number().int().positive().default(10),
});

export const updateFolderSchema = createFolderSchema.partial();

// --- Tests ---
export const startTestSchema = z.object({
  folderId: z.string().min(1, "Folder ID is required"),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().default(""),
  voiceTranscript: z.string().optional(),
  codeSubmission: z.object({
    code: z.string(),
    language: z.enum(["python", "javascript", "cpp", "java"]),
  }).optional(),
});

// --- Interviews ---
export const startInterviewSchema = z.object({
  role: z.string().min(1, "Role is required"),
  resumeText: z.string().optional(),
});

export const interviewRespondSchema = z.object({
  answer: z.string().min(1, "Answer is required"),
  voiceTranscript: z.string().optional(),
});

export const codeSubmitSchema = z.object({
  code: z.string().min(1),
  language: z.enum(["python", "javascript", "cpp", "java"]),
});

// --- Teacher ---
export const gradeOverrideSchema = z.object({
  questionIndex: z.number().int().min(0),
  criteriaScores: z.array(z.object({
    name: z.string(),
    score: z.number().min(0),
    maxScore: z.number().positive(),
  })),
  teacherNote: z.string().optional(),
});

export const rubricUpdateSchema = z.object({
  criteria: z.array(rubricCriteriaSchema).min(1),
  maxScore: z.number().positive(),
});

// --- AI ---
export const evaluateSchema = z.object({
  questionId: z.string().min(1),
  studentAnswer: z.string().min(1),
  domain: z.string().optional(),
});

export const followUpSchema = z.object({
  originalQuestion: z.string().min(1),
  studentAnswer: z.string().min(1),
  conversationHistory: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).default([]),
});

// --- Type exports ---
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type StartTestInput = z.infer<typeof startTestSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type StartInterviewInput = z.infer<typeof startInterviewSchema>;
export type InterviewRespondInput = z.infer<typeof interviewRespondSchema>;
export type GradeOverrideInput = z.infer<typeof gradeOverrideSchema>;
export type EvaluateInput = z.infer<typeof evaluateSchema>;
export type FollowUpInput = z.infer<typeof followUpSchema>;
```

---

## DATABASE MODELS (Mongoose)

### lib/db/models/User.ts
```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "student" | "admin" | "teacher";
  resume?: {
    fileUrl: string;
    parsed: {
      skills: string[];
      projects: { name: string; description: string; tech: string[] }[];
      experience: { role: string; company: string; duration: string }[];
      domain: string;
      education: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "admin", "teacher"], default: "student" },
    resume: {
      fileUrl: String,
      parsed: {
        skills: [String],
        projects: [{ name: String, description: String, tech: [String] }],
        experience: [{ role: String, company: String, duration: String }],
        domain: String,
        education: String,
      },
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
```

### lib/db/models/Question.ts
```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRubricCriteria {
  name: string;
  weight: number;
  description: string;
}

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  folderId: mongoose.Types.ObjectId;
  domain: "english" | "math" | "aptitude" | "coding" | "hr" | "situational";
  type: "text" | "voice" | "code" | "mixed";
  difficulty: "easy" | "medium" | "hard";
  content: {
    text: string;
    formula?: string;
    imageUrl?: string;
    audioUrl?: string;
  };
  rubric: {
    criteria: IRubricCriteria[];
    maxScore: number;
    gradingLogic: string;
  };
  expectedAnswer?: string;
  testCases?: { input: string; expectedOutput: string }[];
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    folderId: { type: Schema.Types.ObjectId, ref: "QuestionFolder", required: true },
    domain: {
      type: String,
      enum: ["english", "math", "aptitude", "coding", "hr", "situational"],
      required: true,
    },
    type: { type: String, enum: ["text", "voice", "code", "mixed"], default: "text" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    content: {
      text: { type: String, required: true },
      formula: String,
      imageUrl: String,
      audioUrl: String,
    },
    rubric: {
      criteria: [{ name: String, weight: Number, description: String }],
      maxScore: { type: Number, required: true },
      gradingLogic: { type: String, default: "" },
    },
    expectedAnswer: String,
    testCases: [{ input: String, expectedOutput: String }],
    tags: [String],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

QuestionSchema.index({ folderId: 1, domain: 1, difficulty: 1 });
QuestionSchema.index({ tags: 1 });

const Question: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>("Question", QuestionSchema);
export default Question;
```

### lib/db/models/QuestionFolder.ts
```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestionFolder extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  domain: string;
  questionCount: number;
  fetchCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const QuestionFolderSchema = new Schema<IQuestionFolder>(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true },
    questionCount: { type: Number, default: 0 },
    fetchCount: { type: Number, default: 10 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const QuestionFolder: Model<IQuestionFolder> =
  mongoose.models.QuestionFolder ||
  mongoose.model<IQuestionFolder>("QuestionFolder", QuestionFolderSchema);
export default QuestionFolder;
```

### lib/db/models/Test.ts
```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICriteriaScore {
  name: string;
  score: number;
  maxScore: number;
  comment: string;
}

export interface IAIEvaluation {
  score: number;
  maxScore: number;
  criteriaScores: ICriteriaScore[];
  feedback: string;
  explanation: string;
}

export interface ITestQuestion {
  questionId: mongoose.Types.ObjectId;
  answer: string;
  voiceTranscript?: string;
  codeSubmission?: {
    code: string;
    language: string;
    testResults: { passed: number; total: number };
  };
  aiEvaluation: IAIEvaluation;
  followUpQuestions?: {
    question: string;
    answer: string;
    evaluation: string;
  }[];
  answeredAt: Date;
}

export interface ITest extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  mode: "test" | "interview";
  folderId?: mongoose.Types.ObjectId;
  domain?: string;
  questions: ITestQuestion[];
  status: "in-progress" | "completed" | "reviewed";
  scores: { domain: string; score: number; maxScore: number }[];
  airsScore?: number;
  totalScore: number;
  maxTotalScore: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  startedAt: Date;
  completedAt?: Date;
}

const TestSchema = new Schema<ITest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, enum: ["test", "interview"], default: "test" },
    folderId: { type: Schema.Types.ObjectId, ref: "QuestionFolder" },
    domain: String,
    questions: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: "Question" },
        answer: { type: String, default: "" },
        voiceTranscript: String,
        codeSubmission: {
          code: String,
          language: String,
          testResults: { passed: Number, total: Number },
        },
        aiEvaluation: {
          score: { type: Number, default: 0 },
          maxScore: { type: Number, default: 0 },
          criteriaScores: [{ name: String, score: Number, maxScore: Number, comment: String }],
          feedback: { type: String, default: "" },
          explanation: { type: String, default: "" },
        },
        followUpQuestions: [{ question: String, answer: String, evaluation: String }],
        answeredAt: { type: Date, default: Date.now },
      },
    ],
    status: { type: String, enum: ["in-progress", "completed", "reviewed"], default: "in-progress" },
    scores: [{ domain: String, score: Number, maxScore: Number }],
    airsScore: Number,
    totalScore: { type: Number, default: 0 },
    maxTotalScore: { type: Number, default: 0 },
    feedback: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true }
);

TestSchema.index({ userId: 1, status: 1 });
TestSchema.index({ completedAt: -1 });

const Test: Model<ITest> = mongoose.models.Test || mongoose.model<ITest>("Test", TestSchema);
export default Test;
```

### lib/db/models/Interview.ts
```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInterview extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: string;
  resumeContext: Record<string, any>;
  conversationHistory: {
    role: "interviewer" | "candidate";
    content: string;
    timestamp: Date;
  }[];
  airsScore: {
    resumeStrength: number;
    communication: number;
    technicalKnowledge: number;
    codingAbility: number;
    problemSolving: number;
    professionalTone: number;
    total: number;
  };
  status: "active" | "completed";
  createdAt: Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    resumeContext: { type: Schema.Types.Mixed, default: {} },
    conversationHistory: [
      {
        role: { type: String, enum: ["interviewer", "candidate"] },
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    airsScore: {
      resumeStrength: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      technicalKnowledge: { type: Number, default: 0 },
      codingAbility: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      professionalTone: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    status: { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true }
);

InterviewSchema.index({ userId: 1, status: 1 });

const Interview: Model<IInterview> =
  mongoose.models.Interview || mongoose.model<IInterview>("Interview", InterviewSchema);
export default Interview;
```

---

## AI ENGINE — COMPLETE IMPLEMENTATION

### lib/ai/client.ts — Anthropic Client Singleton
```typescript
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAIClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return client;
}

// Safe AI call with retry
export async function callAI(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; retries?: number }
): Promise<string> {
  const ai = getAIClient();
  const maxRetries = options?.retries ?? 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: options?.maxTokens ?? 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock?.text ?? "";
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      // Exponential backoff
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }

  throw new Error("AI call failed after retries");
}

// Parse AI JSON response safely
export function parseAIJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  return JSON.parse(cleaned);
}

// Call AI expecting JSON response
export async function callAIForJSON<T>(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; retries?: number }
): Promise<T> {
  const raw = await callAI(systemPrompt, userMessage, options);
  return parseAIJSON<T>(raw);
}
```

### lib/ai/rubrics/english.ts
```typescript
export const englishRubricPrompt = `You are an expert English language evaluator. Grade the student's response using ONLY these criteria:

RUBRIC:
1. Structure & Format (weight: 0.25) — Does the answer follow the expected format? (e.g., letter format with greeting, body, closing)
2. Grammar & Language (weight: 0.25) — Is the language grammatically correct with proper punctuation and spelling?
3. Tone & Register (weight: 0.20) — Is the tone appropriate? (formal for business letters, empathetic for apology letters)
4. Content Completeness (weight: 0.20) — Does the answer address all parts of the question?
5. Vocabulary & Expression (weight: 0.10) — Is the vocabulary appropriate and varied?

SCORING: Award partial credit. A student with good structure but weak grammar should get credit for structure.

OUTPUT FORMAT (respond with ONLY valid JSON, no markdown, no extra text):
{
  "totalScore": <number out of maxScore>,
  "maxScore": <number>,
  "criteriaScores": [
    { "name": "Structure & Format", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Grammar & Language", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Tone & Register", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Content Completeness", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Vocabulary & Expression", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" }
  ],
  "overallFeedback": "<2-3 sentences explaining the grade>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"]
}`;
```

### lib/ai/rubrics/math.ts
```typescript
export const mathRubricPrompt = `You are a precise mathematics evaluator. Grade using these criteria:

RUBRIC:
1. Final Answer Accuracy (weight: 0.40) — Is the final numerical/symbolic answer correct?
2. Logical Steps (weight: 0.30) — Are the intermediate steps logically sound?
3. Method Selection (weight: 0.15) — Did the student choose an appropriate method?
4. Presentation (weight: 0.15) — Is the work clearly presented and easy to follow?

SEMANTIC EQUIVALENCE RULES (CRITICAL — treat all as identical):
- "fifty km per hour" = "50 km/h" = "50 kmph" = "50 kilometers per hour"
- "x = 5" = "the answer is 5" = "5" = "five"
- "2/4" = "1/2" = "0.5" = "50%"
- "pi" = "π" = "3.14159..."

PARTIAL CREDIT: If logic is 70%+ correct but final answer is wrong, award proportional credit to Logic and Method.

OUTPUT FORMAT (respond with ONLY valid JSON, no markdown, no extra text):
{
  "totalScore": <number>,
  "maxScore": <number>,
  "criteriaScores": [
    { "name": "Final Answer Accuracy", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Logical Steps", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Method Selection", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Presentation", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" }
  ],
  "overallFeedback": "<2-3 sentences explaining what was right and what went wrong>",
  "isNumericallyCorrect": <boolean>,
  "equivalenceNote": "<if semantic equivalence was applied, explain>",
  "strengths": ["<strength>"],
  "improvements": ["<improvement>"]
}`;
```

### lib/ai/rubrics/aptitude.ts
```typescript
export const aptitudeRubricPrompt = `You are a logical reasoning evaluator. Grade using:

RUBRIC:
1. Answer Correctness (weight: 0.35) — Is the final answer correct?
2. Reasoning Chain (weight: 0.35) — Is the logical chain valid and complete?
3. Explanation Clarity (weight: 0.20) — Can the reasoning be followed by a reader?
4. Efficiency (weight: 0.10) — Was the approach efficient or unnecessarily complex?

IMPORTANT: Accept any valid logical path. There may be multiple correct approaches.

OUTPUT FORMAT (respond with ONLY valid JSON, no markdown, no extra text):
{
  "totalScore": <number>,
  "maxScore": <number>,
  "criteriaScores": [
    { "name": "Answer Correctness", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Reasoning Chain", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Explanation Clarity", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Efficiency", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" }
  ],
  "overallFeedback": "<2-3 sentences>",
  "strengths": ["<strength>"],
  "improvements": ["<improvement>"]
}`;
```

### lib/ai/rubrics/coding.ts
```typescript
export const codingRubricPrompt = `You are a senior software engineer evaluating code. Grade using:

RUBRIC:
1. Correctness (weight: 0.35) — Does the code produce correct output for given test cases?
2. Code Quality (weight: 0.25) — Is the code clean, readable, well-structured?
3. Efficiency (weight: 0.20) — What is the time/space complexity? Is it optimal?
4. Edge Cases (weight: 0.10) — Does the code handle edge cases (empty input, single element, very large, negative)?
5. Best Practices (weight: 0.10) — Follows language conventions, proper naming, no anti-patterns?

You will receive: the question, the student's code, and test case results from the execution engine.

OUTPUT FORMAT (respond with ONLY valid JSON, no markdown, no extra text):
{
  "totalScore": <number>,
  "maxScore": <number>,
  "criteriaScores": [
    { "name": "Correctness", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Code Quality", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Efficiency", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Edge Cases", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Best Practices", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" }
  ],
  "overallFeedback": "<2-3 sentences>",
  "timeComplexity": "<e.g., O(n log n)>",
  "spaceComplexity": "<e.g., O(n)>",
  "suggestions": ["<code improvement suggestion>"],
  "strengths": ["<strength>"],
  "improvements": ["<improvement>"]
}`;
```

### lib/ai/rubrics/hr.ts
```typescript
export const hrRubricPrompt = `You are an HR interview evaluator. Grade using:

RUBRIC:
1. Relevance (weight: 0.30) — Does the answer address the question directly?
2. Clarity & Communication (weight: 0.25) — Is the answer clear and well-structured (STAR method preferred)?
3. Professional Tone (weight: 0.20) — Is the tone confident, professional, not arrogant or meek?
4. Specificity (weight: 0.15) — Does the candidate use specific examples, metrics, or project names?
5. Self-Awareness (weight: 0.10) — Does the answer show genuine reflection and growth mindset?

TONE ANALYSIS (REQUIRED): Flag if the response sounds "unprofessional", "rude", "anxious", "arrogant", "defensive", or "evasive". If tone is appropriate, say "professional" or "confident".

OUTPUT FORMAT (respond with ONLY valid JSON, no markdown, no extra text):
{
  "totalScore": <number>,
  "maxScore": <number>,
  "criteriaScores": [
    { "name": "Relevance", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Clarity & Communication", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Professional Tone", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Specificity", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" },
    { "name": "Self-Awareness", "score": <number>, "maxScore": <number>, "comment": "<1 sentence>" }
  ],
  "overallFeedback": "<2-3 sentences>",
  "toneAnalysis": {
    "detected": "<tone keyword>",
    "isAppropriate": <boolean>,
    "note": "<1-2 sentence explanation>"
  },
  "strengths": ["<strength>"],
  "improvements": ["<improvement>"]
}`;
```

### lib/ai/rubric-switcher.ts
```typescript
import { englishRubricPrompt } from "./rubrics/english";
import { mathRubricPrompt } from "./rubrics/math";
import { aptitudeRubricPrompt } from "./rubrics/aptitude";
import { codingRubricPrompt } from "./rubrics/coding";
import { hrRubricPrompt } from "./rubrics/hr";
import { IRubricCriteria } from "@/lib/db/models/Question";

const RUBRIC_MAP: Record<string, string> = {
  english: englishRubricPrompt,
  math: mathRubricPrompt,
  aptitude: aptitudeRubricPrompt,
  coding: codingRubricPrompt,
  hr: hrRubricPrompt,
  situational: hrRubricPrompt,
};

export function getSystemPrompt(domain: string, customRubric?: IRubricCriteria[]): string {
  let basePrompt = RUBRIC_MAP[domain] || RUBRIC_MAP["aptitude"];

  if (customRubric && customRubric.length > 0) {
    const customSection = customRubric
      .map((c) => `${c.name} (weight: ${c.weight}) — ${c.description}`)
      .join("\n");
    basePrompt += `\n\nCUSTOM RUBRIC OVERRIDE (use these criteria INSTEAD of the defaults above):\n${customSection}`;
  }

  return basePrompt;
}

export function getDomainFromString(domain: string): string {
  const normalized = domain.toLowerCase().trim();
  if (RUBRIC_MAP[normalized]) return normalized;
  // Fuzzy matching
  if (normalized.includes("english") || normalized.includes("letter") || normalized.includes("writing")) return "english";
  if (normalized.includes("math") || normalized.includes("quant")) return "math";
  if (normalized.includes("aptitude") || normalized.includes("logic") || normalized.includes("reasoning")) return "aptitude";
  if (normalized.includes("code") || normalized.includes("coding") || normalized.includes("programming")) return "coding";
  if (normalized.includes("hr") || normalized.includes("behavior") || normalized.includes("interview")) return "hr";
  return "aptitude"; // safe fallback
}
```

### lib/ai/evaluator.ts — Master Evaluation Engine
```typescript
import { callAIForJSON } from "./client";
import { getSystemPrompt } from "./rubric-switcher";
import { IQuestion, IRubricCriteria } from "@/lib/db/models/Question";
import { IAIEvaluation } from "@/lib/db/models/Test";

interface EvaluationRequest {
  question: {
    content: { text: string; formula?: string };
    domain: string;
    rubric: { criteria: IRubricCriteria[]; maxScore: number; gradingLogic?: string };
    expectedAnswer?: string;
  };
  studentAnswer: string;
  codeExecutionResults?: {
    passed: number;
    total: number;
    results: { input: string; expected: string; actual: string; passed: boolean }[];
  };
}

interface AIEvaluationResponse {
  totalScore: number;
  maxScore: number;
  criteriaScores: { name: string; score: number; maxScore: number; comment: string }[];
  overallFeedback: string;
  strengths?: string[];
  improvements?: string[];
  toneAnalysis?: { detected: string; isAppropriate: boolean; note: string };
  timeComplexity?: string;
  equivalenceNote?: string;
}

export async function evaluateAnswer(req: EvaluationRequest): Promise<IAIEvaluation> {
  const systemPrompt = getSystemPrompt(req.question.domain, req.question.rubric.criteria);

  let userMessage = `QUESTION: ${req.question.content.text}`;
  if (req.question.content.formula) {
    userMessage += `\nFORMULA: ${req.question.content.formula}`;
  }
  if (req.question.expectedAnswer) {
    userMessage += `\nEXPECTED ANSWER (reference): ${req.question.expectedAnswer}`;
  }
  userMessage += `\nMAX SCORE: ${req.question.rubric.maxScore}`;
  userMessage += `\n\n---\n\nSTUDENT'S ANSWER:\n<student_answer>\n${req.studentAnswer}\n</student_answer>`;

  if (req.codeExecutionResults) {
    userMessage += `\n\nCODE EXECUTION RESULTS:`;
    userMessage += `\nTest cases passed: ${req.codeExecutionResults.passed}/${req.codeExecutionResults.total}`;
    req.codeExecutionResults.results.forEach((r, i) => {
      userMessage += `\n  Case ${i + 1}: ${r.passed ? "PASS" : "FAIL"} | Input: ${r.input} | Expected: ${r.expected} | Got: ${r.actual}`;
    });
  }

  try {
    const result = await callAIForJSON<AIEvaluationResponse>(systemPrompt, userMessage);

    return {
      score: Math.min(result.totalScore, req.question.rubric.maxScore),
      maxScore: req.question.rubric.maxScore,
      criteriaScores: result.criteriaScores.map((cs) => ({
        name: cs.name,
        score: cs.score,
        maxScore: cs.maxScore,
        comment: cs.comment,
      })),
      feedback: result.overallFeedback,
      explanation: [
        ...(result.strengths?.map((s) => `✓ ${s}`) ?? []),
        ...(result.improvements?.map((i) => `→ ${i}`) ?? []),
        result.equivalenceNote ? `≡ ${result.equivalenceNote}` : "",
        result.timeComplexity ? `⏱ Time complexity: ${result.timeComplexity}` : "",
        result.toneAnalysis ? `🎭 Tone: ${result.toneAnalysis.detected} — ${result.toneAnalysis.note}` : "",
      ].filter(Boolean).join("\n"),
    };
  } catch (error) {
    console.error("AI evaluation failed:", error);
    return {
      score: 0,
      maxScore: req.question.rubric.maxScore,
      criteriaScores: [],
      feedback: "Evaluation failed. This answer has been flagged for manual review.",
      explanation: "AI evaluation encountered an error. A teacher will review this manually.",
    };
  }
}
```

### lib/ai/follow-up.ts — Cross-Question Generator
```typescript
import { callAI } from "./client";

const FOLLOW_UP_SYSTEM = `You are a skilled interviewer. Based on the candidate's answer, ask ONE targeted follow-up question that:
1. Probes deeper into a specific claim they made
2. Tests if they truly understand or are just surface-level
3. Is conversational and natural, not robotic

RULES:
- If the answer was weak or vague, ask a simpler clarifying question to help them.
- If the answer was strong, ask a harder deeper question to test mastery.
- NEVER repeat the original question.
- NEVER ask a yes/no question.
- Respond with ONLY the follow-up question text, nothing else.`;

export async function generateFollowUp(
  originalQuestion: string,
  studentAnswer: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<string> {
  const messages = conversationHistory.length > 0
    ? `\nCONVERSATION SO FAR:\n${conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}\n`
    : "";

  const userMessage = `${messages}
ORIGINAL QUESTION: "${originalQuestion}"
CANDIDATE'S LATEST ANSWER: "${studentAnswer}"

Generate a follow-up question.`;

  return callAI(FOLLOW_UP_SYSTEM, userMessage);
}
```

### lib/ai/resume-parser.ts
```typescript
import { callAIForJSON } from "./client";

export interface ParsedResume {
  name: string;
  skills: string[];
  projects: { name: string; description: string; tech: string[] }[];
  experience: { role: string; company: string; duration: string }[];
  education: string;
  domain: string;
}

const RESUME_PARSER_SYSTEM = `Extract structured data from this resume. Return ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "name": "<full name>",
  "skills": ["skill1", "skill2", "skill3"],
  "projects": [{ "name": "<project name>", "description": "<1 sentence summary>", "tech": ["tech1", "tech2"] }],
  "experience": [{ "role": "<job title>", "company": "<company name>", "duration": "<e.g., 6 months>" }],
  "education": "<highest qualification with institution>",
  "domain": "<one of: frontend, backend, fullstack, data, ai, devops, other>"
}

If a field is not found in the resume, use empty string or empty array. Never make up information.`;

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  return callAIForJSON<ParsedResume>(RESUME_PARSER_SYSTEM, resumeText);
}
```

### lib/ai/question-generator.ts
```typescript
import { callAIForJSON } from "./client";
import { ParsedResume } from "./resume-parser";

export async function generateResumeQuestions(
  resume: ParsedResume,
  role: string,
  count: number = 5
): Promise<string[]> {
  const system = `You are an interviewer for the role: ${role}.
Generate exactly ${count} interview questions personalized to this candidate's resume.
Mix: 2 resume-specific questions (about their projects/experience), 2 technical questions (for their domain), 1 behavioral question.
Return ONLY a JSON array of strings. No markdown, no backticks, no explanation.`;

  return callAIForJSON<string[]>(system, `Resume data: ${JSON.stringify(resume)}`);
}
```

### lib/ai/adaptive.ts — Difficulty Engine
```typescript
export interface AdaptiveState {
  currentDifficulty: "easy" | "medium" | "hard";
  consecutiveCorrect: number;
  consecutiveWrong: number;
  questionHistory: { difficulty: string; scorePercent: number }[];
}

export function getNextDifficulty(state: AdaptiveState): "easy" | "medium" | "hard" {
  const lastEntry = state.questionHistory[state.questionHistory.length - 1];
  const scorePercent = lastEntry?.scorePercent ?? 50;

  // Student doing well → increase
  if (scorePercent >= 80 && state.consecutiveCorrect >= 2) {
    if (state.currentDifficulty === "easy") return "medium";
    return "hard";
  }

  // Student struggling → decrease
  if (scorePercent < 40 && state.consecutiveWrong >= 2) {
    if (state.currentDifficulty === "hard") return "medium";
    return "easy";
  }

  return state.currentDifficulty;
}

export function updateAdaptiveState(
  state: AdaptiveState,
  scorePercent: number
): AdaptiveState {
  const isCorrect = scorePercent >= 60;

  return {
    currentDifficulty: state.currentDifficulty,
    consecutiveCorrect: isCorrect ? state.consecutiveCorrect + 1 : 0,
    consecutiveWrong: !isCorrect ? state.consecutiveWrong + 1 : 0,
    questionHistory: [...state.questionHistory, { difficulty: state.currentDifficulty, scorePercent }],
  };
}
```

---

## CODE EXECUTION ENGINE

### lib/code/executor.ts
```typescript
const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_KEY = process.env.JUDGE0_API_KEY!;

const LANG_MAP: Record<string, number> = {
  python: 71,
  javascript: 63,
  cpp: 54,
  java: 62,
};

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface ExecutionResult {
  passed: number;
  total: number;
  results: {
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    time: string;
    memory: string;
    error?: string;
  }[];
}

export async function executeCode(
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<ExecutionResult> {
  const languageId = LANG_MAP[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  const results = await Promise.all(
    testCases.map(async (tc) => {
      try {
        const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": JUDGE0_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
          body: JSON.stringify({
            source_code: code,
            language_id: languageId,
            stdin: tc.input,
            expected_output: tc.expectedOutput,
            cpu_time_limit: 5,
            memory_limit: 262144, // 256MB
          }),
        });

        const data = await res.json();
        const actual = (data.stdout || "").trim();
        const isAccepted = data.status?.id === 3;

        return {
          input: tc.input,
          expected: tc.expectedOutput,
          actual,
          passed: isAccepted,
          time: data.time || "N/A",
          memory: data.memory ? `${Math.round(data.memory / 1024)} KB` : "N/A",
          error: data.stderr || data.compile_output || undefined,
        };
      } catch (error) {
        return {
          input: tc.input,
          expected: tc.expectedOutput,
          actual: "",
          passed: false,
          time: "N/A",
          memory: "N/A",
          error: `Execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    })
  );

  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
    results,
  };
}
```

---

## AIRS SCORING

### lib/scoring/airs.ts
```typescript
export interface AIRSInput {
  resumeScore: number;         // 0-100
  communicationScore: number;  // 0-100
  technicalScore: number;      // 0-100
  codingScore: number;         // 0-100
  problemSolvingScore: number; // 0-100
  toneScore: number;           // 0-100
}

export interface AIRSBreakdown {
  resumeStrength: { score: number; max: 20 };
  communication: { score: number; max: 20 };
  technicalKnowledge: { score: number; max: 25 };
  codingAbility: { score: number; max: 20 };
  problemSolving: { score: number; max: 10 };
  professionalTone: { score: number; max: 5 };
  total: number;
}

export function calculateAIRS(input: AIRSInput): number {
  return Math.round(
    input.resumeScore * 0.20 +
    input.communicationScore * 0.20 +
    input.technicalScore * 0.25 +
    input.codingScore * 0.20 +
    input.problemSolvingScore * 0.10 +
    input.toneScore * 0.05
  );
}

export function getAIRSBreakdown(input: AIRSInput): AIRSBreakdown {
  return {
    resumeStrength: { score: Math.round(input.resumeScore * 0.20), max: 20 },
    communication: { score: Math.round(input.communicationScore * 0.20), max: 20 },
    technicalKnowledge: { score: Math.round(input.technicalScore * 0.25), max: 25 },
    codingAbility: { score: Math.round(input.codingScore * 0.20), max: 20 },
    problemSolving: { score: Math.round(input.problemSolvingScore * 0.10), max: 10 },
    professionalTone: { score: Math.round(input.toneScore * 0.05), max: 5 },
    total: calculateAIRS(input),
  };
}

export function getAIRSGrade(score: number): { grade: string; label: string; color: string } {
  if (score >= 90) return { grade: "A+", label: "Exceptional", color: "text-green-600" };
  if (score >= 80) return { grade: "A", label: "Excellent", color: "text-green-500" };
  if (score >= 70) return { grade: "B+", label: "Very Good", color: "text-blue-600" };
  if (score >= 60) return { grade: "B", label: "Good", color: "text-blue-500" };
  if (score >= 50) return { grade: "C", label: "Average", color: "text-yellow-600" };
  if (score >= 40) return { grade: "D", label: "Below Average", color: "text-orange-500" };
  return { grade: "F", label: "Needs Improvement", color: "text-red-500" };
}
```

---

## SAMPLE SEED DATA

### lib/db/seed.ts
```typescript
import mongoose from "mongoose";
import { connectDB } from "./mongodb";
import User from "./models/User";
import Question from "./models/Question";
import QuestionFolder from "./models/QuestionFolder";
import { hashPassword } from "@/lib/auth/jwt";

const SEED_QUESTIONS = [
  // ENGLISH
  {
    domain: "english" as const,
    type: "text" as const,
    difficulty: "medium" as const,
    content: { text: "Write a formal apology letter to a client for a delayed shipment of their order #4521. Include: acknowledgment of the delay, reason (warehouse logistics issue), new delivery date, and a goodwill gesture." },
    rubric: { criteria: [
      { name: "Structure & Format", weight: 0.25, description: "Proper letter format" },
      { name: "Grammar & Language", weight: 0.25, description: "Correct grammar and spelling" },
      { name: "Tone & Register", weight: 0.20, description: "Formal and empathetic" },
      { name: "Content Completeness", weight: 0.20, description: "Addresses all 4 required points" },
      { name: "Vocabulary & Expression", weight: 0.10, description: "Professional vocabulary" },
    ], maxScore: 20, gradingLogic: "" },
    expectedAnswer: "A formal letter including greeting, apology, specific order reference, reason for delay, new delivery timeline, compensation offer, and professional closing.",
    tags: ["letter", "formal", "apology", "professional-writing"],
  },
  {
    domain: "english" as const,
    type: "text" as const,
    difficulty: "easy" as const,
    content: { text: "Write a short email to your team announcing that the office will be closed next Friday for maintenance. Keep it professional and include key details: date, reason, and what to do (work from home)." },
    rubric: { criteria: [
      { name: "Structure & Format", weight: 0.25, description: "Email format with subject, greeting, body, sign-off" },
      { name: "Grammar & Language", weight: 0.25, description: "Correct grammar" },
      { name: "Tone & Register", weight: 0.20, description: "Professional but friendly" },
      { name: "Content Completeness", weight: 0.20, description: "Includes date, reason, and WFH instruction" },
      { name: "Vocabulary & Expression", weight: 0.10, description: "Clear and concise" },
    ], maxScore: 10, gradingLogic: "" },
    tags: ["email", "professional", "announcement"],
  },
  // MATH
  {
    domain: "math" as const,
    type: "text" as const,
    difficulty: "easy" as const,
    content: { text: "A train travels 240 km in 3 hours. What is its average speed? Show your working.", formula: "\\text{Speed} = \\frac{\\text{Distance}}{\\text{Time}}" },
    rubric: { criteria: [
      { name: "Final Answer Accuracy", weight: 0.40, description: "Correct: 80 km/h" },
      { name: "Logical Steps", weight: 0.30, description: "Shows Speed = Distance/Time" },
      { name: "Method Selection", weight: 0.15, description: "Uses correct formula" },
      { name: "Presentation", weight: 0.15, description: "Clear working with units" },
    ], maxScore: 10, gradingLogic: "" },
    expectedAnswer: "Speed = 240/3 = 80 km/h",
    tags: ["speed", "distance", "time", "basic"],
  },
  {
    domain: "math" as const,
    type: "text" as const,
    difficulty: "medium" as const,
    content: { text: "If a shirt costs ₹800 after a 20% discount, what was the original price? Show your calculation step by step." },
    rubric: { criteria: [
      { name: "Final Answer Accuracy", weight: 0.40, description: "Correct: ₹1000" },
      { name: "Logical Steps", weight: 0.30, description: "Sets up equation: 0.8x = 800" },
      { name: "Method Selection", weight: 0.15, description: "Percentage/algebra approach" },
      { name: "Presentation", weight: 0.15, description: "Clear step-by-step" },
    ], maxScore: 10, gradingLogic: "" },
    expectedAnswer: "Original price × 0.80 = 800, so Original = 800/0.80 = ₹1000",
    tags: ["percentage", "discount", "algebra"],
  },
  // APTITUDE
  {
    domain: "aptitude" as const,
    type: "text" as const,
    difficulty: "medium" as const,
    content: { text: "If all roses are flowers, and some flowers fade quickly, can we conclude that some roses fade quickly? Explain your reasoning." },
    rubric: { criteria: [
      { name: "Answer Correctness", weight: 0.35, description: "Correct: No, we cannot conclude this" },
      { name: "Reasoning Chain", weight: 0.35, description: "Explains the logical fallacy" },
      { name: "Explanation Clarity", weight: 0.20, description: "Clear reasoning" },
      { name: "Efficiency", weight: 0.10, description: "Concise explanation" },
    ], maxScore: 10, gradingLogic: "" },
    expectedAnswer: "No. While all roses are flowers, the 'some flowers that fade quickly' may not include any roses. This is the fallacy of the undistributed middle.",
    tags: ["logic", "syllogism", "reasoning"],
  },
  // CODING
  {
    domain: "coding" as const,
    type: "code" as const,
    difficulty: "medium" as const,
    content: { text: "Write a function that takes an array of integers and returns the second largest number. Handle edge cases: duplicates, arrays with less than 2 elements." },
    rubric: { criteria: [
      { name: "Correctness", weight: 0.35, description: "Passes all test cases" },
      { name: "Code Quality", weight: 0.25, description: "Clean, readable code" },
      { name: "Efficiency", weight: 0.20, description: "O(n) preferred over O(n log n)" },
      { name: "Edge Cases", weight: 0.10, description: "Handles duplicates, small arrays" },
      { name: "Best Practices", weight: 0.10, description: "Good naming, input validation" },
    ], maxScore: 10, gradingLogic: "" },
    testCases: [
      { input: "[5, 3, 8, 1, 9]", expectedOutput: "8" },
      { input: "[5, 5, 3]", expectedOutput: "3" },
      { input: "[1]", expectedOutput: "-1" },
      { input: "[]", expectedOutput: "-1" },
      { input: "[10, 10, 10]", expectedOutput: "-1" },
      { input: "[1, 2]", expectedOutput: "1" },
    ],
    expectedAnswer: "function secondLargest(arr) { const unique = [...new Set(arr)]; if (unique.length < 2) return -1; unique.sort((a,b) => b-a); return unique[1]; }",
    tags: ["array", "sorting", "edge-cases"],
  },
  {
    domain: "coding" as const,
    type: "code" as const,
    difficulty: "easy" as const,
    content: { text: "Write a function `isPalindrome(str)` that checks if a given string is a palindrome. Ignore case and spaces." },
    rubric: { criteria: [
      { name: "Correctness", weight: 0.35, description: "Handles all test cases" },
      { name: "Code Quality", weight: 0.25, description: "Clean and readable" },
      { name: "Efficiency", weight: 0.20, description: "O(n) solution" },
      { name: "Edge Cases", weight: 0.10, description: "Empty string, single char" },
      { name: "Best Practices", weight: 0.10, description: "Proper naming" },
    ], maxScore: 10, gradingLogic: "" },
    testCases: [
      { input: "racecar", expectedOutput: "true" },
      { input: "Race Car", expectedOutput: "true" },
      { input: "hello", expectedOutput: "false" },
      { input: "", expectedOutput: "true" },
      { input: "a", expectedOutput: "true" },
    ],
    tags: ["string", "palindrome", "basic"],
  },
  // HR
  {
    domain: "hr" as const,
    type: "text" as const,
    difficulty: "medium" as const,
    content: { text: "Tell me about a time you failed at work or in a project. What happened and what did you learn?" },
    rubric: { criteria: [
      { name: "Relevance", weight: 0.30, description: "Describes a real failure" },
      { name: "Clarity & Communication", weight: 0.25, description: "Uses STAR method" },
      { name: "Professional Tone", weight: 0.20, description: "Takes accountability" },
      { name: "Specificity", weight: 0.15, description: "Specific details and metrics" },
      { name: "Self-Awareness", weight: 0.10, description: "Shows growth and lessons learned" },
    ], maxScore: 10, gradingLogic: "" },
    tags: ["behavioral", "failure", "self-awareness"],
  },
  {
    domain: "hr" as const,
    type: "voice" as const,
    difficulty: "easy" as const,
    content: { text: "Introduce yourself in a professional context. You are interviewing for a software developer position at a tech startup." },
    rubric: { criteria: [
      { name: "Relevance", weight: 0.30, description: "Relevant to the role" },
      { name: "Clarity & Communication", weight: 0.25, description: "Structured introduction" },
      { name: "Professional Tone", weight: 0.20, description: "Confident, not arrogant" },
      { name: "Specificity", weight: 0.15, description: "Mentions skills, experience, projects" },
      { name: "Self-Awareness", weight: 0.10, description: "Knows what they bring" },
    ], maxScore: 10, gradingLogic: "" },
    tags: ["introduction", "self-presentation", "voice"],
  },
];

async function seed() {
  await connectDB();
  console.log("Connected to MongoDB");

  // Clear existing data
  await User.deleteMany({});
  await Question.deleteMany({});
  await QuestionFolder.deleteMany({});
  console.log("Cleared existing data");

  // Create users
  const adminPassword = await hashPassword("admin123");
  const studentPassword = await hashPassword("student123");
  const teacherPassword = await hashPassword("teacher123");

  const admin = await User.create({
    name: "Admin User", email: "admin@test.com", password: adminPassword, role: "admin",
  });
  const student = await User.create({
    name: "Test Student", email: "student@test.com", password: studentPassword, role: "student",
  });
  const teacher = await User.create({
    name: "Test Teacher", email: "teacher@test.com", password: teacherPassword, role: "teacher",
  });
  console.log("Created users: admin@test.com / admin123, student@test.com / student123, teacher@test.com / teacher123");

  // Create folders
  const folders: Record<string, any> = {};
  for (const domain of ["english", "math", "aptitude", "coding", "hr"]) {
    folders[domain] = await QuestionFolder.create({
      name: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Question Set`,
      domain,
      fetchCount: 5,
      createdBy: admin._id,
    });
  }
  console.log("Created folders");

  // Create questions
  for (const q of SEED_QUESTIONS) {
    const folder = folders[q.domain];
    await Question.create({
      ...q,
      folderId: folder._id,
      createdBy: admin._id,
    });
    folder.questionCount += 1;
    await folder.save();
  }
  console.log(`Seeded ${SEED_QUESTIONS.length} questions across 5 domains`);

  await mongoose.disconnect();
  console.log("Seed complete!");
}

seed().catch(console.error);
```

---

## DESIGN SYSTEM

### Color Palette
- **Primary:** Indigo (#4f46e5 → #1a1a2e) — main actions, headers, nav
- **Accent:** Rose (#e94560) — highlights, CTAs, important badges
- **Navy:** (#0f3460) — secondary headers, cards
- **Success:** Green (#22c55e) — correct, passed
- **Warning:** Amber (#f59e0b) — partial credit, attention
- **Danger:** Red (#ef4444) — incorrect, failed
- **Info:** Blue (#3b82f6) — information, tips
- **Backgrounds:** gray-50 (page), white (cards), gray-900 (dark sections)

### Typography
- **Headings:** Inter, 700/800 weight
- **Body:** Inter, 400/500 weight
- **Code:** JetBrains Mono, 400/500 weight

### Component Patterns
- **Buttons:** Use `.btn-primary`, `.btn-secondary`, `.btn-accent` classes
- **Cards:** Use `.card` or `.card-hover` classes
- **Inputs:** Use `.input-field` class
- **Labels:** Use `.label` class
- **Badges:** Use `.badge-{domain}` or `.badge-{difficulty}` classes
- **Spacing:** Use Tailwind spacing scale (4, 6, 8 for gaps; 6, 8 for padding)
- **Border radius:** `rounded-lg` for cards/buttons, `rounded-xl` for large cards

### Layout Rules
- **Max width:** `max-w-7xl mx-auto` for page content
- **Sidebar:** 64px collapsed, 240px expanded, `fixed left-0`
- **Navbar:** `sticky top-0 z-50` with `bg-white/80 backdrop-blur`
- **Page padding:** `px-4 sm:px-6 lg:px-8 py-8`

---

## DEPLOYMENT INSTRUCTIONS

### Vercel + MongoDB Atlas

1. **Create MongoDB Atlas cluster** (free M0 tier):
   - Go to cloud.mongodb.com → Create cluster → Get connection string
   - Whitelist `0.0.0.0/0` for Vercel serverless

2. **Push code to GitHub**

3. **Deploy to Vercel:**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

4. **Set environment variables** in Vercel dashboard:
   - `MONGODB_URI` — Atlas connection string
   - `JWT_SECRET` — random 64-char string
   - `ANTHROPIC_API_KEY` — your Claude API key
   - `JUDGE0_API_KEY` — RapidAPI key
   - `NEXT_PUBLIC_APP_URL` — your Vercel domain

5. **Seed the database:**
   ```bash
   npx tsx lib/db/seed.ts
   ```

6. **Test login:**
   - Admin: admin@test.com / admin123
   - Student: student@test.com / student123
   - Teacher: teacher@test.com / teacher123

---

## CODING STANDARDS (STRICT)

1. **Every API route** must have Zod validation on request body using schemas from `lib/utils/validation.ts`
2. **Every API route** must check auth via `authenticateRequest()` from `lib/auth/jwt.ts`
3. **All AI calls** must use `callAI()` or `callAIForJSON()` from `lib/ai/client.ts` (includes retry logic)
4. **All AI responses** must be parsed via `parseAIJSON()` — never raw `JSON.parse()`
5. **Use `"use client"` directive** only on components that need browser APIs (voice, Monaco, charts)
6. **Server components by default** — only mark client when necessary
7. **No `any` types** — use proper TypeScript interfaces from model files
8. **Consistent error responses:** always use `successResponse()` or `errorResponse()` from `lib/utils/api-helpers.ts`
9. **MongoDB connection** must use `connectDB()` singleton — never raw `mongoose.connect()`
10. **All Claude API calls** use model `claude-sonnet-4-20250514` with `max_tokens: 1000`
11. **API route pattern:** `connectDB()` → `authenticateRequest()` → `validateBody()` → business logic → `successResponse()`
12. **Tailwind only** — no inline styles, no CSS modules, no styled-components
13. **Import paths** use `@/` alias — e.g., `import { connectDB } from "@/lib/db/mongodb"`

---

## IMPORTANT INSTRUCTIONS FOR CLAUDE

1. **Always generate complete, production-ready code.** No placeholders, no "// TODO", no "implement this later". Every file must be copy-paste-ready and immediately functional.
2. **Follow the file structure exactly** as defined above. Don't create files in wrong directories.
3. **Use the exact schemas and models** defined above. Don't simplify, rename, or change field structures.
4. **Use the exact rubric prompts** defined above. These are tested and optimized.
5. **Always include error handling** — try/catch on every async operation, meaningful error messages.
6. **Tailwind for all styling** — use the design system classes defined above.
7. **When building UI, make it look professional** — this is for a hackathon demo that needs to impress judges.
8. **Test every API route** handles both success and error cases.
9. **When I say "build Phase X"**, generate ALL files for that phase in one shot, ready to use.
10. **Ask me before making architectural changes** — stick to this blueprint.
11. **Use the exact utility functions** (`successResponse`, `errorResponse`, `validateBody`, `authenticateRequest`, `callAIForJSON`) — never re-implement them inline.
12. **Reference this document** as the single source of truth for all decisions.

---

## CURRENT BUILD STATUS

### Completed:
- [x] Full blueprint documentation (35-page PDF)
- [x] Architecture design finalized
- [x] Database schema designed (all 5 models with code)
- [x] API routes designed (30+ endpoints)
- [x] AI rubric prompts written (all 5 domains)
- [x] All utility functions coded (auth, validation, API helpers, AI client)
- [x] Code execution engine coded (Judge0)
- [x] AIRS scoring system coded
- [x] Adaptive difficulty engine coded
- [x] Seed data prepared (10 questions across 5 domains)
- [x] Design system defined (colors, typography, components)
- [x] Config files ready (next.config, tsconfig, tailwind, postcss)
- [x] Deployment instructions ready

### Next:
- [ ] Phase 1: Project scaffold + install deps + create all files above + auth UI

### Not Started:
- [ ] Phase 2: Question bank UI + CRUD
- [ ] Phase 3: Test terminal UI
- [ ] Phase 4: AI evaluation integration
- [ ] Phase 5: Interview simulator
- [ ] Phase 6: Dashboards + polish

---

## DEMO SCRIPT (5-7 minutes)

1. **The Problem (30s):** "Current testing is stuck in MCQs. We evaluate ANY response type with AI."
2. **Admin Creates Questions (1 min):** Show admin panel, create letter + math + coding questions
3. **Student Takes Test (2 min):** Answer via text → instant AI grading. Answer via voice → transcription. Coding → execution + AI review.
4. **AI Interview (2 min):** Upload resume → AI parses → personalized questions → follow-up cross-questions → AIRS score
5. **Dashboards (1 min):** Student progress + Teacher override panel
6. **Wow Factor (30s):** Student speaks Hindi → evaluated in English. "100K+ users, no human graders."
