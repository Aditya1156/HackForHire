"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";

interface Question {
  _id: string;
  domain: string;
  type: string;
  difficulty: string;
  content: { text: string };
  rubric: { maxScore: number };
  folderId: { _id: string; name: string } | null;
  createdAt: string;
}

interface Folder {
  _id: string;
  name: string;
}

interface Filters {
  domain: string;
  difficulty: string;
  folderId: string;
  search: string;
}

const DOMAIN_BADGE: Record<string, string> = {
  english: "badge badge-english",
  math: "badge badge-math",
  aptitude: "badge badge-aptitude",
  coding: "badge badge-coding",
  hr: "badge badge-hr",
  situational: "badge bg-gray-100 text-gray-700",
};

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: "badge badge-easy",
  medium: "badge badge-medium",
  hard: "badge badge-hard",
};

export default function QuestionTable() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filters, setFilters] = useState<Filters>({
    domain: "",
    difficulty: "",
    folderId: "",
    search: "",
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFolders = useCallback(() => {
    fetch("/api/folders")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setFolders(d.data.folders);
      })
      .catch(() => {});
  }, []);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (filters.domain) params.set("domain", filters.domain);
      if (filters.difficulty) params.set("difficulty", filters.difficulty);
      if (filters.folderId) params.set("folderId", filters.folderId);

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");

      let qs: Question[] = data.data.questions;

      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        qs = qs.filter((item) => item.content.text.toLowerCase().includes(q));
      }

      setQuestions(qs);
      setTotal(data.data.total);
      setPages(data.data.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

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
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  return (
    <div>
      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="label text-xs">Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search question text…"
            className="input-field"
          />
        </div>
        <div className="min-w-[150px]">
          <label className="label text-xs">Domain</label>
          <select
            value={filters.domain}
            onChange={(e) => updateFilter("domain", e.target.value)}
            className="input-field"
          >
            <option value="">All domains</option>
            {["english", "math", "aptitude", "coding", "hr", "situational"].map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="label text-xs">Difficulty</label>
          <select
            value={filters.difficulty}
            onChange={(e) => updateFilter("difficulty", e.target.value)}
            className="input-field"
          >
            <option value="">All levels</option>
            {["easy", "medium", "hard"].map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="label text-xs">Folder</label>
          <select
            value={filters.folderId}
            onChange={(e) => updateFilter("folderId", e.target.value)}
            className="input-field"
          >
            <option value="">All folders</option>
            {folders.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setFilters({ domain: "", difficulty: "", folderId: "", search: "" });
            setPage(1);
          }}
          className="btn-secondary btn-sm"
        >
          Reset
        </button>
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500 mb-3">
        {isLoading ? "Loading…" : `${total} question${total !== 1 ? "s" : ""} found`}
      </p>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : questions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">No questions found. Adjust filters or create a new question.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Domain</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Difficulty</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 min-w-[260px]">Question</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Max Score</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Folder</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Created</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {questions.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={DOMAIN_BADGE[q.domain] ?? "badge bg-gray-100 text-gray-700"}>
                        {q.domain}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={DIFFICULTY_BADGE[q.difficulty] ?? "badge bg-gray-100 text-gray-700"}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{q.type}</td>
                    <td className="px-4 py-3 text-gray-900 max-w-xs">
                      {q.content.text.length > 80
                        ? q.content.text.slice(0, 80) + "…"
                        : q.content.text}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {q.rubric.maxScore}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {q.folderId?.name ?? <span className="text-gray-400 italic">None</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/questions/${q._id}/edit`}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(q._id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
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

          {/* Pagination */}
          {pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Page {page} of {pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-secondary btn-sm flex items-center gap-1 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                  className="btn-secondary btn-sm flex items-center gap-1 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Question?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. The question will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
