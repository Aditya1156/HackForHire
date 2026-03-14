"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import BrandLoader from "@/components/ui/BrandLoader";
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  BookOpen,
  Tag,
  Search,
  GraduationCap,
  Briefcase,
  Code,
  Building2,
  Stethoscope,
  Scale,
  Palette,
  ChevronDown,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
} from "lucide-react";

interface Folder {
  _id: string;
  name: string;
  domain: string;
  description?: string;
  tags: string[];
  isPublished: boolean;
  questionCount: number;
  fetchCount: number;
  createdAt: string;
}

interface FolderFormData {
  name: string;
  tags: string[];
  isPublished: boolean;
}

const PREBUILT_TAGS: { category: string; icon: any; color: string; tags: string[] }[] = [
  {
    category: "B.Tech / B.E / Engineering",
    icon: GraduationCap,
    color: "text-blue-600 bg-blue-50",
    tags: ["Software Developer", "SDE", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile Developer", "DevOps Engineer", "Cloud Architect", "Data Scientist", "Machine Learning Engineer", "AI Engineer", "Cybersecurity Analyst", "Embedded Systems Engineer", "System Design Engineer", "QA Engineer", "Data Engineer", "Blockchain Developer", "Product Manager (Tech)"],
  },
  {
    category: "BCA / MCA / B.Sc IT / M.Sc IT",
    icon: Code,
    color: "text-orange-600 bg-orange-50",
    tags: ["Software Developer", "SDE", "Full Stack Developer", "Frontend Developer", "Backend Developer", "Web Developer", "Mobile Developer", "QA Engineer", "Database Administrator", "IT Support Engineer", "System Administrator", "UI/UX Designer", "Python Developer", "Java Developer", "PHP Developer", "Data Analyst", "Cloud Engineer", "Technical Support"],
  },
  {
    category: "M.Tech / M.E / Research",
    icon: GraduationCap,
    color: "text-indigo-600 bg-indigo-50",
    tags: ["Machine Learning Engineer", "AI Engineer", "Data Scientist", "Research Scientist", "NLP Engineer", "Computer Vision Engineer", "Cloud Architect", "Cybersecurity Analyst", "Robotics Engineer", "VLSI Design Engineer", "System Design Engineer", "R&D Engineer", "Big Data Engineer"],
  },
  {
    category: "MBA / BBA / PGDM",
    icon: Briefcase,
    color: "text-violet-600 bg-violet-50",
    tags: ["Business Analyst", "Product Manager", "Marketing Manager", "HR Manager", "Finance Manager", "Operations Manager", "Consultant", "Strategy Analyst", "Brand Manager", "Supply Chain Manager", "Project Manager", "Investment Banker", "Sales Manager", "Business Development Manager", "Management Trainee"],
  },
  {
    category: "B.Com / M.Com / CA / CMA",
    icon: Building2,
    color: "text-emerald-600 bg-emerald-50",
    tags: ["Accountant", "Financial Analyst", "Tax Consultant", "Auditor", "Investment Banker", "Banking Officer", "Insurance Analyst", "Cost Analyst", "Budget Analyst", "Equity Research Analyst", "Payroll Specialist", "GST Consultant", "Risk Analyst"],
  },
  {
    category: "BA / MA / Arts & Humanities",
    icon: Palette,
    color: "text-pink-600 bg-pink-50",
    tags: ["Content Writer", "Journalist", "Public Relations Manager", "Social Media Manager", "Copywriter", "UX Researcher", "Policy Analyst", "HR Executive", "Communications Specialist", "Research Associate", "Creative Director", "Event Manager", "Corporate Trainer"],
  },
  {
    category: "B.Sc / M.Sc / Science",
    icon: Stethoscope,
    color: "text-teal-600 bg-teal-50",
    tags: ["Data Analyst", "Research Scientist", "Lab Technician", "Biotech Researcher", "Statistician", "Quality Analyst", "Environmental Scientist", "Clinical Research Associate", "Bioinformatics Analyst", "Science Writer", "Data Scientist"],
  },
  {
    category: "Medical / Pharma / Nursing",
    icon: Stethoscope,
    color: "text-red-600 bg-red-50",
    tags: ["Medical Officer", "Hospital Administrator", "Pharmaceutical Sales Rep", "Drug Safety Associate", "Medical Coder", "Healthcare IT Specialist", "Physiotherapist", "Clinical Research Associate", "Pharmacovigilance Officer", "Lab Technician", "Nursing Officer"],
  },
  {
    category: "Law / LLB / LLM",
    icon: Scale,
    color: "text-gray-600 bg-gray-50",
    tags: ["Corporate Lawyer", "Legal Advisor", "Compliance Officer", "IP Lawyer", "Cyber Law Specialist", "Tax Lawyer", "Legal Researcher", "Arbitration Specialist", "Judiciary Aspirant", "Contract Specialist"],
  },
  {
    category: "Diploma / ITI / Polytechnic",
    icon: GraduationCap,
    color: "text-amber-600 bg-amber-50",
    tags: ["Technical Support Engineer", "Network Engineer", "AutoCAD Operator", "CNC Operator", "Electrician", "Web Developer", "Data Entry Operator", "Desktop Support", "Hardware Engineer", "CCTV Technician", "Mobile Repair Technician"],
  },
  {
    category: "General / Any Graduation",
    icon: Briefcase,
    color: "text-gray-600 bg-gray-100",
    tags: ["Customer Success Manager", "Sales Executive", "Administrative Officer", "Operations Executive", "Digital Marketing Executive", "Content Creator", "Executive Assistant", "Relationship Manager", "Recruiter", "General Management Trainee"],
  },
];

const defaultForm: FolderFormData = { name: "", tags: [], isPublished: true };

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
  const [tagSearch, setTagSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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

  const filteredPrebuiltTags = useMemo(() => {
    if (!tagSearch.trim()) return PREBUILT_TAGS;
    const q = tagSearch.toLowerCase();
    return PREBUILT_TAGS.map((group) => ({
      ...group,
      tags: group.tags.filter((t) => t.toLowerCase().includes(q)),
    })).filter((group) => group.tags.length > 0);
  }, [tagSearch]);

  function toggleCategory(category: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function toggleTag(tag: string) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  function openCreate() {
    setEditFolder(null);
    setForm(defaultForm);
    setFormError("");
    setTagSearch("");
    setExpandedCategories(new Set());
    setShowModal(true);
  }

  function openEdit(folder: Folder) {
    setEditFolder(folder);
    setForm({
      name: folder.name,
      tags: folder.tags || [],
      isPublished: folder.isPublished,
    });
    setFormError("");
    setTagSearch("");
    setExpandedCategories(new Set());
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditFolder(null);
    setFormError("");
  }

  function validateForm(): string | null {
    if (!form.name.trim()) return "Folder name is required.";
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

  async function handleTogglePublish(folder: Folder) {
    try {
      const res = await fetch(`/api/folders/${folder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !folder.isPublished }),
      });
      if (!res.ok) throw new Error("Failed to update");
      fetchFolders();
    } catch {
      alert("Failed to update folder visibility");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header mb-1">Question Folders</h1>
          <p className="text-sm text-gray-500">
            Organise questions into folders and assign role/degree tags.
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
          <BrandLoader fullPage={false} />
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
                  {folder.tags && folder.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {folder.tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] bg-violet-50 text-violet-600 border border-violet-100 px-1.5 py-0.5 rounded-md font-medium">
                          <Tag className="w-2.5 h-2.5" />{tag}
                        </span>
                      ))}
                      {folder.tags.length > 5 && (
                        <span className="text-[10px] text-gray-400 font-medium">+{folder.tags.length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>
                <FolderOpen className="w-8 h-8 text-primary-200 flex-shrink-0" />
              </div>

              {/* Visibility badge */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTogglePublish(folder)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    folder.isPublished
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
                  }`}
                  title={folder.isPublished ? "Visible to students — click to hide" : "Hidden from students — click to publish"}
                >
                  {folder.isPublished ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {folder.isPublished ? "Published" : "Hidden"}
                </button>
              </div>

              {/* Stats */}
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="text-xs">Questions</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{folder.questionCount}</p>
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

      {/* ============ Create / Edit Modal ============ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
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

            {/* Modal Body - Scrollable */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              {/* Folder Name */}
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

              {/* Selected Tags */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-violet-500" />
                  Job Role Tags
                  {form.tags.length > 0 && (
                    <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-bold">
                      {form.tags.length}
                    </span>
                  )}
                </label>
                {form.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-violet-50 border border-violet-100 rounded-xl">
                    {form.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="inline-flex items-center gap-1 bg-violet-600 text-white text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-violet-700 transition-colors"
                      >
                        {tag}
                        <X className="w-3 h-3 opacity-70" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center">
                    <p className="text-xs text-gray-400">No roles selected. Pick from your degree group below.</p>
                  </div>
                )}
              </div>

              {/* Search / Custom Tag */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = tagSearch.trim();
                        if (val && !form.tags.includes(val)) {
                          toggleTag(val);
                          setTagSearch("");
                        }
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                    placeholder="Search job roles or type custom & press Enter..."
                  />
                </div>
              </div>

              {/* Prebuilt Tags by Category */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Browse by Category</p>
                {filteredPrebuiltTags.map((group) => {
                  const Icon = group.icon;
                  const isExpanded = expandedCategories.has(group.category) || tagSearch.trim().length > 0;
                  const visibleTags = isExpanded ? group.tags : group.tags.slice(0, 6);
                  const hasMore = group.tags.length > 6 && !isExpanded;
                  const selectedCount = group.tags.filter((t) => form.tags.includes(t)).length;

                  return (
                    <div key={group.category} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleCategory(group.category)}
                        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${group.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 flex-1">{group.category}</span>
                        {selectedCount > 0 && (
                          <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-bold">
                            {selectedCount} selected
                          </span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                        {visibleTags.map((tag) => {
                          const isSelected = form.tags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all
                                ${isSelected
                                  ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50"
                                }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3 h-3" />}
                              {tag}
                            </button>
                          );
                        })}
                        {hasMore && (
                          <button
                            type="button"
                            onClick={() => toggleCategory(group.category)}
                            className="text-xs text-violet-600 font-semibold px-2 py-1.5 hover:underline"
                          >
                            +{group.tags.length - 6} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info */}
              <div className="flex items-start gap-2.5 bg-violet-50 border border-violet-100 rounded-xl p-4">
                <CheckCircle2 className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-violet-800">Auto-matched to students</p>
                  <p className="text-xs text-violet-600">Questions from this folder are automatically assigned to students whose selected role matches any of the tags above.</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
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
