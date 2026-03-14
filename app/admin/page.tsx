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
  Brain,
  Rocket,
  ArrowUpRight,
  Calendar,
  Award,
  Star,
  Hash,
  Activity,
  GraduationCap,
  Globe,
  EyeOff,
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

  // Edit folder modal
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);

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
  const [folderTags, setFolderTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [publishOnCreate, setPublishOnCreate] = useState(true);

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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mediaType", "audio");
      const res = await fetch("/api/upload/direct", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
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
      if (folderTags.length > 0) formData.append("folderTags", folderTags.join(","));
      formData.append("isPublished", String(publishOnCreate));

      const res = await fetch("/api/questions/auto-generate", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setGenError(data.error || "Failed to generate questions");
        return;
      }

      setGenSuccess(data.data.message);
      setGeneratedQuestions(data.data.questions || []);
      setGeneratedFolderId(data.data.folderId || "");
      fetchFolders();
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
    setFolderTags([]);
    setTagInput("");
    setPublishOnCreate(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  // ─── Toggle Publish ─────────────────────────────────────────────────────
  const togglePublish = async (folder: Folder) => {
    try {
      const res = await fetch(`/api/folders/${folder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !folder.isPublished }),
      });
      if (res.ok) fetchFolders();
    } catch {}
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

  // ─── Edit Folder ───────────────────────────────────────────────────────
  const openEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setEditName(folder.name);
    setEditTags(folder.tags || []);
    setEditTagInput("");
  };

  const saveEditFolder = async () => {
    if (!editingFolder) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/folders/${editingFolder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, tags: editTags }),
      });
      if (res.ok) {
        setEditingFolder(null);
        fetchFolders();
      }
    } catch {}
    setEditSaving(false);
  };

  // ─── Filtered Folders ────────────────────────────────────────────────────
  const filteredFolders = folderSearch.trim()
    ? folders.filter((f) => f.name.toLowerCase().includes(folderSearch.toLowerCase()) || f.domain.toLowerCase().includes(folderSearch.toLowerCase()))
    : folders;

  const totalQuestions = folders.reduce((sum, f) => sum + f.questionCount, 0);

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gray-50/50">
        {/* ═══ Hero Banner ═══ */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-900">
          {/* Decorative grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          {/* Decorative blur orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-10 w-60 h-60 bg-purple-500/10 rounded-full blur-2xl" />

          <div className="relative px-6 sm:px-8 lg:px-12 py-12 sm:py-16">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-violet-300" />
                  </div>
                  <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-violet-400/50 to-transparent" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Admin Console
                </h1>
                <p className="text-violet-200/70 mt-2 text-sm sm:text-base max-w-md">
                  Upload documents and let AI auto-generate question banks with intelligent format detection.
                </p>
              </div>
              <button
                onClick={() => { setShowUploadPanel(true); setGenSuccess(""); setGeneratedQuestions([]); }}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-white hover:bg-gray-50 text-slate-900 rounded-xl font-semibold text-sm shadow-lg shadow-black/20 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <Upload className="w-4 h-4" />
                Upload Document
                <ArrowUpRight className="w-4 h-4 opacity-50" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 -mt-8 relative z-10 space-y-8 pb-12">
          {/* ═══ Stats Cards ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Folders - White card */}
            <div className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-violet-50 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200/50 mb-3">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-black text-gray-900 tracking-tight">{folders.length}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5 uppercase tracking-wider">Folders</p>
              </div>
            </div>

            {/* Questions - White card */}
            <div className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-200/50 mb-3">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-black text-gray-900 tracking-tight">{totalQuestions}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5 uppercase tracking-wider">Questions</p>
              </div>
            </div>

            {/* Students - Gradient card */}
            <div className="group rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-200/50 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-tr-full" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-black text-white tracking-tight">{stats?.totalStudents ?? "\u2014"}</p>
                <p className="text-xs text-emerald-100/80 font-medium mt-0.5 uppercase tracking-wider">Students</p>
              </div>
            </div>

            {/* Avg Score - Gradient card */}
            <div className="group rounded-2xl p-5 bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-200/50 hover:shadow-xl hover:shadow-amber-200/50 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-tr-full" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-black text-white tracking-tight">{stats?.avgScore ? `${stats.avgScore}%` : "\u2014"}</p>
                <p className="text-xs text-amber-100/80 font-medium mt-0.5 uppercase tracking-wider">Avg Score</p>
              </div>
            </div>
          </div>

          {/* ═══ Upload Panel ═══ */}
          {showUploadPanel && !genSuccess && (
            <div className="bg-white rounded-2xl border-2 border-violet-100 shadow-xl shadow-violet-100/30 overflow-hidden animate-in slide-in-from-top-2">
              {/* Gradient header bar */}
              <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-white">AI Auto-Generate</h2>
                      <p className="text-xs text-violet-200/80">Upload question papers — AI detects all formats automatically</p>
                    </div>
                  </div>
                  <button onClick={resetUpload} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    dragOver ? "border-violet-400 bg-violet-50/80 scale-[1.01]" :
                    files.length > 0 ? "border-emerald-300 bg-emerald-50/30" :
                    "border-gray-200 hover:border-violet-300 hover:bg-violet-50/20"
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" multiple onChange={handleFileInput} className="hidden" />

                  {files.length > 0 ? (
                    <div className="space-y-2">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="text-left">
                              <span className="text-sm font-medium text-gray-800 block">{f.name}</span>
                              <span className="text-[11px] text-gray-400">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="text-xs text-violet-600 font-semibold hover:text-violet-700 inline-flex items-center gap-1 mt-2">
                        <Plus className="w-3.5 h-3.5" /> Add more files
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-violet-300" />
                      </div>
                      <p className="font-semibold text-gray-700 text-sm">Drop PDFs / Word docs here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1.5">Supports PDF, DOCX, DOC, TXT — up to 20MB each</p>
                    </div>
                  )}
                </div>

                {/* Settings Row */}
                {files.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Folder Name</label>
                        <input
                          type="text"
                          value={folderName}
                          onChange={(e) => setFolderName(e.target.value)}
                          placeholder="e.g. IELTS Listening Test 1"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all bg-gray-50/50 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Domain</label>
                        <select
                          value={folderDomain}
                          onChange={(e) => setFolderDomain(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all bg-gray-50/50 focus:bg-white"
                        >
                          {DOMAINS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Tags Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Student Role Tags</label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {folderTags.map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                            {tag}
                            <button onClick={() => setFolderTags(folderTags.filter((t) => t !== tag))} className="hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = tagInput.trim();
                            if (val && !folderTags.includes(val)) {
                              setFolderTags([...folderTags, val]);
                              setTagInput("");
                            }
                          }
                        }}
                        placeholder="Type a role (e.g. SDE, Data Analyst) and press Enter..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Students with matching roles will see this folder. Leave empty for all students.</p>
                    </div>

                    {/* Publish Toggle */}
                    <div
                      onClick={() => setPublishOnCreate(!publishOnCreate)}
                      className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 cursor-pointer transition-all ${
                        publishOnCreate ? "border-emerald-300 bg-emerald-50/50 shadow-sm shadow-emerald-100" : "border-gray-100 hover:border-gray-200 bg-gray-50/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${publishOnCreate ? "bg-emerald-100" : "bg-gray-100"}`}>
                        {publishOnCreate ? <Globe className="w-5 h-5 text-emerald-600" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${publishOnCreate ? "text-emerald-900" : "text-gray-600"}`}>
                          {publishOnCreate ? "Visible to Students" : "Hidden from Students"}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {publishOnCreate ? "Students can see and take this test immediately" : "Only admins can see — publish later from folder settings"}
                        </p>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors relative ${publishOnCreate ? "bg-emerald-500" : "bg-gray-300"}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${publishOnCreate ? "left-[22px]" : "left-0.5"}`} />
                      </div>
                    </div>

                    {/* Listening Test Toggle */}
                    <div
                      onClick={() => setIsListeningTest(!isListeningTest)}
                      className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isListeningTest ? "border-indigo-300 bg-indigo-50/50 shadow-sm shadow-indigo-100" : "border-gray-100 hover:border-gray-200 bg-gray-50/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isListeningTest ? "bg-indigo-100" : "bg-gray-100"}`}>
                        <Headphones className={`w-5 h-5 ${isListeningTest ? "text-indigo-600" : "text-gray-400"}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${isListeningTest ? "text-indigo-900" : "text-gray-600"}`}>Listening Test</p>
                        <p className="text-[11px] text-gray-400">Attach audio (MP3) for listening comprehension</p>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors relative ${isListeningTest ? "bg-indigo-500" : "bg-gray-300"}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${isListeningTest ? "left-[22px]" : "left-0.5"}`} />
                      </div>
                    </div>

                    {/* Audio Upload */}
                    {isListeningTest && (
                      <div className="space-y-2">
                        {audioFile && audioUrl ? (
                          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Music className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="text-sm font-medium text-indigo-800 truncate flex-1">{audioFile.name}</span>
                            <button onClick={() => { setAudioFile(null); setAudioUrl(""); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : audioUploading ? (
                          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                            <span className="text-sm text-indigo-700 font-medium">Uploading audio...</span>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <button
                              onClick={() => audioInputRef.current?.click()}
                              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:bg-indigo-50 text-sm font-semibold transition-colors"
                            >
                              <Music className="w-4 h-4" /> Upload MP3
                            </button>
                            <input
                              type="url"
                              value={audioUrl}
                              onChange={(e) => setAudioUrl(e.target.value)}
                              placeholder="or paste audio URL..."
                              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 outline-none transition-all"
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
                      className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-200/70 hover:shadow-xl hover:shadow-violet-300/50"
                    >
                      {generating ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> AI is parsing your documents...</>
                      ) : (
                        <><Rocket className="w-4 h-4" /> Generate Questions</>
                      )}
                    </button>
                  </>
                )}

                {genError && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-sm text-red-700 pt-1">{genError}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ Generation Success ═══ */}
          {genSuccess && (
            <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-xl shadow-emerald-100/30 overflow-hidden">
              {/* Green gradient header */}
              <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-6 py-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{genSuccess}</p>
                      <p className="text-xs text-emerald-100/80">Questions auto-detected and saved to folder</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/questions?folderId=${generatedFolderId}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> View in Bank
                    </Link>
                    <button onClick={resetUpload} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white rounded-xl text-xs font-bold hover:bg-white/25 transition-colors">
                      <Upload className="w-3.5 h-3.5" /> Upload Another
                    </button>
                  </div>
                </div>
              </div>

              {/* Generated Questions Preview */}
              <div className="p-5 space-y-2 max-h-[400px] overflow-y-auto">
                {generatedQuestions.map((q, idx) => (
                  <div key={q._id || idx} className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                    <button
                      onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50/80 transition-colors"
                    >
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                        {idx + 1}
                      </span>
                      <p className="flex-1 text-sm text-gray-700 line-clamp-1 font-medium">{q.content.text}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${FORMAT_BADGES[q.answerFormat]?.bg || FORMAT_BADGES.text.bg} ${FORMAT_BADGES[q.answerFormat]?.text || FORMAT_BADGES.text.text}`}>
                          {q.answerFormat.replace(/_/g, " ")}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${DIFFICULTY_DOT[q.difficulty] || DIFFICULTY_DOT.medium} ring-2 ring-white shadow-sm`} title={q.difficulty} />
                        {expandedQ === idx ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {expandedQ === idx && (
                      <div className="px-5 pb-4 border-t border-gray-50 pt-3 space-y-2.5 text-sm">
                        {q.content.instructions && (
                          <p className="text-xs italic text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">{q.content.instructions}</p>
                        )}
                        {q.content.wordLimit && (
                          <p className="text-xs font-semibold text-orange-600 bg-orange-50 px-4 py-2 rounded-lg border border-orange-100">Limit: {q.content.wordLimit}</p>
                        )}
                        <p className="text-gray-600 whitespace-pre-wrap text-xs leading-relaxed">{q.content.text}</p>

                        {q.content.options && q.content.options.length > 0 && (
                          <div className="space-y-1.5">
                            {q.content.options.map((opt) => (
                              <div key={opt.label} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${opt.isCorrect ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-50 text-gray-500 border border-gray-100"}`}>
                                <b>{opt.label}.</b> {opt.text}{opt.isCorrect && " \u2713"}
                              </div>
                            ))}
                          </div>
                        )}

                        {q.content.blanks && q.content.blanks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {q.content.blanks.map((b) => (
                              <span key={b.id} className="bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-purple-100">
                                Q{b.id}: {b.correctAnswer || "(pending)"}
                              </span>
                            ))}
                          </div>
                        )}

                        {q.content.matchingPairs && q.content.matchingPairs.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {q.content.matchingPairs.map((mp) => (
                              <span key={mp.id} className="bg-cyan-50 text-cyan-600 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-cyan-100">
                                Q{mp.id}: {mp.item} &rarr; {mp.correctMatch || "(pending)"}
                              </span>
                            ))}
                          </div>
                        )}

                        {q.tags && q.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {q.tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-500 rounded-md text-[10px] font-medium border border-gray-100">
                                <Hash className="w-2.5 h-2.5 inline -mt-px mr-0.5" />{tag}
                              </span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200/50">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Question Folders</h2>
                  <p className="text-xs text-gray-400">{folders.length} folders &middot; {totalQuestions} questions total</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={folderSearch}
                    onChange={(e) => setFolderSearch(e.target.value)}
                    placeholder="Search folders..."
                    className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm w-52 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-white shadow-sm transition-all"
                  />
                </div>
                <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-violet-50 text-violet-600" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-violet-50 text-violet-600" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {foldersLoading ? (
              <div className="flex justify-center py-20">
                <BrandLoader fullPage={false} text="Loading folders..." />
              </div>
            ) : filteredFolders.length === 0 ? (
              /* ─── Empty State ─── */
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
                  <FolderOpen className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="font-bold text-gray-700 text-lg mb-1.5">
                  {folderSearch ? "No matching folders" : "No folders yet"}
                </h3>
                <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
                  {folderSearch ? "Try a different search term" : "Upload a document to create your first question folder and let AI do the rest."}
                </p>
                {!folderSearch && (
                  <button
                    onClick={() => setShowUploadPanel(true)}
                    className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-200/50 transition-all hover:shadow-xl"
                  >
                    <Upload className="w-4 h-4" /> Upload Document
                  </button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              /* ─── Grid View ─── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredFolders.map((folder) => {
                  const domainGrad = DOMAIN_COLORS[folder.domain] || DOMAIN_COLORS.general;
                  return (
                    <div key={folder._id} className="group bg-white rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all overflow-hidden">
                      {/* Thin gradient top stripe */}
                      <div className={`h-1 bg-gradient-to-r ${domainGrad}`} />

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${domainGrad} flex items-center justify-center shadow-sm shrink-0`}>
                              <FolderOpen className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-900 text-sm truncate" title={folder.name}>{folder.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{folder.domain}</span>
                                <span className="text-gray-200">&middot;</span>
                                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {new Date(folder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/admin/questions?folderId=${folder._id}`}
                              className="p-2 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"
                              title="View questions"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => openEditFolder(folder)}
                              className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit folder"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(folder._id)}
                              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete folder"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Publish Badge + Question Count */}
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => togglePublish(folder)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                              folder.isPublished
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {folder.isPublished ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {folder.isPublished ? "Published" : "Hidden"}
                          </button>
                        </div>
                        <div className="flex items-center gap-2.5 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl px-4 py-3">
                          <BookOpen className="w-4 h-4 text-violet-500" />
                          <span className="text-2xl font-black text-gray-900">{folder.questionCount}</span>
                          <span className="text-xs text-gray-400 font-medium">questions</span>
                        </div>

                        {/* Tags */}
                        {folder.tags && folder.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {folder.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[10px] bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-600 px-2 py-0.5 rounded-md font-bold border border-violet-100">
                                {tag}
                              </span>
                            ))}
                            {folder.tags.length > 3 && (
                              <span className="text-[10px] text-gray-400 font-medium self-center">+{folder.tags.length - 3}</span>
                            )}
                          </div>
                        )}

                        {/* Quick Action */}
                        <Link
                          href={`/admin/questions?folderId=${folder._id}`}
                          className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 text-violet-700 rounded-xl text-xs font-bold transition-colors border border-violet-100/50"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Question Bank
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ─── List View ─── */
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-left">Folder</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Domain</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Questions</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Created</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredFolders.map((folder) => (
                      <tr key={folder._id} className="hover:bg-violet-50/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${DOMAIN_COLORS[folder.domain] || DOMAIN_COLORS.general} flex items-center justify-center shadow-sm`}>
                              <FolderOpen className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{folder.name}</p>
                              {folder.tags && folder.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {folder.tags.slice(0, 2).map((tag) => (
                                    <span key={tag} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-medium">{tag}</span>
                                  ))}
                                  {folder.tags.length > 2 && <span className="text-[9px] text-gray-400 font-medium self-center">+{folder.tags.length - 2}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${DOMAIN_COLORS[folder.domain] || DOMAIN_COLORS.general} text-white`}>
                            {folder.domain}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => togglePublish(folder)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                              folder.isPublished
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {folder.isPublished ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {folder.isPublished ? "Published" : "Hidden"}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-lg font-black text-gray-900">{folder.questionCount}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-xs text-gray-400 font-medium">{new Date(folder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/questions?folderId=${folder._id}`}
                              className="p-2 rounded-lg hover:bg-violet-100 text-gray-400 hover:text-violet-600 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => openEditFolder(folder)}
                              className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit folder"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(folder._id)}
                              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
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
        </div>

        {/* ═══ Edit Folder Modal ═══ */}
        {editingFolder && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-md">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Edit Folder</h3>
                  <p className="text-xs text-gray-400">Update name and tags</p>
                </div>
                <button onClick={() => setEditingFolder(null)} className="ml-auto p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Folder Name */}
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Folder Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all mb-5"
              />

              {/* Tags */}
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px]">
                {editTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-violet-100">
                    {tag}
                    <button onClick={() => setEditTags(editTags.filter((t) => t !== tag))} className="hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editTagInput.trim()) {
                      e.preventDefault();
                      if (!editTags.includes(editTagInput.trim())) {
                        setEditTags([...editTags, editTagInput.trim()]);
                      }
                      setEditTagInput("");
                    }
                  }}
                  placeholder="Type tag and press Enter"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                />
                <button
                  onClick={() => {
                    if (editTagInput.trim() && !editTags.includes(editTagInput.trim())) {
                      setEditTags([...editTags, editTagInput.trim()]);
                      setEditTagInput("");
                    }
                  }}
                  className="px-3 py-2 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-xl text-sm font-bold transition-colors border border-violet-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingFolder(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditFolder}
                  disabled={editSaving || !editName.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-200/50 transition-all"
                >
                  {editSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle2 className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Delete Confirmation Modal ═══ */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 border border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg text-center mb-2">Delete Folder?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                This permanently deletes the folder and <span className="font-bold text-red-600">all questions inside it</span>. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => deleteId && handleDeleteFolder(deleteId)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-200/50 transition-all"
                >
                  {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Delete</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
