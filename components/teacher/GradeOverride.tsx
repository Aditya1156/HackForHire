"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, RotateCcw } from "lucide-react";

interface CriteriaScore {
  name: string;
  score: number;
  maxScore: number;
  comment?: string;
}

interface GradeOverrideProps {
  testId: string;
  questionIndex: number;
  originalCriteria: CriteriaScore[];
  onOverrideApplied: (updatedTest: any) => void;
}

export default function GradeOverride({
  testId,
  questionIndex,
  originalCriteria,
  onOverrideApplied,
}: GradeOverrideProps) {
  const [criteria, setCriteria] = useState<CriteriaScore[]>(
    originalCriteria.map((c) => ({ ...c }))
  );
  const [teacherNote, setTeacherNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const totalAI = originalCriteria.reduce((s, c) => s + c.score, 0);
  const totalOverride = criteria.reduce((s, c) => s + c.score, 0);
  const totalMax = criteria.reduce((s, c) => s + c.maxScore, 0);
  const hasChanges =
    criteria.some((c, i) => c.score !== originalCriteria[i]?.score) ||
    teacherNote.trim().length > 0;

  function updateScore(index: number, value: number) {
    setCriteria((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, score: Math.min(c.maxScore, Math.max(0, value)) } : c
      )
    );
    setSuccess(false);
  }

  function resetScores() {
    setCriteria(originalCriteria.map((c) => ({ ...c })));
    setTeacherNote("");
    setSuccess(false);
    setError("");
  }

  async function applyOverride() {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/teacher/tests/${testId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIndex,
          criteriaScores: criteria.map(({ name, score, maxScore }) => ({
            name,
            score,
            maxScore,
          })),
          teacherNote: teacherNote.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Override failed");

      setSuccess(true);
      onOverrideApplied(json.data.test);
    } catch (err: any) {
      setError(err.message ?? "Failed to apply override");
    } finally {
      setLoading(false);
    }
  }

  if (originalCriteria.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic py-2">
        No rubric criteria available for override.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Criteria sliders */}
      <div className="space-y-3">
        {criteria.map((c, i) => (
          <div key={c.name} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{c.name}</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-400">
                  AI: <span className="font-medium text-gray-600">{originalCriteria[i]?.score ?? 0}</span>
                </span>
                <span className="text-primary-600 font-semibold">
                  Override: {c.score}/{c.maxScore}
                </span>
              </div>
            </div>

            {/* Progress bar background */}
            <div className="relative h-2 bg-gray-200 rounded-full mb-2">
              {/* AI score bar */}
              <div
                className="absolute h-2 bg-gray-400 rounded-full opacity-40"
                style={{
                  width: c.maxScore > 0
                    ? `${((originalCriteria[i]?.score ?? 0) / c.maxScore) * 100}%`
                    : "0%",
                }}
              />
              {/* Override bar */}
              <div
                className="absolute h-2 bg-primary-500 rounded-full transition-all duration-200"
                style={{
                  width: c.maxScore > 0 ? `${(c.score / c.maxScore) * 100}%` : "0%",
                }}
              />
            </div>

            {/* Slider */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={c.maxScore}
                step={0.5}
                value={c.score}
                onChange={(e) => updateScore(i, parseFloat(e.target.value))}
                className="flex-1 accent-primary-600 cursor-pointer"
              />
              <input
                type="number"
                min={0}
                max={c.maxScore}
                step={0.5}
                value={c.score}
                onChange={(e) => updateScore(i, parseFloat(e.target.value) || 0)}
                className="w-16 text-center input-field py-1 text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total summary */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
        <div className="text-sm text-gray-600">
          AI Score:{" "}
          <span className="font-semibold text-gray-800">
            {totalAI}/{totalMax}
          </span>
        </div>
        <div className="text-sm text-primary-700 font-semibold">
          Override Total: {totalOverride}/{totalMax}
        </div>
      </div>

      {/* Teacher note */}
      <div>
        <label className="label">Teacher Note (optional)</label>
        <textarea
          rows={2}
          value={teacherNote}
          onChange={(e) => setTeacherNote(e.target.value)}
          placeholder="Add a note for the student…"
          className="input-field resize-none text-sm"
        />
      </div>

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
          Override applied successfully. Test marked as reviewed.
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={applyOverride}
          disabled={loading || !hasChanges}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          Apply Override
        </button>
        <button
          onClick={resetScores}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RotateCcw size={15} />
          Reset
        </button>
      </div>
    </div>
  );
}
