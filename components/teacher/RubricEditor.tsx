"use client";

import { useState } from "react";
import { Plus, Trash2, Save, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface Criterion {
  name: string;
  weight: number;
  description: string;
}

interface RubricEditorProps {
  questionId: string;
  initialCriteria: Criterion[];
  initialMaxScore: number;
  onSaved?: () => void;
}

export default function RubricEditor({
  questionId,
  initialCriteria,
  initialMaxScore,
  onSaved,
}: RubricEditorProps) {
  const [criteria, setCriteria] = useState<Criterion[]>(
    initialCriteria.map((c) => ({ ...c }))
  );
  const [maxScore, setMaxScore] = useState(initialMaxScore);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  const weightError = Math.abs(totalWeight - 1.0) > 0.05;

  function addCriterion() {
    setCriteria((prev) => [
      ...prev,
      { name: "", weight: 0, description: "" },
    ]);
    setSuccess(false);
  }

  function removeCriterion(index: number) {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
    setSuccess(false);
  }

  function updateCriterion(index: number, field: keyof Criterion, value: string | number) {
    setCriteria((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
    setSuccess(false);
    setError("");
  }

  async function save() {
    if (weightError) {
      setError(`Weights must sum to 1.0 (currently ${totalWeight.toFixed(2)})`);
      return;
    }
    if (criteria.some((c) => !c.name.trim())) {
      setError("All criteria must have a name.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/teacher/rubrics/${questionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria, maxScore }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");

      setSuccess(true);
      onSaved?.();
    } catch (err: any) {
      setError(err.message ?? "Failed to save rubric");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Max score */}
      <div className="flex items-center gap-4">
        <div>
          <label className="label">Max Score</label>
          <input
            type="number"
            min={1}
            value={maxScore}
            onChange={(e) => setMaxScore(parseFloat(e.target.value) || 1)}
            className="input-field w-24"
          />
        </div>
        <div className="mt-5">
          <span
            className={`text-sm font-medium ${
              weightError ? "text-red-600" : "text-green-600"
            }`}
          >
            Weight total: {totalWeight.toFixed(2)} {weightError ? "(must be 1.0)" : "✓"}
          </span>
        </div>
      </div>

      {/* Criteria list */}
      <div className="space-y-3">
        {criteria.map((c, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <label className="label text-xs">Criterion Name</label>
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => updateCriterion(i, "name", e.target.value)}
                  placeholder="e.g. Clarity"
                  className="input-field text-sm"
                />
              </div>
              <div className="w-24">
                <label className="label text-xs">Weight (0–1)</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={c.weight}
                  onChange={(e) =>
                    updateCriterion(i, "weight", parseFloat(e.target.value) || 0)
                  }
                  className="input-field text-sm"
                />
              </div>
              <button
                onClick={() => removeCriterion(i)}
                className="mt-5 text-red-500 hover:text-red-700 transition-colors"
                title="Remove criterion"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div>
              <label className="label text-xs">Description</label>
              <textarea
                rows={2}
                value={c.description}
                onChange={(e) => updateCriterion(i, "description", e.target.value)}
                placeholder="Describe what good performance looks like…"
                className="input-field resize-none text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addCriterion}
        className="btn-secondary btn-sm flex items-center gap-2"
      >
        <Plus size={14} />
        Add Criterion
      </button>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle size={15} />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle2 size={15} />
          Rubric saved successfully.
        </div>
      )}

      <button
        onClick={save}
        disabled={loading || weightError}
        className="btn-primary flex items-center gap-2"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Save Rubric
      </button>
    </div>
  );
}
