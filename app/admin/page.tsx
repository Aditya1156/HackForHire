"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/layout/AuthGuard";
import BrandLoader from "@/components/ui/BrandLoader";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  BookOpen,
  Plus,
  X,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  Headphones,
  Music,
  Search,
  Trash2,
  ExternalLink,
  BarChart3,
  Users,
  TrendingUp,
  Clock,
  Filter,
  LayoutGrid,
  List,
  Pencil,
  MoreVertical,
  FolderPlus,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Folder {
  _id: string;
  name: string;
  domain: string;
  description?: string;
  tags: string[];
  isPublished: boolean;
  questionCount: number;
  createdAt: string;
}

interface GeneratedQuestion {
  _id: string;
  domain: string;
  type: string;
  difficulty: string;
  answerFormat: string;
  content: {
    text: string;
    instructions?: string;
    wordLimit?: string;
    options?: { label: string; text: string; isCorrect: boolean }[];
    blanks?: { id: number; correctAnswer: string }[];
    matchingPairs?: { id: number; item: string; correctMatch: string }[];
    multiSelectCorrect?: string[];
  };
  tags: string[];
}

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalQuestions: number;
  totalFolders: number;
  totalTests: number;
  avgScore: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DOMAINS = [
  { value: "general", label: "Auto-Detect" },
  { value: "english", label: "English / IELTS" },
  { value: "math", label: "Mathematics" },
  { value: "aptitude", label: "Aptitude" },
  { value: "coding", label: "Coding" },
  { value: "hr", label: "HR" },
  { value: "situational", label: "Situational" },
  { value: "communication", label: "Communication" },
];

const FORMAT_BADGES: Record<string, { bg: string; text: string }> = {
  mcq: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  text: { bg: "bg-gray-50 border-gray-200", text: "text-gray-600" },
  code: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700" },
  fill_in_blanks: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  matching: { bg: "bg-cyan-50 border-cyan-200", text: "text-cyan-700" },
  multi_select: { bg: "bg-pink-50 border-pink-200", text: "text-pink-700" },
};

const DIFFICULTY_DOT: Record<string, string> = {
  easy: "bg-emerald-400",
  medium: "bg-amber-400",
  hard: "bg-red-400",
};

const DOMAIN_COLORS: Record<string, string> = {
  english: "from-blue-500 to-indigo-500",
  math: "from-emerald-500 to-teal-500",
  aptitude: "from-violet-500 to-purple-500",
  coding: "from-orange-500 to-red-500",
  hr: "from-pink-500 to-rose-500",
  situational: "from-teal-500 to-cyan-500",
  general: "from-gray-500 to-slate-500",
  communication: "from-amber-500 to-yellow-500",
};

