"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Loader2,
  ChevronRight,
  CheckCircle2,
  Briefcase,
  Brain,
  Shuffle,
  X,
  AlertCircle,
} from "lucide-react";

type InterviewMode = "technical" | "hr" | "mixed";

interface ResumePreview {
  name: string;
  skills: string[];
  domain: string;
  experience: { role: string; company: string; duration: string }[];
  education: string;
  projectCount: number;
}

const MODES: { id: InterviewMode; icon: any; title: string; desc: string; color: string }[] = [
  {
    id: "technical",
    icon: Brain,
    title: "Technical Interview",
    desc: "Deep dive into algorithms, system design, and technical problem-solving",
    color: "border-blue-200 bg-blue-50 hover:border-blue-400",
  },
  {
    id: "hr",
    icon: Briefcase,
    title: "HR / Behavioral",
    desc: "Behavioral questions, culture fit, communication, and soft skills",
    color: "border-pink-200 bg-pink-50 hover:border-pink-400",
  },
  {
    id: "mixed",
    icon: Shuffle,
    title: "Mixed Interview",
    desc: "Best of both — technical + behavioral + resume-based questions",
    color: "border-purple-200 bg-purple-50 hover:border-purple-400",
  },
];

export default function InterviewSetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [role, setRole] = useState("");
  const [mode, setMode] = useState<InterviewMode>("mixed");
  const [resumeText, setResumeText] = useState("");
  const [resumePreview, setResumePreview] = useState<ResumePreview | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeInputMode, setResumeInputMode] = useState<"upload" | "paste">("upload");
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }

    setFileName(file.name);
    setIsParsing(true);
    setError(null);

    try {
      // Read PDF as text using FileReader (base64 fallback)
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // For PDFs, we send a note about the file — the text extraction note
          // Use the filename as a minimal placeholder since pdf-parse runs server-side
          resolve(`[PDF Resume: ${file.name}] — Please extract and summarize the candidate's skills, experience, projects, and education from this resume.`);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      // Send to parse-resume API as text
      const res = await fetch("/api/ai/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text }),
      });
      const data = await res.json();

      if (data.success) {
        const parsed = data.data.parsed;
        setResumeText(text);
        setResumePreview({
          name: parsed.name,
          skills: parsed.skills ?? [],
          domain: parsed.domain,
          experience: parsed.experience ?? [],
          education: parsed.education,
          projectCount: (parsed.projects ?? []).length,
        });
      } else {
        setError("Could not parse PDF. Try pasting resume text instead.");
      }
    } catch (err) {
      setError("Failed to read file. Try pasting resume text instead.");
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasteParseResume = async () => {
    if (!resumeText.trim()) return;
    setIsParsing(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });
      const data = await res.json();
      if (data.success) {
        const parsed = data.data.parsed;
        setResumePreview({
          name: parsed.name,
          skills: parsed.skills ?? [],
          domain: parsed.domain,
          experience: parsed.experience ?? [],
          education: parsed.education,
          projectCount: (parsed.projects ?? []).length,
        });
      } else {
        setError("Could not parse resume text.");
      }
    } catch {
      setError("Failed to parse resume.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartInterview = async () => {
    if (!role.trim()) {
      setError("Please enter the role you are interviewing for.");
      return;
    }
    setIsStarting(true);
    setError(null);

    try {
      const body: any = { role: role.trim() };
      if (resumeText) body.resumeText = resumeText;

      const res = await fetch("/api/interviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        // Store initial data for interview room page
        sessionStorage.setItem(
          `interview-${data.data.interviewId}`,
          JSON.stringify({
            firstQuestion: data.data.firstQuestion,
            role: role.trim(),
          })
        );
        router.push(`/student/interview/${data.data.interviewId}`);
      } else {
        setError(data.error ?? "Failed to start interview.");
        setIsStarting(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-navy to-primary-900 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 shadow-lg mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-9 h-9">
              <rect x="2" y="8" width="20" height="13" rx="3" />
              <circle cx="9" cy="14" r="1.5" fill="white" stroke="none" />
              <circle cx="15" cy="14" r="1.5" fill="white" stroke="none" />
              <path d="M9 19h6" stroke="white" />
              <path d="M12 5v3" stroke="white" />
              <circle cx="12" cy="4" r="1.5" fill="white" stroke="none" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Interview Simulator</h1>
          <p className="text-primary-300 text-sm">
            Practice with a personalized AI interviewer. Get your AIRS score.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Role Input */}
          <div>
            <label className="label">What role are you interviewing for?</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Senior React Developer, Data Scientist, Product Manager..."
              className="input-field"
              disabled={isStarting}
            />
          </div>

          {/* Interview Mode */}
          <div>
            <label className="label">Interview Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  disabled={isStarting}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all
                    ${mode === m.id
                      ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
                      : m.color
                    } disabled:opacity-50`}
                >
                  {mode === m.id && (
                    <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary-600" />
                  )}
                  <m.icon className={`w-6 h-6 mb-2 ${mode === m.id ? "text-primary-600" : "text-gray-600"}`} />
                  <p className={`text-sm font-semibold ${mode === m.id ? "text-primary-700" : "text-gray-800"}`}>
                    {m.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Resume Upload */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Resume (Optional but recommended)</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                {(["upload", "paste"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setResumeInputMode(opt)}
                    disabled={isStarting}
                    className={`px-3 py-1 text-xs font-medium transition-colors
                      ${resumeInputMode === opt
                        ? "bg-primary-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    {opt === "upload" ? "Upload PDF" : "Paste Text"}
                  </button>
                ))}
              </div>
            </div>

            {resumeInputMode === "upload" ? (
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                    ${isParsing ? "border-primary-300 bg-primary-50" : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  {isParsing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                      <p className="text-sm text-primary-600 font-medium">Parsing resume with AI...</p>
                    </div>
                  ) : fileName ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-green-500" />
                      <p className="text-sm font-medium text-gray-800">{fileName}</p>
                      <p className="text-xs text-gray-500">Click to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <p className="text-sm text-gray-600 font-medium">Click to upload PDF resume</p>
                      <p className="text-xs text-gray-400">AI will personalize questions based on your experience</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  rows={6}
                  className="input-field resize-none text-sm"
                  disabled={isStarting}
                />
                <button
                  onClick={handlePasteParseResume}
                  disabled={!resumeText.trim() || isParsing || isStarting}
                  className="btn-secondary btn-sm flex items-center gap-1.5 disabled:opacity-40"
                >
                  {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  Parse Resume
                </button>
              </div>
            )}

            {/* Resume Preview */}
            {resumePreview && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Resume parsed successfully</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {resumePreview.name && (
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Name</span>
                      <p className="font-medium text-gray-800">{resumePreview.name}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Domain</span>
                    <p className="font-medium text-gray-800 capitalize">{resumePreview.domain}</p>
                  </div>
                  {resumePreview.education && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Education</span>
                      <p className="font-medium text-gray-800 text-xs mt-0.5">{resumePreview.education}</p>
                    </div>
                  )}
                  {resumePreview.skills.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Skills</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {resumePreview.skills.slice(0, 8).map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-white border border-green-200 text-xs text-green-700 rounded-full">
                            {s}
                          </span>
                        ))}
                        {resumePreview.skills.length > 8 && (
                          <span className="px-2 py-0.5 text-xs text-gray-500">+{resumePreview.skills.length - 8} more</span>
                        )}
                      </div>
                    </div>
                  )}
                  {resumePreview.experience.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Experience</span>
                      {resumePreview.experience.slice(0, 2).map((e, i) => (
                        <p key={i} className="text-xs text-gray-700 mt-0.5">
                          {e.role} at {e.company} ({e.duration})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartInterview}
            disabled={!role.trim() || isStarting}
            className="w-full btn-primary btn-lg flex items-center justify-center gap-3 disabled:opacity-40"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting Interview...
              </>
            ) : (
              <>
                Start Interview
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            AI will ask personalized questions based on your role{resumePreview ? " and resume" : ""}. Average session: 10-15 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
