"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  BookOpen,
  Hash,
} from "lucide-react";

interface Folder {
  _id: string;
  name: string;
  domain: string;
  questionCount: number;
  fetchCount: number;
  createdAt: string;
}

interface FolderFormData {
  name: string;
  domain: string;
  fetchCount: number;
}

const DOMAINS = ["english", "math", "aptitude", "coding", "hr", "situational"] as const;

const DOMAIN_BADGE: Record<string, string> = {
  english: "badge badge-english",
  math: "badge badge-math",
  aptitude: "badge badge-aptitude",
  coding: "badge badge-coding",
  hr: "badge badge-hr",
  situational: "badge bg-gray-100 text-gray-700",
};

const defaultForm: FolderFormData = { name: "", domain: "english", fetchCount: 10 };

export default function FolderManager() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editFolder, setEditFolder] = useState<Folder | null>(null);
  const [form, setForm] = useState<FolderFormData>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFolders = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/folders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setFolders(data.data.folders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load folders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  function openCreate() {
    setEditFolder(null);
    setForm(defaultForm);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(folder: Folder) {
    setEditFolder(folder);
    setForm({ name: folder.name, domain: folder.domain, fetchCount: folder.fetchCount });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditFolder(null);
    setFormError("");
  }

  function validateForm(): string | null {
    if (!form.name.trim()) return "Folder name is required.";
    if (!form.domain) return "Domain is required.";
    if (form.fetchCount < 1) return "Fetch count must be at least 1.";
    return null;
  }

  async function handleSave() {
    const valError = validateForm();
    if (valError) {
      setFormError(valError);
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      const url = editFolder ? `/api/folders/${editFolder._id}` : "/api/folders";
      const method = editFolder ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      closeModal();
      fetchFolders();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setDeleteId(null);
      fetchFolders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header mb-1">Question Folders</h1>
          <p className="text-sm text-gray-500">
            Organise questions by domain and configure fetch settings.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Folder
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : folders.length === 0 ? (
        <div className="card p-16 text-center">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No folders yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Create your first folder to start organising questions.
          </p>
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Folder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {folders.map((folder) => (
            <div key={folder._id} className="card-hover p-5 flex flex-col gap-4">
              {/* Card header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate" title={folder.name}>
                    {folder.name}
                  </h3>
                  <div className="mt-1.5">
                    <span className={DOMAIN_BADGE[folder.domain] ?? "badge bg-gray-100 text-gray-700"}>
                      {folder.domain}
                    </span>
                  </div>
                </div>
                <FolderOpen className="w-8 h-8 text-primary-200 flex-shrink-0" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="text-xs">Questions</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{folder.questionCount}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                    <Hash className="w-3.5 h-3.5" />
                    <span className="text-xs">Fetch Count</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{folder.fetchCount}</p>
                </div>
              </div>

              {/* Date */}
              <p className="text-xs text-gray-400">
                Created {new Date(folder.createdAt).toLocaleDateString()}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <Link
                  href={`/admin/questions?folderId=${folder._id}`}
                  className="btn-secondary btn-sm flex-1 text-center"
                >
                  View Questions
                </Link>
                <button
                  onClick={() => openEdit(folder)}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                  title="Edit folder"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(folder._id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete folder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editFolder ? "Edit Folder" : "New Folder"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              <div>
                <label className="label">Folder Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Aptitude Round 1"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Domain *</label>
                <select
                  value={form.domain}
                  onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                  className="input-field"
                >
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Fetch Count *</label>
                <input
                  type="number"
                  value={form.fetchCount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fetchCount: parseInt(e.target.value, 10) || 1 }))
                  }
                  className="input-field"
                  min={1}
                  step={1}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Number of questions randomly selected for a test from this folder.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={closeModal} disabled={isSaving} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : editFolder ? (
                  "Save Changes"
                ) : (
                  "Create Folder"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Folder?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete the folder and{" "}
              <span className="font-semibold text-red-600">all questions inside it</span>.
              This cannot be undone.
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
                  "Delete Folder"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