const VALID_DOC_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];
const VALID_DOC_EXTS = [".pdf", ".docx", ".doc", ".txt"];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  // Dashboard state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [folderSearch, setFolderSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload state
  const [files, setFiles] = useState<File[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioUploading, setAudioUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDomain, setFolderDomain] = useState("general");
  const [isListeningTest, setIsListeningTest] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [genSuccess, setGenSuccess] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [generatedFolderId, setGeneratedFolderId] = useState("");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch Data ──────────────────────────────────────────────────────────
  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/folders");
      const data = await res.json();
      if (res.ok) setFolders(data.data.folders || []);
    } catch {}
    setFoldersLoading(false);
  }, []);

  useEffect(() => {
    fetchFolders();
    fetch("/api/dashboard/admin")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.stats) setStats(d.data.stats);
      })
      .catch(() => {});
  }, [fetchFolders]);

  // ─── File Handling ───────────────────────────────────────────────────────
  const isValidDoc = (f: File) => {
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    return (VALID_DOC_TYPES.includes(f.type) || VALID_DOC_EXTS.includes(ext)) && f.size <= 20 * 1024 * 1024;
  };

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter(isValidDoc);
    if (valid.length === 0) {
      setGenError("Upload PDF, DOCX, DOC, or TXT files (max 20MB each).");
      return;
    }
    setFiles((prev) => [...prev, ...valid]);
    setGenError("");
    setGenSuccess("");
    setGeneratedQuestions([]);
    if (!folderName && valid.length > 0) {
      setFolderName(valid[0].name.replace(/\.(pdf|docx?|txt)$/i, "").replace(/[_-]/g, " "));
    }
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) addFiles(dropped);
  }, [folderName]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) addFiles(selected);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadAudioToS3 = async (file: File) => {
    setAudioUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type || "audio/mpeg", mediaType: "audio" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await fetch(data.data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "audio/mpeg" }, body: file });
      setAudioUrl(data.data.fileUrl);
    } catch (err: any) {
      setGenError("Failed to upload audio: " + (err.message || "Unknown error"));
    } finally {
      setAudioUploading(false);
    }
  };

  const handleAudioInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAudioFile(f);
    setGenError("");
    await uploadAudioToS3(f);
  };

  // ─── Generate Questions ──────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (files.length === 0) return;
    setGenerating(true);
    setGenError("");
    setGenSuccess("");
    setGeneratedQuestions([]);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("file", f));
      formData.append("folderDomain", folderDomain);
      if (folderName.trim()) formData.append("folderName", folderName.trim());
      if (audioUrl) formData.append("audioUrl", audioUrl);

      const res = await fetch("/api/questions/auto-generate", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setGenError(data.error || "Failed to generate questions");
        return;
      }

      setGenSuccess(data.data.message);
      setGeneratedQuestions(data.data.questions || []);
      setGeneratedFolderId(data.data.folderId || "");
      fetchFolders(); // Refresh folder list
    } catch (err: any) {
      setGenError(err.message || "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const resetUpload = () => {
    setFiles([]);
    setAudioFile(null);
    setAudioUrl("");
    setFolderName("");
    setIsListeningTest(false);
    setGenSuccess("");
    setGeneratedQuestions([]);
    setGenError("");
    setShowUploadPanel(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  // ─── Delete Folder ───────────────────────────────────────────────────────
  const handleDeleteFolder = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteId(null);
        fetchFolders();
      }
    } catch {}
    setIsDeleting(false);
  };

  // ─── Filtered Folders ────────────────────────────────────────────────────
  const filteredFolders = folderSearch.trim()
    ? folders.filter((f) => f.name.toLowerCase().includes(folderSearch.toLowerCase()) || f.domain.toLowerCase().includes(folderSearch.toLowerCase()))
    : folders;

  const totalQuestions = folders.reduce((sum, f) => sum + f.questionCount, 0);

  return (
    <AuthGuard requiredRole="admin">
      <div className="space-y-6">
        {/* ═══ Header ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500 mt-0.5">Upload documents, AI creates questions automatically</p>
          </div>
          <button
            onClick={() => { setShowUploadPanel(true); setGenSuccess(""); setGeneratedQuestions([]); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-violet-200 transition-all hover:shadow-xl hover:shadow-violet-200 active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {/* ═══ Stats Strip ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: FolderOpen, label: "Folders", value: folders.length, color: "text-violet-600 bg-violet-50" },
            { icon: BookOpen, label: "Questions", value: totalQuestions, color: "text-blue-600 bg-blue-50" },
            { icon: Users, label: "Students", value: stats?.totalStudents ?? "—", color: "text-emerald-600 bg-emerald-50" },
            { icon: TrendingUp, label: "Avg Score", value: stats?.avgScore ? `${stats.avgScore}%` : "—", color: "text-amber-600 bg-amber-50" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ Upload Panel (Slide-down) ═══ */}
        {showUploadPanel && !genSuccess && (
          <div className="bg-white rounded-2xl border-2 border-violet-100 shadow-lg overflow-hidden animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">AI Auto-Generate</h2>
                  <p className="text-xs text-gray-500">Upload question papers — AI detects all formats automatically</p>
                </div>
              </div>
              <button onClick={resetUpload} className="p-2 rounded-lg hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragOver ? "border-violet-400 bg-violet-50" :
                  files.length > 0 ? "border-emerald-300 bg-emerald-50/30" :
                  "border-gray-200 hover:border-violet-300 hover:bg-violet-50/20"
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" multiple onChange={handleFileInput} className="hidden" />

                {files.length > 0 ? (
                  <div className="space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-medium text-gray-800">{f.name}</span>
                          <span className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="text-xs text-violet-600 font-medium hover:text-violet-700 inline-flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add more files
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-600 text-sm">Drop PDFs / Word docs here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">Supports PDF, DOCX, DOC, TXT — up to 20MB each</p>
                  </div>
                )}
              </div>

              {/* Settings Row */}
              {files.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Folder Name</label>
                      <input
                        type="text"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="e.g. IELTS Listening Test 1"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Domain</label>
                      <select
                        value={folderDomain}
                        onChange={(e) => setFolderDomain(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                      >
                        {DOMAINS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Listening Test Toggle */}
                  <div
                    onClick={() => setIsListeningTest(!isListeningTest)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                      isListeningTest ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Headphones className={`w-5 h-5 ${isListeningTest ? "text-indigo-600" : "text-gray-400"}`} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isListeningTest ? "text-indigo-900" : "text-gray-600"}`}>Listening Test</p>
                      <p className="text-[11px] text-gray-400">Attach audio (MP3) for listening comprehension</p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors ${isListeningTest ? "bg-indigo-500" : "bg-gray-300"}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${isListeningTest ? "ml-[18px]" : "ml-0.5"}`} />
                    </div>
                  </div>

                  {/* Audio Upload */}
                  {isListeningTest && (
                    <div className="space-y-2">
                      {audioFile && audioUrl ? (
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <Music className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-800 truncate flex-1">{audioFile.name}</span>
                          <button onClick={() => { setAudioFile(null); setAudioUrl(""); }} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : audioUploading ? (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                          <span className="text-sm text-indigo-700">Uploading audio...</span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => audioInputRef.current?.click()}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50 text-sm font-medium"
                          >
                            <Music className="w-4 h-4" /> Upload MP3
                          </button>
                          <input
                            type="url"
                            value={audioUrl}
                            onChange={(e) => setAudioUrl(e.target.value)}
                            placeholder="or paste audio URL..."
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 outline-none"
                          />
                        </div>
                      )}
                      <input ref={audioInputRef} type="file" accept=".mp3,.wav,.ogg,.webm,.aac,.m4a,audio/*" onChange={handleAudioInput} className="hidden" />
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={generating || (isListeningTest && audioUploading)}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-200"
                  >
                    {generating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> AI is parsing your documents...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate Questions</>
                    )}
                  </button>
                </>
              )}

              {genError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{genError}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ Generation Success ═══ */}
        {genSuccess && (
          <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-900">{genSuccess}</p>
                  <p className="text-xs text-emerald-600">Questions auto-detected and saved to folder</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/questions?folderId=${generatedFolderId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" /> View in Bank
                </Link>
                <button onClick={resetUpload} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50">
                  <Upload className="w-3.5 h-3.5" /> Upload Another
                </button>
              </div>
            </div>

            {/* Generated Questions Preview */}
            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
              {generatedQuestions.map((q, idx) => (
                <div key={q._id || idx} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <p className="flex-1 text-sm text-gray-700 line-clamp-1">{q.content.text}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${FORMAT_BADGES[q.answerFormat]?.bg || FORMAT_BADGES.text.bg} ${FORMAT_BADGES[q.answerFormat]?.text || FORMAT_BADGES.text.text}`}>
                        {q.answerFormat.replace(/_/g, " ")}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${DIFFICULTY_DOT[q.difficulty] || DIFFICULTY_DOT.medium}`} title={q.difficulty} />
                      {expandedQ === idx ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                  </button>

                  {expandedQ === idx && (
                    <div className="px-4 pb-3 border-t border-gray-50 pt-3 space-y-2 text-sm">
                      {q.content.instructions && (
                        <p className="text-xs italic text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">{q.content.instructions}</p>
                      )}
                      {q.content.wordLimit && (
                        <p className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">Limit: {q.content.wordLimit}</p>
                      )}
                      <p className="text-gray-600 whitespace-pre-wrap text-xs leading-relaxed">{q.content.text}</p>

                      {q.content.options && q.content.options.length > 0 && (
                        <div className="space-y-1">
                          {q.content.options.map((opt) => (
                            <div key={opt.label} className={`text-xs px-2.5 py-1 rounded ${opt.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-500"}`}>
                              <b>{opt.label}.</b> {opt.text}{opt.isCorrect && " \u2713"}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.content.blanks && q.content.blanks.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {q.content.blanks.map((b) => (
                            <span key={b.id} className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-[10px] font-medium">
                              Q{b.id}: {b.correctAnswer || "(pending)"}
                            </span>
                          ))}
                        </div>
                      )}

                      {q.content.matchingPairs && q.content.matchingPairs.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {q.content.matchingPairs.map((mp) => (
                            <span key={mp.id} className="bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded text-[10px] font-medium">
                              Q{mp.id}: {mp.item} \u2192 {mp.correctMatch || "(pending)"}
                            </span>
                          ))}
                        </div>
                      )}

                      {q.tags && q.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {q.tags.map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-[10px]">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Folders Section ═══ */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-violet-500" />
              Question Folders
              <span className="text-sm font-normal text-gray-400">({folders.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={folderSearch}
                  onChange={(e) => setFolderSearch(e.target.value)}
                  placeholder="Search folders..."
                  className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm w-48 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                />
              </div>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-violet-50 text-violet-600" : "text-gray-400 hover:bg-gray-50"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-violet-50 text-violet-600" : "text-gray-400 hover:bg-gray-50"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {foldersLoading ? (
            <div className="flex justify-center py-16">
              <BrandLoader fullPage={false} text="Loading folders..." />
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700 mb-1">
                {folderSearch ? "No matching folders" : "No folders yet"}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {folderSearch ? "Try a different search term" : "Upload a document to create your first question folder"}
              </p>
              {!folderSearch && (
                <button
                  onClick={() => setShowUploadPanel(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
                >
                  <Upload className="w-4 h-4" /> Upload Document
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* ─── Grid View ─── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFolders.map((folder) => {
                const domainGrad = DOMAIN_COLORS[folder.domain] || DOMAIN_COLORS.general;
                return (
                  <div key={folder._id} className="group bg-white rounded-xl border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all overflow-hidden">
                    {/* Card Header Gradient */}
                    <div className={`h-1.5 bg-gradient-to-r ${domainGrad}`} />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate" title={folder.name}>{folder.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{folder.domain}</span>
                            <span className="text-gray-200">&middot;</span>
                            <span className="text-[10px] text-gray-400">{new Date(folder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/questions?folderId=${folder._id}`}
                            className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"
                            title="View questions"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => setDeleteId(folder._id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete folder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Count */}
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="text-xl font-bold text-gray-900">{folder.questionCount}</span>
                        <span className="text-xs text-gray-400">questions</span>
                      </div>

                      {/* Tags */}
                      {folder.tags && folder.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {folder.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded font-medium">{tag}</span>
                          ))}
                          {folder.tags.length > 3 && (
                            <span className="text-[10px] text-gray-400">+{folder.tags.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Quick Action */}
                      <Link
                        href={`/admin/questions?folderId=${folder._id}`}
                        className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Open Question Bank
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ─── List View ─── */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Folder</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Domain</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Questions</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Created</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFolders.map((folder) => (
                    <tr key={folder._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${DOMAIN_COLORS[folder.domain] || DOMAIN_COLORS.general} flex items-center justify-center`}>
                            <FolderOpen className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{folder.name}</p>
                            {folder.tags && folder.tags.length > 0 && (
                              <div className="flex gap-1 mt-0.5">
                                {folder.tags.slice(0, 2).map((tag) => (
                                  <span key={tag} className="text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded">{tag}</span>
                                ))}
                                {folder.tags.length > 2 && <span className="text-[9px] text-gray-400">+{folder.tags.length - 2}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-medium text-gray-500 capitalize">{folder.domain}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-bold text-gray-900">{folder.questionCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-400">{new Date(folder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/questions?folderId=${folder._id}`}
                            className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteId(folder._id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ═══ Delete Confirmation Modal ═══ */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Delete Folder?</h3>
              <p className="text-sm text-gray-500 mb-5">
                This permanently deletes the folder and <span className="font-semibold text-red-600">all questions inside it</span>.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteId(null)} disabled={isDeleting} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                  Cancel
                </button>
                <button
                  onClick={() => deleteId && handleDeleteFolder(deleteId)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
