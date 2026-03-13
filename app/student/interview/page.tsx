"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Upload,
  FileText,
  Loader2,
  ChevronRight,
  CheckCircle2,
  X,
  AlertCircle,
  GraduationCap,
  Briefcase,
  ChevronLeft,
  Info,
} from "lucide-react";

type InterviewMode = "basic" | "advanced";

interface ResumePreview {
  name: string;
  skills: string[];
  domain: string;
  experience: { role: string; company: string; duration: string }[];
  education: string;
  projectCount: number;
}

const QUALIFICATIONS = [
  "BE / BTech / ME / MTech",
  "BBA / MBA",
  "BCom / MCom",
  "BA / MA",
  "BSc / MSc",
  "Others (Any Graduation)",
];

const ROLES_BY_QUALIFICATION: Record<string, string[]> = {
  "BE / BTech / ME / MTech": [
    "Software Developer",
    "Data Scientist",
    "DevOps Engineer",
    "Full Stack Developer",
    "Machine Learning Engineer",
    "System Design Engineer",
    "Cloud Architect",
    "Cybersecurity Analyst",
    "Embedded Systems Engineer",
    "Product Manager (Tech)",
  ],
  "BBA / MBA": [
    "Business Analyst",
    "Product Manager",
    "Marketing Manager",
    "Operations Manager",
    "HR Manager",
    "Finance Manager",
    "Consultant",
    "Strategy Analyst",
    "Brand Manager",
    "Supply Chain Manager",
  ],
  "BCom / MCom": [
    "Accountant",
    "Financial Analyst",
    "Tax Consultant",
    "Auditor",
    "Investment Banker",
    "Insurance Analyst",
    "Banking Officer",
    "Cost Analyst",
    "Budget Analyst",
    "Equity Research Analyst",
  ],
  "BA / MA": [
    "Content Writer",
    "Journalist",
    "Public Relations Manager",
    "Social Media Manager",
    "UX Researcher",
    "Policy Analyst",
    "Copywriter",
    "HR Executive",
    "Research Associate",
    "Communications Specialist",
  ],
  "BSc / MSc": [
    "Data Analyst",
    "Research Scientist",
    "Lab Technician",
    "Biotech Researcher",
    "Statistician",
    "Environmental Scientist",
    "Quality Analyst",
    "Clinical Research Associate",
    "Bioinformatics Analyst",
    "Science Writer",
  ],
  "Others (Any Graduation)": [
    "Customer Success Manager",
    "Sales Executive",
    "Administrative Officer",
    "Operations Executive",
    "Digital Marketing Executive",
    "Content Creator",
    "Executive Assistant",
    "Relationship Manager",
    "Recruiter",
    "General Management Trainee",
  ],
};

export default function InterviewSetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qualScrollRef = useRef<HTMLDivElement>(null);

  const [qualification, setQualification] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [mode, setMode] = useState<InterviewMode>("basic");
  const [resumeText, setResumeText] = useState("");
  const [resumePreview, setResumePreview] = useState<ResumePreview | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const availableRoles = qualification ? ROLES_BY_QUALIFICATION[qualification] || [] : [];

  const scrollQualifications = (direction: "left" | "right") => {
    if (qualScrollRef.current) {
      const scrollAmount = 200;
      qualScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB.");
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(
            `[PDF Resume: ${file.name}] — Please extract and summarize the candidate's skills, experience, projects, and education from this resume.`
          );
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

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
        setError("Could not parse PDF. Please try again.");
      }
    } catch (err) {
      setError("Failed to read file. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleStartInterview = async () => {
    if (!role.trim()) {
      setError("Please select the role you are interviewing for.");
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

  const removeResume = () => {
    setResumeText("");
    setResumePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Image
            src="/image/VULCAN Logo_transparent.png"
            alt="Vulcan Prep"
            width={80}
            height={80}
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Let&apos;s Begin Your
          </h1>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent leading-tight">
            Interview Journey
          </h1>
          <p className="text-gray-500 mt-4 max-w-lg mx-auto text-sm sm:text-base">
            Upload your resume and tell us about your dream role. Our intelligent system will create
            a personalized interview experience just for you.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-8">
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

          {/* Graduation Degree Selection */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-900">Select your graduation degree</h2>
            </div>
            <div className="relative flex items-center">
              <button
                onClick={() => scrollQualifications("left")}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors mr-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div
                ref={qualScrollRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {QUALIFICATIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setQualification(q);
                      setRole("");
                    }}
                    disabled={isStarting}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap
                      ${
                        qualification === q
                          ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-violet-300 hover:text-violet-700"
                      } disabled:opacity-50`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <button
                onClick={() => scrollQualifications("right")}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors ml-2"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <Info className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs text-gray-400">
                Relevant roles will be shown first based on your selection.
              </p>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-5 h-5 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-900">
                What role are you interviewing for?{" "}
                <span className="text-red-500">*</span>
              </h2>
            </div>
            {qualification ? (
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isStarting}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <option value="">Select a role...</option>
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Briefcase className="w-4 h-4 text-gray-300" />
                <span className="text-sm text-gray-400">Select qualification first</span>
              </div>
            )}
            {!qualification && (
              <p className="text-xs text-gray-400 mt-2">
                Please select your qualification to see relevant roles.
              </p>
            )}
          </div>

          {/* Interview Mode */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              Select the mode of interview preparation
            </h2>
            <div className="flex gap-3">
              {(["basic", "advanced"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  disabled={isStarting}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all capitalize
                    ${
                      mode === m
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    } disabled:opacity-50`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {mode === "basic"
                ? "Basic mode gives a simple interview preparation flow."
                : "Advanced mode includes deeper follow-up questions and cross-questioning."}
            </p>
          </div>

          {/* Resume Upload */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Upload your resume <span className="text-red-500">*</span>
              </h2>
            </div>

            {resumePreview ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">
                      Resume parsed successfully
                    </span>
                  </div>
                  <button
                    onClick={removeResume}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
                  {resumePreview.skills.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Skills</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {resumePreview.skills.slice(0, 8).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-white border border-green-200 text-xs text-green-700 rounded-full"
                          >
                            {s}
                          </span>
                        ))}
                        {resumePreview.skills.length > 8 && (
                          <span className="px-2 py-0.5 text-xs text-gray-500">
                            +{resumePreview.skills.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${
                    isDragOver
                      ? "border-violet-400 bg-violet-50"
                      : isParsing
                      ? "border-violet-300 bg-violet-50"
                      : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                {isParsing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                    <p className="text-sm text-violet-600 font-medium">Parsing resume with AI...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-700">Drop your resume here</p>
                      <p className="text-sm text-gray-400 mt-1">or click to browse your files</p>
                    </div>
                    <button
                      type="button"
                      className="px-6 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Choose File
                    </button>
                    <p className="text-xs text-gray-400">PDF format, max 5MB</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartInterview}
            disabled={!role.trim() || isStarting}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-base"
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
            AI will ask personalized questions based on your role
            {resumePreview ? " and resume" : ""}. Average session: 10-15 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
