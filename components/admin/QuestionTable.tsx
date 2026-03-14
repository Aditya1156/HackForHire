"use client";

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BrandLoader from "@/components/ui/BrandLoader";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileText,
  Mic,
  Code,
  Image as ImageIcon,
  Headphones,
  PenLine,
  Shuffle,
  ListChecks,
  Search,
  FolderOpen,
  X,
  RotateCcw,
  Plus,
  ArrowLeft,
  Tag,
} from "lucide-react";

interface Question {
  _id: string;
  domain: string;
  type: string;
  difficulty: string;
  content: { text: string; options?: { label: string; text: string; isCorrect: boolean }[]; blanks?: { id: number; correctAnswer: string }[] };
  rubric: { maxScore: number };
  tags?: string[];
  folderId: { _id: string; name: string } | null;
  createdAt: string;
}

interface Folder {
  _id: string;
  name: string;
  tags?: string[];
  questionCount?: number;
}

interface Filters {
  domain: string;
  difficulty: string;
  type: string;
  search: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string; bg: string; iconBg: string }> = {
  text:           { icon: FileText,   label: "Text",      color: "text-blue-600",   bg: "bg-blue-50",   iconBg: "bg-blue-100" },
  mcq:            { icon: ListChecks, label: "MCQ",       color: "text-violet-600", bg: "bg-violet-50", iconBg: "bg-violet-100" },
  image:          { icon: ImageIcon,  label: "Image",     color: "text-green-600",  bg: "bg-green-50",  iconBg: "bg-green-100" },
  audio:          { icon: Headphones, label: "Listening",  color: "text-amber-600",  bg: "bg-amber-50",  iconBg: "bg-amber-100" },
  code:           { icon: Code,       label: "Coding",    color: "text-orange-600", bg: "bg-orange-50", iconBg: "bg-orange-100" },
  voice:          { icon: Mic,        label: "Speech",    color: "text-pink-600",   bg: "bg-pink-50",   iconBg: "bg-pink-100" },
  letter_writing: { icon: PenLine,    label: "Writing",   color: "text-teal-600",   bg: "bg-teal-50",   iconBg: "bg-teal-100" },
  mixed:          { icon: Shuffle,    label: "Mixed",     color: "text-gray-600",   bg: "bg-gray-50",   iconBg: "bg-gray-100" },
};

const DOMAIN_COLORS: Record<string, string> = {
  english: "bg-blue-100 text-blue-700",
  math: "bg-emerald-100 text-emerald-700",
  aptitude: "bg-purple-100 text-purple-700",
  coding: "bg-orange-100 text-orange-700",
  hr: "bg-pink-100 text-pink-700",
  situational: "bg-amber-100 text-amber-700",
  general: "bg-gray-100 text-gray-700",
  communication: "bg-cyan-100 text-cyan-700",
};

const DIFFICULTY_COLORS: Record<string, { dot: string; text: string }> = {
  easy:   { dot: "bg-green-500",  text: "text-green-700" },
  medium: { dot: "bg-amber-500",  text: "text-amber-700" },
  hard:   { dot: "bg-red-500",    text: "text-red-700" },
};

