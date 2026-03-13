"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertCircle, Loader2, Tag, X } from "lucide-react";
import { KaTeXRenderer } from "@/components/shared/KaTeXRenderer";

interface RubricCriteria {
  name: string;
  weight: number;
  description: string;
}

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface Folder {
  _id: string;
  name: string;
  domain: string;
}

interface QuestionFormProps {
  initialData?: Partial<QuestionFormData>;
  questionId?: string;
}

interface QuestionFormData {
  folderId: string;
  domain: string;
  type: string;
  difficulty: string;
  content: {
    text: string;
    formula: string;
    imageUrl: string;
    audioUrl: string;
  };
  rubric: {
    criteria: RubricCriteria[];
    maxScore: number;
    gradingLogic: string;
  };
  expectedAnswer: string;
  testCases: TestCase[];
  tags: string[];
}

const DOMAINS = ["english", "math", "aptitude", "coding", "hr", "situational"] as const;
const TYPES = ["text", "voice", "code", "mixed"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

const defaultForm: QuestionFormData = {
  folderId: "",
  domain: "english",
  type: "text",
  difficulty: "medium",
  content: { text: "", formula: "", imageUrl: "", audioUrl: "" },
  rubric: {
    criteria: [{ name: "", weight: 1, description: "" }],
    maxScore: 10,
    gradingLogic: "",
  },
  expectedAnswer: "",
  testCases: [],
  tags: [],
};

export default function QuestionForm({ initialData, questionId }: QuestionFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<QuestionFormData>(() => ({
    ...defaultForm,
    ...initialData,
    content: { ...defaultForm.content, ...(initialData?.content ?? {}) },
    rubric: { ...defaultForm.rubric, ...(initialData?.rubric ?? {}) },
  }));
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [formulaPreview, setFormulaPreview] = useState(false);

  useEffect(() => {
    fetch("/api/folders")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setFolders(d.data.folders);
      })
      .catch(() => {});
  }, []);

  const totalWeight = form.rubric.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  const weightOk = Math.abs(totalWeight - 1) < 0.01;

  function updateField<K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateContent(key: keyof QuestionFormData["content"], value: string) {
    setForm((prev) => ({ ...prev, content: { ...prev.content, [key]: value } }));
  }

  function updateRubric(key: keyof QuestionFormData["rubric"], value: unknown) {
    setForm((prev) => ({ ...prev, rubric: { ...prev.rubric, [key]: value } }));
  }

  function updateCriteria(index: number, key: keyof RubricCriteria, value: string | number) {
    const updated = form.rubric.criteria.map((c, i) =>
      i === index ? { ...c, [key]: value } : c
    );
    updateRubric("criteria", updated);
  }

  function addCriteria() {
    updateRubric("criteria", [
      ...form.rubric.criteria,
      { name: "", weight: 0, description: "" },
    ]);
  }

  function removeCriteria(index: number) {
    if (form.rubric.criteria.length <= 1) return;
    updateRubric(
      "criteria",
      form.rubric.criteria.filter((_, i) => i !== index)
    );
  }

  function addTestCase() {
    updateField("testCases", [...form.testCases, { input: "", expectedOutput: "" }]);
  }

  function updateTestCase(index: number, key: keyof TestCase, value: string) {
    const updated = form.testCases.map((tc, i) =>
      i === index ? { ...tc, [key]: value } : tc
    );
    updateField("testCases", updated);
  }

  function removeTestCase(index: number) {
    updateField("testCases", form.testCases.filter((_, i) => i !== index));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      updateField("tags", [...form.tags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    updateField("tags", form.tags.filter((t) => t !== tag));
  }

  function validate(): string | null {
    if (!form.folderId) return "Please select a folder.";
    if (!form.content.text.trim()) return "Question text is required.";
    if (form.rubric.criteria.some((c) => !c.name.trim())) return "All criteria must have a name.";
    if (!weightOk) return `Rubric weights must sum to 1.0 (currently ${totalWeight.toFixed(2)}).`;
    if (form.rubric.maxScore <= 0) return "Max score must be positive.";
    if (form.content.imageUrl && !/^https?:\/\/.+/.test(form.content.imageUrl)) {
      return "Image URL must be a valid URL.";
    }
    if (form.content.audioUrl && !/^https?:\/\/.+/.test(form.content.audioUrl)) {
      return "Audio URL must be a valid URL.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...form,
        content: {
          text: form.content.text,
          ...(form.content.formula ? { formula: form.content.formula } : {}),
          ...(form.content.imageUrl ? { imageUrl: form.content.imageUrl } : {}),
          ...(form.content.audioUrl ? { audioUrl: form.content.audioUrl } : {}),
        },
        testCases: form.domain === "coding" ? form.testCases : undefined,
      };

      const url = questionId ? `/api/questions/${questionId}` : "/api/questions";
      const method = questionId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save question.");
        return;
      }

      router.push("/admin/questions");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Section 1: Basic Info */}
      <div className="card p-6">
        <h2 className="section-title">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Folder */}
          <div>
            <label className="label">Folder *</label>
            <select
              value={form.folderId}
              onChange={(e) => updateField("folderId", e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select a folder…</option>
              {folders.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.domain})
                </option>
              ))}
            </select>
          </div>

          {/* Domain */}
          <div>
            <label className="label">Domain *</label>
            <select
              value={form.domain}
              onChange={(e) => updateField("domain", e.target.value)}
              className="input-field"
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="label">Question Type *</label>
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
              className="input-field"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="label">Difficulty *</label>
            <select
              value={form.difficulty}
              onChange={(e) => updateField("difficulty", e.target.value)}
              className="input-field"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Question Content */}
      <div className="card p-6">
        <h2 className="section-title">Question Content</h2>
        <div className="space-y-5">
          <div>
            <label className="label">Question Text *</label>
            <textarea
              value={form.content.text}
              onChange={(e) => updateContent("text", e.target.value)}
              className="input-field min-h-[120px] resize-y"
              placeholder="Enter the full question text here…"
              required
            />
          </div>

          <div>
            <label className="label">
              Formula{" "}
              <span className="text-gray-400 font-normal">(LaTeX — optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.content.formula}
                onChange={(e) => updateContent("formula", e.target.value)}
                className="input-field"
                placeholder="e.g. E = mc^2"
              />
              {form.content.formula && (
                <button
                  type="button"
                  onClick={() => setFormulaPreview((p) => !p)}
                  className="btn-secondary btn-sm whitespace-nowrap"
                >
                  {formulaPreview ? "Hide" : "Preview"}
                </button>
              )}
            </div>
            {formulaPreview && form.content.formula && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <KaTeXRenderer formula={form.content.formula} displayMode />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">
                Image URL <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={form.content.imageUrl}
                onChange={(e) => updateContent("imageUrl", e.target.value)}
                className="input-field"
                placeholder="https://example.com/image.png"
              />
            </div>
            <div>
              <label className="label">
                Audio URL <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={form.content.audioUrl}
                onChange={(e) => updateContent("audioUrl", e.target.value)}
                className="input-field"
                placeholder="https://example.com/audio.mp3"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Rubric Builder */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Rubric Builder</h2>
          <span
            className={`text-sm font-medium px-2 py-0.5 rounded-full ${
              weightOk
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            Total weight: {totalWeight.toFixed(2)} {weightOk ? "✓" : "(must be 1.0)"}
          </span>
        </div>

        <div className="space-y-4">
          {form.rubric.criteria.map((criterion, idx) => (
            <div
              key={idx}
              className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Criterion {idx + 1}
                </span>
                {form.rubric.criteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCriteria(idx)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Criterion name"
                    value={criterion.name}
                    onChange={(e) => updateCriteria(idx, "name", e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Weight (0–1)"
                    value={criterion.weight}
                    onChange={(e) =>
                      updateCriteria(idx, "weight", parseFloat(e.target.value) || 0)
                    }
                    className="input-field"
                    min={0}
                    max={1}
                    step={0.05}
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Description"
                value={criterion.description}
                onChange={(e) => updateCriteria(idx, "description", e.target.value)}
                className="input-field"
              />
            </div>
          ))}

          <button type="button" onClick={addCriteria} className="btn-secondary btn-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Criterion
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">Max Score *</label>
            <input
              type="number"
              value={form.rubric.maxScore}
              onChange={(e) => updateRubric("maxScore", parseFloat(e.target.value) || 0)}
              className="input-field"
              min={1}
              step={1}
            />
          </div>
          <div>
            <label className="label">
              Grading Logic <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.rubric.gradingLogic}
              onChange={(e) => updateRubric("gradingLogic", e.target.value)}
              className="input-field resize-y"
              rows={3}
              placeholder="Describe how AI should grade this question…"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Expected Answer + Test Cases */}
      <div className="card p-6">
        <h2 className="section-title">Expected Answer</h2>
        <div className="space-y-5">
          <div>
            <label className="label">
              Expected Answer <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.expectedAnswer}
              onChange={(e) => updateField("expectedAnswer", e.target.value)}
              className="input-field resize-y"
              rows={4}
              placeholder="Enter the model answer or key points…"
            />
          </div>

          {form.domain === "coding" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="label mb-0">Test Cases</label>
                <button
                  type="button"
                  onClick={addTestCase}
                  className="btn-secondary btn-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Test Case
                </button>
              </div>

              {form.testCases.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No test cases yet. Add test cases for code evaluation.
                </p>
              )}

              <div className="space-y-3">
                {form.testCases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">
                        Test Case {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTestCase(idx)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Input</label>
                        <textarea
                          value={tc.input}
                          onChange={(e) => updateTestCase(idx, "input", e.target.value)}
                          className="input-field font-mono text-sm resize-y"
                          rows={3}
                          placeholder="stdin input…"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Expected Output</label>
                        <textarea
                          value={tc.expectedOutput}
                          onChange={(e) =>
                            updateTestCase(idx, "expectedOutput", e.target.value)
                          }
                          className="input-field font-mono text-sm resize-y"
                          rows={3}
                          placeholder="expected stdout…"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 5: Tags */}
      <div className="card p-6">
        <h2 className="section-title">Tags</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            className="input-field"
            placeholder="Type a tag and press Enter…"
          />
          <button
            type="button"
            onClick={addTag}
            className="btn-secondary btn-sm flex items-center gap-2 whitespace-nowrap"
          >
            <Tag className="w-4 h-4" />
            Add Tag
          </button>
        </div>

        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 text-sm font-medium px-3 py-1 rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-primary-900 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/admin/questions")}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>{questionId ? "Update Question" : "Create Question"}</>
          )}
        </button>
      </div>
    </form>
  );
}
