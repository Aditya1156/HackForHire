"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import BrandLoader from "@/components/ui/BrandLoader";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Calendar,
  Target,
  Award,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  BookOpen,
  MessageSquare,
  Settings2,
} from "lucide-react";
import GradeOverride from "@/components/teacher/GradeOverride";
import RubricEditor from "@/components/teacher/RubricEditor";

// ---- Types ----
interface CriteriaScore {
  name: string;
  score: number;
  maxScore: number;
  comment: string;
}

interface AIEvaluation {
  score: number;
  maxScore: number;
  criteriaScores: CriteriaScore[];
  feedback: string;
  explanation: string;
}

interface QuestionResult {
  index: number;
  questionId: string;
  domain: string;
  type: string;
  difficulty: string;
  content: { text: string; formula?: string };
  rubric: { criteria: { name: string; weight: number; description: string }[]; maxScore: number };
  answer: string;
  voiceTranscript?: string;
  aiEvaluation: AIEvaluation;
  answeredAt: string;
}

interface TestDetail {
  _id: string;
  status: string;
  domain: string;
  mode: string;
  totalScore: number;
  maxTotalScore: number;
  percentage: number;
  airsScore?: number;
  scores: { domain: string; score: number; maxScore: number }[];
  feedback: { strengths: string[]; weaknesses: string[]; recommendations: string[] };
  startedAt: string;
  completedAt?: string;
  questions: QuestionResult[];
}

interface TestWithStudent extends TestDetail {
  student?: { name: string; email: string };
}

// ---- Sub-components ----

function ScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const color =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
        {score}/{maxScore}
      </span>
    </div>
  );
}

