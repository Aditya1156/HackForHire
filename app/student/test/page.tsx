"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import BrandLoader from "@/components/ui/BrandLoader";
import {
  FolderOpen,
  BookOpen,
  Play,
  Loader2,
  AlertCircle,
  Hash,
  Upload,
  FileText,
  X,
  Sparkles,
} from "lucide-react";

interface Folder {
  _id: string;
  name: string;
  domain: string;
  questionCount: number;
  fetchCount: number;
}

const domainBadgeClass: Record<string, string> = {
  english: "badge-english",
  math: "badge-math",
  aptitude: "badge-aptitude",
  coding: "badge-coding",
  hr: "badge-hr",
  situational: "bg-teal-100 text-teal-800",
};

export default function TestSelectionPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingFolderId, setStartingFolderId] = useState<string | null>(null);

  // Resume state
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/folders")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setFolders(data.data.folders);
        else setError(data.error ?? "Failed to load folders");
      })
      .catch(() => setError("Network error — please try again"))
      .finally(() => setLoading(false));
  }, []);

  const handleResumeUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large — max 5MB");
      return;
    }

    setIsParsing(true);
    setError(null);
    setResumeFile(file.name);

    try {
      // Read file and send descriptive prompt to AI resume parser
      const resumePrompt = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(
            `[PDF Resume: ${file.name}] — Please extract and summarize the candidate's skills, experience, projects, and education from this resume.`
          );
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      const res = await fetch("/api/ai/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: resumePrompt }),
      });
      const data = await res.json();

      if (data.success && data.data?.parsed) {
        const p = data.data.parsed;
        const parts = [
          p.name, p.domain, p.education,
          ...(p.skills || []),
          ...(p.projects || []).map((pr: any) =>
            typeof pr === "string" ? pr : [pr.name, pr.description, ...(pr.tech || [])].join(" ")
          ),
          ...(p.experience || []).map((e: any) =>
            typeof e === "string" ? e : [e.role, e.company].filter(Boolean).join(" ")
          ),
        ].filter(Boolean);
        setResumeText(parts.join(" "));
      } else {
        setError("Could not parse resume — you can still start the test");
        setResumeFile(null);
      }
    } catch {
      setError("Failed to parse resume — you can still start the test");
      setResumeFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleStart = async (folderId: string) => {
    setStartingFolderId(folderId);
    setError(null);
    try {
      const res = await fetch("/api/tests/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          resumeText: resumeText || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem("proctoring_enabled", "true");
        router.push(`/student/test/${data.data.testId}`);
      } else {
        setError(data.error ?? "Failed to start test");
        setStartingFolderId(null);
      }
    } catch {
      setError("Network error — please try again");
      setStartingFolderId(null);
    }
  };

  return (
    <AuthGuard requiredRole="student">
      <div>
        <div className="mb-8">
          <h1 className="page-header">Available Tests</h1>
          <p className="text-gray-500 text-sm">
            Upload your resume for personalized questions, then select a test to begin.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Resume Upload Section */}
        <div className="mb-8">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Resume (Optional)</h2>
                <p className="text-xs text-gray-500">
                  Upload your resume to get questions tailored to your skills and experience.
                </p>
              </div>
            </div>

            {!resumeFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleResumeUpload(file);
                }}
                className="border-2 border-dashed border-violet-200 rounded-xl p-6 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])}
                />
                {isParsing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                    <p className="text-sm text-violet-600 font-medium">Parsing resume with AI...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-violet-400" />
                    <p className="text-sm font-medium text-gray-600">
                      Drop your resume here or click to browse
                    </p>
                    <p className="text-xs text-gray-400">PDF format, max 5MB</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
                <FileText className="w-5 h-5 text-violet-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-violet-800 truncate">{resumeFile}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3 h-3 text-violet-500" />
                    <p className="text-xs text-violet-600">Resume parsed — questions will be personalized</p>
                  </div>
                </div>
                <button
                  onClick={() => { setResumeFile(null); setResumeText(""); }}
                  className="p-1.5 text-violet-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Folder Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <BrandLoader fullPage={false} text="Loading tests..." />
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No test folders available</p>
            <p className="text-sm mt-1">Ask your teacher to create question folders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {folders.map((folder) => (
              <div key={folder._id} className="card-hover p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                    <FolderOpen className="w-5 h-5 text-primary-600" />
                  </div>
                  <span
                    className={`badge ${domainBadgeClass[folder.domain] ?? "bg-gray-100 text-gray-700"} capitalize`}
                  >
                    {folder.domain}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1">
                    {folder.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5" />
                      {folder.questionCount} question{folder.questionCount !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {folder.fetchCount} per test
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleStart(folder._id)}
                  disabled={startingFolderId !== null || folder.questionCount === 0}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-auto disabled:opacity-50"
                >
                  {startingFolderId === folder._id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Test
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
