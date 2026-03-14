"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/layout/AuthGuard";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  FolderPlus,
  X,
  Loader2,
  BookOpen,
  Eye,
  ChevronDown,
  ChevronUp,
  Headphones,
  Music,
  Plus,
} from "lucide-react";

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

const DOMAINS = [
  { value: "general", label: "Auto-Detect" },
  { value: "english", label: "English" },
  { value: "math", label: "Mathematics" },
  { value: "aptitude", label: "Aptitude" },
  { value: "coding", label: "Coding" },
  { value: "hr", label: "HR" },
  { value: "situational", label: "Situational" },
  { value: "communication", label: "Communication" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

const TYPE_COLORS: Record<string, string> = {
  mcq: "bg-blue-100 text-blue-700",
  text: "bg-gray-100 text-gray-700",
  code: "bg-orange-100 text-orange-700",
  fill_in_blanks: "bg-purple-100 text-purple-700",
  matching: "bg-cyan-100 text-cyan-700",
  multi_select: "bg-pink-100 text-pink-700",
};

const VALID_DOC_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];
const VALID_DOC_EXTS = [".pdf", ".docx", ".doc", ".txt"];

export default function AutoGeneratePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioUploading, setAudioUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDomain, setFolderDomain] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [folderId, setFolderId] = useState("");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [textPreview, setTextPreview] = useState("");
  const [isListeningTest, setIsListeningTest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const isValidDoc = (f: File) => {
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    return (VALID_DOC_TYPES.includes(f.type) || VALID_DOC_EXTS.includes(ext)) && f.size <= 20 * 1024 * 1024;
  };

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter(isValidDoc);
    if (valid.length === 0) {
      setError("Please upload PDF, DOCX, DOC, or TXT files (max 20MB each).");
      return;
    }
    setFiles((prev) => [...prev, ...valid]);
    setError("");
    setSuccess("");
    setQuestions([]);
    if (!folderName && valid.length > 0) {
      setFolderName(valid[0].name.replace(/\.(pdf|docx?|txt)$/i, "").replace(/[_-]/g, " "));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length) addFiles(droppedFiles);
  }, [folderName]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

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
      setError("Failed to upload audio: " + (err.message || "Unknown error"));
    } finally {
      setAudioUploading(false);
    }
  };

  const handleAudioInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAudioFile(f);
    setError("");
    await uploadAudioToS3(f);
  };

  const handleGenerate = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setQuestions([]);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("file", f));
      formData.append("folderDomain", folderDomain);
      if (folderName.trim()) formData.append("folderName", folderName.trim());
      if (audioUrl) formData.append("audioUrl", audioUrl);

      const res = await fetch("/api/questions/auto-generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to generate questions");
        return;
      }

      setSuccess(data.data.message);
      setQuestions(data.data.questions || []);
      setFolderId(data.data.folderId || "");
      setTextPreview(data.data.extractedTextPreview || "");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setFiles([]);
    setAudioFile(null);
    setAudioUrl("");
    setFolderName("");
    setIsListeningTest(false);
    setSuccess("");
    setQuestions([]);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Auto-Generate Questions</h1>
                <p className="text-sm text-gray-500">Upload question papers (PDF/Word) — AI parses all question types automatically</p>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          {!success && (
            <div className="space-y-6">
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver ? "border-purple-400 bg-purple-50"
                    : files.length > 0 ? "border-green-300 bg-green-50/50"
                    : "border-gray-300 bg-white hover:border-purple-300 hover:bg-purple-50/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />

                {files.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                      <FileText className="w-5 h-5" />
                      <span className="font-semibold text-sm">{files.length} file{files.length > 1 ? "s" : ""} uploaded</span>
                    </div>
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-800">{f.name}</span>
                          <span className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="p-1 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="inline-flex items-center gap-1.5 text-xs text-purple-600 font-medium hover:text-purple-700"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add more files
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700">Drop your question papers here or click to browse</p>
                    <p className="text-sm text-gray-400 mt-2">Upload one or multiple PDFs (Part 1, Part 2, etc.) — up to 20MB each</p>
                  </>
                )}
              </div>

              {/* Settings */}
              {files.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-purple-500" /> Test Settings
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Folder Name</label>
                      <input
                        type="text"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="e.g. IELTS Listening Test 1"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Domain</label>
                      <select
                        value={folderDomain}
                        onChange={(e) => setFolderDomain(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                      >
                        {DOMAINS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Listening Test Toggle */}
                  <div
                    onClick={() => setIsListeningTest(!isListeningTest)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isListeningTest ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isListeningTest ? "bg-indigo-200" : "bg-gray-200"}`}>
                      <Headphones className={`w-5 h-5 ${isListeningTest ? "text-indigo-700" : "text-gray-500"}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isListeningTest ? "text-indigo-900" : "text-gray-700"}`}>
                        This is a Listening Test
                      </p>
                      <p className="text-xs text-gray-500">Attach an audio (MP3) file for listening comprehension</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors ${isListeningTest ? "bg-indigo-500" : "bg-gray-300"}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${isListeningTest ? "ml-[18px]" : "ml-0.5"}`} />
                    </div>
                  </div>

                  {/* Audio Upload */}
                  {isListeningTest && (
                    <div className="space-y-3">
                      {audioFile && audioUrl ? (
                        <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                          <Music className="w-5 h-5 text-indigo-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-indigo-900 truncate">{audioFile.name}</p>
                            <p className="text-xs text-indigo-500">Uploaded to S3</p>
                          </div>
                          <button onClick={() => { setAudioFile(null); setAudioUrl(""); }} className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : audioUploading ? (
                        <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                          <p className="text-sm text-indigo-700">Uploading audio file...</p>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => audioInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Music className="w-5 h-5" />
                            <span className="text-sm font-medium">Upload Audio File (MP3, WAV, etc.)</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400">or paste audio URL</span>
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>
                          <input
                            type="url"
                            value={audioUrl}
                            onChange={(e) => setAudioUrl(e.target.value)}
                            placeholder="https://your-bucket.s3.amazonaws.com/audio.mp3"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                          />
                        </>
                      )}
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept=".mp3,.wav,.ogg,.webm,.aac,.m4a,audio/*"
                        onChange={handleAudioInput}
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={loading || (isListeningTest && audioUploading)}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        AI is parsing your question papers...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Parse & Generate Questions
                      </>
                    )}
                  </button>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Success + Generated Questions */}
          {success && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-800 font-medium">{success}</p>
                  <div className="flex gap-3 mt-3">
                    <Link
                      href={`/admin/questions?folderId=${folderId}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" /> View in Question Bank
                    </Link>
                    <button
                      onClick={resetAll}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" /> Upload Another
                    </button>
                  </div>
                </div>
              </div>

              {textPreview && (
                <details className="bg-white rounded-xl border border-gray-200">
                  <summary className="px-5 py-3 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Extracted Text Preview
                  </summary>
                  <div className="px-5 pb-4">
                    <pre className="text-xs text-gray-500 whitespace-pre-wrap max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3">
                      {textPreview}
                    </pre>
                  </div>
                </details>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Generated Question Groups ({questions.length})
                </h3>

                {questions.map((q, idx) => (
                  <div key={q._id || idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                      className="w-full px-5 py-3.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <p className="flex-1 text-sm text-gray-800 line-clamp-1">{q.content.text}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        {q.type === "audio" && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">listening</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[q.answerFormat] || TYPE_COLORS.text}`}>
                          {q.answerFormat.replace(/_/g, " ")}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.medium}`}>
                          {q.difficulty}
                        </span>
                        {expandedQ === idx ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {expandedQ === idx && (
                      <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-3">
                        {q.content.instructions && (
                          <p className="text-xs italic text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">{q.content.instructions}</p>
                        )}
                        {q.content.wordLimit && (
                          <p className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">Word limit: {q.content.wordLimit}</p>
                        )}
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.content.text}</p>

                        {q.content.options && q.content.options.length > 0 && (
                          <div className="space-y-1.5">
                            {q.content.options.map((opt) => (
                              <div key={opt.label} className={`text-sm px-3 py-1.5 rounded-lg ${opt.isCorrect ? "bg-green-50 text-green-700 font-medium" : "bg-gray-50 text-gray-600"}`}>
                                <span className="font-medium">{opt.label}.</span> {opt.text} {opt.isCorrect && " ✓"}
                              </div>
                            ))}
                          </div>
                        )}

                        {q.content.blanks && q.content.blanks.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Blanks: </span>
                            {q.content.blanks.map((b) => (
                              <span key={b.id} className="inline-block bg-purple-50 text-purple-700 px-2 py-0.5 rounded mr-2 mb-1 text-xs">
                                Q{b.id}: {b.correctAnswer || "(answer needed)"}
                              </span>
                            ))}
                          </div>
                        )}

                        {q.content.matchingPairs && q.content.matchingPairs.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Match items: </span>
                            {q.content.matchingPairs.map((mp) => (
                              <span key={mp.id} className="inline-block bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded mr-2 mb-1 text-xs">
                                Q{mp.id}: {mp.item} → {mp.correctMatch || "(answer needed)"}
                              </span>
                            ))}
                          </div>
                        )}

                        {q.content.multiSelectCorrect && q.content.multiSelectCorrect.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Correct: </span>
                            {q.content.multiSelectCorrect.map((c) => (
                              <span key={c} className="inline-block bg-pink-50 text-pink-700 px-2 py-0.5 rounded mr-1 text-xs font-medium">{c}</span>
                            ))}
                          </div>
                        )}

                        {q.tags && q.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {q.tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{tag}</span>
                            ))}
                          </div>
                        )}

                        <div className="text-xs text-gray-400">Domain: {q.domain} · Type: {q.type} · Format: {q.answerFormat}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