export default function QuestionTable() {
  const searchParams = useSearchParams();
  const urlFolderId = searchParams.get("folderId") || "";

  const [rawQuestions, setRawQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filters, setFilters] = useState<Filters>({
    domain: "", difficulty: "", type: "", search: "",
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // The active folder ID — either from URL or from user selection
  const [activeFolderId, setActiveFolderId] = useState(urlFolderId);

  // Debounce search input to avoid excessive re-fetches
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync with URL param on mount
  useEffect(() => {
    if (urlFolderId) setActiveFolderId(urlFolderId);
  }, [urlFolderId]);

  const activeFolder = useMemo(
    () => folders.find((f) => f._id === activeFolderId),
    [folders, activeFolderId]
  );

  const fetchFolders = useCallback(() => {
    fetch("/api/folders").then((r) => r.json()).then((d) => {
      if (d.success) setFolders(d.data.folders);
    }).catch(() => {});
  }, []);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (activeFolderId) params.set("folderId", activeFolderId);
      if (filters.domain) params.set("domain", filters.domain);
      if (filters.difficulty) params.set("difficulty", filters.difficulty);

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");

      setRawQuestions(data.data.questions);
      setTotal(data.data.total);
      setPages(data.data.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  }, [page, filters.domain, filters.difficulty, activeFolderId]);

  // Client-side filtering with useMemo to avoid recalculating on every render
  const questions = useMemo(() => {
    let qs = rawQuestions;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      qs = qs.filter((item) => item.content.text.toLowerCase().includes(q));
    }
    if (filters.type) {
      qs = qs.filter((item) => item.type === filters.type);
    }
    return qs;
  }, [rawQuestions, debouncedSearch, filters.type]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);
  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setDeleteId(null);
      fetchQuestions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }

  function updateFilter(key: keyof Filters, value: string) {
    if (key === "search") {
      setFilters((prev) => ({ ...prev, search: value }));
      // Debounce search filtering
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedSearch(value);
      }, 300);
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters({ domain: "", difficulty: "", type: "", search: "" });
    setDebouncedSearch("");
    clearTimeout(debounceTimerRef.current);
    setPage(1);
  }

  const hasFilters = filters.domain || filters.difficulty || filters.type || filters.search;

  return (
    <div>
      {/* ── Folder Context Header ── */}
      {!activeFolderId ? (
        /* No folder selected → show folder picker grid */
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Select a Folder</p>
          {folders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No folders yet. Create one from the Folders page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {folders.map((f) => (
                <button
                  key={f._id}
                  onClick={() => { setActiveFolderId(f._id); setPage(1); }}
                  className="bg-white rounded-2xl border border-gray-200 hover:border-violet-300 hover:shadow-md p-4 text-left transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                      <FolderOpen className="w-4.5 h-4.5 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{f.name}</h3>
                      <p className="text-xs text-gray-400">{f.questionCount ?? 0} questions</p>
                    </div>
                  </div>
                  {f.tags && f.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {f.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[9px] bg-violet-50 text-violet-500 px-1.5 py-0.5 rounded font-medium">
                          {tag}
                        </span>
                      ))}
                      {f.tags.length > 3 && (
                        <span className="text-[9px] text-gray-400">+{f.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Folder selected → show context bar */
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-5 flex items-center gap-4">
          <button
            onClick={() => { setActiveFolderId(""); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-violet-600 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            All Folders
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-4.5 h-4.5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">{activeFolder?.name || "Folder"}</h2>
              {activeFolder?.tags && activeFolder.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Tag className="w-3 h-3 text-violet-400" />
                  <span className="text-xs text-violet-500 truncate">
                    {activeFolder.tags.slice(0, 4).join(", ")}
                    {activeFolder.tags.length > 4 && ` +${activeFolder.tags.length - 4}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Link
            href={`/admin/questions/new?folderId=${activeFolderId}`}
            className="btn-primary flex items-center gap-2 flex-shrink-0 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add to Folder
          </Link>
        </div>
      )}

      {/* Only show questions list when a folder is selected */}
      {activeFolderId && (
        <>
          {/* ── Type Quick Filter Chips ── */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => updateFilter("type", "")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
                ${!filters.type ? "bg-violet-600 text-white border-violet-600 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600"}`}
            >
              All Types
            </button>
            {Object.entries(TYPE_CONFIG).map(([id, cfg]) => {
              const Icon = cfg.icon;
              const active = filters.type === id;
              return (
                <button
                  key={id}
                  onClick={() => updateFilter("type", active ? "" : id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
                    ${active
                      ? `${cfg.iconBg} ${cfg.color} border-current shadow-sm`
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </button>
              );
            })}
          </div>


          {/* ── Count ── */}
          <p className="text-sm text-gray-500 mb-4">
            {isLoading ? "Loading..." : `${total} question${total !== 1 ? "s" : ""}`}
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <BrandLoader fullPage={false} />
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No questions in this folder</h3>
              <p className="text-sm text-gray-400 mb-6">Add your first question to get started.</p>
              <Link
                href={`/admin/questions/new?folderId=${activeFolderId}`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </Link>
            </div>
          ) : (
            /* ── Card Grid ── */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {questions.map((q) => (
                <QuestionGridCard key={q._id} question={q} onDelete={setDeleteId} activeFolderId={activeFolderId} />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-6 px-1">
              <span className="text-sm text-gray-500">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Delete Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Question?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. The question will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting...</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Memoized question card for the grid to prevent unnecessary re-renders */
const QuestionGridCard = memo(function QuestionGridCard({
  question: q,
  onDelete,
  activeFolderId,
}: {
  question: Question;
  onDelete: (id: string) => void;
  activeFolderId: string;
}) {
  const typeCfg = TYPE_CONFIG[q.type] || TYPE_CONFIG.text;
  const TypeIcon = typeCfg.icon;
  const diffCfg = DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.medium;
  const domainColor = DOMAIN_COLORS[q.domain] || DOMAIN_COLORS.general;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Card Header */}
      <div className="p-4 pb-0 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeCfg.iconBg} ${typeCfg.color}`}>
          <TypeIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.color}`}>
              {typeCfg.label}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${domainColor}`}>
              {q.domain}
            </span>
            <span className={`text-[10px] font-semibold flex items-center gap-1 ${diffCfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${diffCfg.dot}`} />
              {q.difficulty}
            </span>
          </div>
          <p className="text-sm text-gray-900 leading-snug line-clamp-3">
            {q.content.text}
          </p>
        </div>
      </div>

      {/* MCQ Options Preview */}
      {q.type === "mcq" && q.content.options && q.content.options.length > 0 && (
        <div className="px-4 pt-2">
          <div className="flex flex-wrap gap-1">
            {q.content.options.map((opt) => (
              <span
                key={opt.label}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                  ${opt.isCorrect ? "bg-green-100 text-green-700 ring-1 ring-green-300" : "bg-gray-100 text-gray-500"}`}
              >
                {opt.label}: {opt.text.length > 20 ? opt.text.slice(0, 20) + "..." : opt.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Blanks Preview */}
      {q.content.blanks && q.content.blanks.length > 0 && (
        <div className="px-4 pt-2">
          <span className="text-[10px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
            {q.content.blanks.length} blank{q.content.blanks.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Card Footer */}
      <div className="mt-auto p-4 pt-3">
        {q.tags && q.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {q.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[9px] bg-violet-50 text-violet-600 border border-violet-100 px-1.5 py-0.5 rounded font-medium">
                {tag}
              </span>
            ))}
            {q.tags.length > 3 && (
              <span className="text-[9px] text-gray-400 font-medium">+{q.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-600">{q.rubric.maxScore} pts</span>
          <div className="flex items-center gap-1">
            <Link
              href={`/admin/questions/${q._id}/edit`}
              className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => onDelete(q._id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