function DomainBadge({ domain }: { domain: string }) {
  const map: Record<string, string> = {
    english: "badge-english",
    math: "badge-math",
    aptitude: "badge-aptitude",
    coding: "badge-coding",
    hr: "badge-hr",
  };
  return (
    <span className={`badge ${map[domain] ?? "bg-gray-100 text-gray-700"}`}>
      {domain}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, string> = {
    easy: "badge-easy",
    medium: "badge-medium",
    hard: "badge-hard",
  };
  return (
    <span className={`badge ${map[difficulty] ?? "bg-gray-100 text-gray-700"}`}>
      {difficulty}
    </span>
  );
}

// ---- Question Review Card ----

interface QuestionReviewCardProps {
  q: QuestionResult;
  testId: string;
  index: number;
  onOverrideApplied: (updatedTest: any) => void;
}

function QuestionReviewCard({
  q,
  testId,
  index,
  onOverrideApplied,
}: QuestionReviewCardProps) {
  const [expanded, setExpanded] = useState(index === 0);
  const [showRubricEditor, setShowRubricEditor] = useState(false);

  const pct =
    q.aiEvaluation.maxScore > 0
      ? Math.round((q.aiEvaluation.score / q.aiEvaluation.maxScore) * 100)
      : 0;

  return (
    <div className="card overflow-hidden">
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
            {q.index}
          </span>
          <div>
            <p className="font-medium text-gray-900 line-clamp-1">{q.content.text}</p>
            <div className="flex items-center gap-2 mt-1">
              <DomainBadge domain={q.domain} />
              <DifficultyBadge difficulty={q.difficulty} />
              <span className="text-xs text-gray-500">{q.type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">
              {q.aiEvaluation.score}/{q.aiEvaluation.maxScore}
            </p>
            <p
              className={`text-xs font-medium ${
                pct >= 80
                  ? "text-green-600"
                  : pct >= 60
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {pct}%
            </p>
          </div>
          {expanded ? (
            <ChevronUp size={18} className="text-gray-400" />
          ) : (
            <ChevronDown size={18} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {/* Question text + student answer */}
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <BookOpen size={12} />
                Question
              </h4>
              <p className="text-sm text-gray-800 leading-relaxed">{q.content.text}</p>
              {q.content.formula && (
                <p className="text-xs text-gray-500 mt-1 font-mono">{q.content.formula}</p>
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <MessageSquare size={12} />
                Student Answer
              </h4>
              {q.answer ? (
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {q.answer}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">No answer submitted</p>
              )}
              {q.voiceTranscript && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-500 font-medium mb-1">Voice transcript:</p>
                  <p className="text-xs text-blue-800">{q.voiceTranscript}</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Evaluation */}
          <div className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              AI Evaluation
            </h4>
            <div className="space-y-3">
              {q.aiEvaluation.criteriaScores.length > 0 ? (
                q.aiEvaluation.criteriaScores.map((cs) => (
                  <div key={cs.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{cs.name}</span>
                      <span className="text-gray-500 text-xs">{cs.score}/{cs.maxScore}</span>
                    </div>
                    <ScoreBar score={cs.score} maxScore={cs.maxScore} />
                    {cs.comment && (
                      <p className="text-xs text-gray-500 mt-1 ml-0.5">{cs.comment}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No criteria scores available.</p>
              )}
            </div>

            {q.aiEvaluation.feedback && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 mb-1">Overall Feedback</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {q.aiEvaluation.feedback}
                </p>
              </div>
            )}

            {q.aiEvaluation.explanation && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 mb-1">Explanation</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {q.aiEvaluation.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Grade Override */}
          <div className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Grade Override
            </h4>
            <GradeOverride
              testId={testId}
              questionIndex={index}
              originalCriteria={q.aiEvaluation.criteriaScores}
              onOverrideApplied={onOverrideApplied}
            />
          </div>

          {/* Rubric Editor (collapsible) */}
          <div className="p-4">
            <button
              onClick={() => setShowRubricEditor((v) => !v)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Settings2 size={14} />
              {showRubricEditor ? "Hide" : "Edit"} Rubric for This Question
              {showRubricEditor ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
            {showRubricEditor && (
              <div className="mt-3">
                <RubricEditor
                  questionId={q.questionId}
                  initialCriteria={q.rubric?.criteria ?? []}
                  initialMaxScore={q.rubric?.maxScore ?? 10}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main Page ----

export default function TeacherReviewPage() {
  const params = useParams();
  const testId = params.testId as string;

  const [test, setTest] = useState<TestWithStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTest = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tests/${testId}/results`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to load test");
      }
      const json = await res.json();
      setTest(json.data.test);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchTest();
  }, [fetchTest]);

  function handleOverrideApplied(updatedTest: any) {
    // updatedTest from the override endpoint has slightly different shape; re-fetch for consistency
    fetchTest();
  }

  if (loading) {
    return (
      <BrandLoader text="Loading test..." />
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="card p-8 max-w-md text-center space-y-4">
          <AlertCircle size={40} className="text-red-400 mx-auto" />
          <h2 className="text-lg font-semibold text-gray-900">
            {error || "Test not found"}
          </h2>
          <Link href="/teacher/dashboard" className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeft size={15} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const overallPct =
    test.maxTotalScore > 0
      ? Math.round((test.totalScore / test.maxTotalScore) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Top nav */}
        <div className="mb-6">
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ---- Left panel: Test summary ---- */}
          <aside className="lg:w-72 shrink-0 space-y-4">
            {/* Status badge */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Test Summary</h2>
                {test.status === "reviewed" ? (
                  <span className="badge bg-green-100 text-green-700">Reviewed</span>
                ) : (
                  <span className="badge bg-yellow-100 text-yellow-700">Pending Review</span>
                )}
              </div>

              {/* Student */}
              {test.student && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <User size={15} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{test.student.name}</p>
                    <p className="text-xs text-gray-500">{test.student.email}</p>
                  </div>
                </div>
              )}

              {/* Domain */}
              <div className="flex items-center gap-2">
                <Target size={15} className="text-gray-400" />
                <DomainBadge domain={test.domain ?? "general"} />
                <span className="text-xs text-gray-500">{test.mode} mode</span>
              </div>

              {/* Date */}
              {test.completedAt && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={13} />
                  {new Date(test.completedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              )}

              {/* Score */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Overall Score</span>
                  <span className="font-bold text-gray-900">
                    {test.totalScore}/{test.maxTotalScore}
                  </span>
                </div>
                <ScoreBar score={test.totalScore} maxScore={test.maxTotalScore} />
                <p className="text-right text-xs text-gray-500 mt-1">{overallPct}%</p>
              </div>

              {/* AIRS */}
              {test.airsScore != null && (
                <div className="flex items-center gap-2 pt-1">
                  <Award size={15} className="text-yellow-500" />
                  <span className="text-sm text-gray-700">
                    AIRS Score:{" "}
                    <span className="font-bold text-gray-900">{test.airsScore}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Per-domain scores */}
            {test.scores?.length > 0 && (
              <div className="card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Domain Breakdown</h3>
                {test.scores.map((s) => (
                  <div key={s.domain}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-gray-600">{s.domain}</span>
                      <span className="text-gray-500">
                        {s.score}/{s.maxScore}
                      </span>
                    </div>
                    <ScoreBar score={s.score} maxScore={s.maxScore} />
                  </div>
                ))}
              </div>
            )}

            {/* AI Feedback */}
            {test.feedback && (
              <div className="card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">AI Feedback</h3>
                {test.feedback.strengths?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Strengths</p>
                    <ul className="space-y-1">
                      {test.feedback.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">+</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {test.feedback.weaknesses?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-1">Weaknesses</p>
                    <ul className="space-y-1">
                      {test.feedback.weaknesses.map((w, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                          <span className="text-red-400 mt-0.5">-</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {test.feedback.recommendations?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-blue-600 mb-1">Recommendations</p>
                    <ul className="space-y-1">
                      {test.feedback.recommendations.map((r, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                          <span className="text-blue-400 mt-0.5">→</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* ---- Main area: Per-question review ---- */}
          <main className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">
                Question Review
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({test.questions.length} question{test.questions.length !== 1 ? "s" : ""})
                </span>
              </h2>
              <button
                onClick={fetchTest}
                className="btn-secondary btn-sm flex items-center gap-1"
              >
                <RefreshCw size={13} />
                Refresh
              </button>
            </div>

            {test.questions.length === 0 ? (
              <div className="card p-12 flex flex-col items-center gap-3 text-gray-500">
                <AlertCircle size={36} className="text-gray-300" />
                <p className="font-medium">No questions found in this test.</p>
              </div>
            ) : (
              test.questions.map((q, i) => (
                <QuestionReviewCard
                  key={q.questionId || i}
                  q={q}
                  testId={testId}
                  index={i}
                  onOverrideApplied={handleOverrideApplied}
                />
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
