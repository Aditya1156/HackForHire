"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import BrandLoader from "@/components/ui/BrandLoader";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import { ScoreCard } from "@/components/results/ScoreCard";
import { FeedbackPanel } from "@/components/results/FeedbackPanel";
import { AIRSChart } from "@/components/results/AIRSChart";
import { ProgressChart } from "@/components/results/ProgressChart";
import { KaTeXRenderer } from "@/components/shared/KaTeXRenderer";

interface CriteriaScore {
  name: string;
  score: number;
  maxScore: number;
  comment: string;
}

interface QuestionResult {
  index: number;
  questionId: string;
  domain: string;
  type: string;
  difficulty: string;
  content: { text: string; formula?: string; imageUrl?: string };
  rubric: { maxScore?: number };
  answer: string;
  voiceTranscript?: string;
  codeSubmission?: { code: string; language: string; testResults?: { passed: number; total: number } };
  aiEvaluation: {
    score: number;
    maxScore: number;
    criteriaScores: CriteriaScore[];
    feedback: string;
    explanation: string;
  };
}

interface TestResults {
  _id: string;
  status: string;
  domain?: string;
  totalScore: number;
  maxTotalScore: number;
  percentage: number;
  airsScore?: number;
  scores: { domain: string; score: number; maxScore: number }[];
  feedback: { strengths: string[]; weaknesses: string[]; recommendations: string[] };
  completedAt?: string;
  questions: QuestionResult[];
}

const difficultyColors: Record<string, string> = {
  easy: "badge-easy",
  medium: "badge-medium",
  hard: "badge-hard",
};

const domainColors: Record<string, string> = {
  english: "badge-english",
  math: "badge-math",
  aptitude: "badge-aptitude",
  coding: "badge-coding",
  hr: "badge-hr",
  situational: "bg-teal-100 text-teal-800",
};

function QuestionReviewCard({ q }: { q: QuestionResult }) {
  const [open, setOpen] = useState(false);
  const pct =
    q.aiEvaluation.maxScore > 0
      ? Math.round((q.aiEvaluation.score / q.aiEvaluation.maxScore) * 100)
      : 0;

  const scoreColor =
    pct >= 80 ? "text-green-600" : pct >= 50 ? "text-blue-600" : "text-red-500";
  const barColor =
    pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-red-400";

  return (
    <div className="card border overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-gray-700 shrink-0">
            Q{q.index}
          </span>
          <span className={`badge ${domainColors[q.domain] ?? "bg-gray-100 text-gray-700"} capitalize`}>
            {q.domain}
          </span>
          <span className={`badge ${difficultyColors[q.difficulty] ?? "badge-medium"}`}>
            {q.difficulty}
          </span>
          <span className="text-sm text-gray-600 line-clamp-1 hidden sm:block max-w-sm">
            {q.content.text}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className={`text-base font-bold ${scoreColor}`}>
            {q.aiEvaluation.score}/{q.aiEvaluation.maxScore}
          </span>
          {open ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5 bg-gray-50/50">
          {/* Question text */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Question
            </p>
            <p className="text-gray-800 text-sm leading-relaxed">{q.content.text}</p>
            {q.content.formula && (
              <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                <KaTeXRenderer formula={q.content.formula} displayMode />
              </div>
            )}
          </div>

          {/* Student's answer */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Your Answer
            </p>
            {q.voiceTranscript ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                <span className="text-xs font-medium text-blue-500 block mb-1">Voice transcript</span>
                {q.voiceTranscript}
              </div>
            ) : q.codeSubmission ? (
              <div className="bg-gray-900 rounded-lg p-4 text-xs font-mono text-gray-300 overflow-x-auto">
                <div className="text-gray-500 mb-2">
                  {q.codeSubmission.language} ·{" "}
                  {q.codeSubmission.testResults
                    ? `${q.codeSubmission.testResults.passed}/${q.codeSubmission.testResults.total} tests passed`
                    : ""}
                </div>
                <pre className="whitespace-pre-wrap">{q.codeSubmission.code}</pre>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap min-h-[60px]">
                {q.answer || <span className="text-gray-400 italic">(no answer)</span>}
              </div>
            )}
          </div>

          {/* AI Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                AI Score
              </p>
              <span className={`text-lg font-bold ${scoreColor}`}>
                {q.aiEvaluation.score}/{q.aiEvaluation.maxScore}
                <span className="text-sm font-normal text-gray-400 ml-1">({pct}%)</span>
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full ${barColor} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Criteria scores */}
            {q.aiEvaluation.criteriaScores.length > 0 && (
              <div className="space-y-2">
                {q.aiEvaluation.criteriaScores.map((cs, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 text-sm">
                    <div className="flex-1">
                      <span className="font-medium text-gray-700">{cs.name}</span>
                      {cs.comment && (
                        <p className="text-xs text-gray-500 mt-0.5">{cs.comment}</p>
                      )}
                    </div>
                    <span className="font-semibold text-gray-700 shrink-0">
                      {cs.score}/{cs.maxScore}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback */}
          {q.aiEvaluation.feedback && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Feedback
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {q.aiEvaluation.feedback}
              </p>
            </div>
          )}

          {/* Explanation */}
          {q.aiEvaluation.explanation && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Explanation
              </p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {q.aiEvaluation.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: testId } = use(params);
  const router = useRouter();
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tests/${testId}/results`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setResults(data.data.test);
        else setError(data.error ?? "Failed to load results");
      })
      .catch(() => setError("Network error — please try again"))
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) {
    return (
      <BrandLoader text="Loading results..." />
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card p-8 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold mb-2">Failed to load results</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => router.push("/student/test")}
            className="btn-primary"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  // Derive AIRS chart props from domain scores
  const domainScoreMap = new Map(
    results.scores.map((s) => [
      s.domain,
      s.maxScore > 0 ? (s.score / s.maxScore) * 100 : 0,
    ])
  );
  const defaultPct =
    results.maxTotalScore > 0
      ? (results.totalScore / results.maxTotalScore) * 100
      : 50;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/student/test"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tests
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/student/dashboard"
              className="btn-secondary btn-sm flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              History
            </Link>
            <Link
              href="/student/test"
              className="btn-primary btn-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Test
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Score summary */}
        <ScoreCard
          totalScore={results.totalScore}
          maxTotalScore={results.maxTotalScore}
          airsScore={results.airsScore}
          domain={results.domain}
        />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProgressChart scores={results.scores} />
          {results.airsScore !== undefined && (
            <AIRSChart
              airsScore={results.airsScore}
              communicationScore={domainScoreMap.get("english") ?? domainScoreMap.get("hr") ?? defaultPct}
              technicalScore={domainScoreMap.get("aptitude") ?? domainScoreMap.get("math") ?? defaultPct}
              codingScore={domainScoreMap.get("coding") ?? defaultPct}
              problemSolvingScore={domainScoreMap.get("aptitude") ?? domainScoreMap.get("situational") ?? defaultPct}
              toneScore={domainScoreMap.get("hr") ?? defaultPct}
            />
          )}
        </div>

        {/* AI Feedback */}
        <FeedbackPanel
          strengths={results.feedback?.strengths ?? []}
          weaknesses={results.feedback?.weaknesses ?? []}
          recommendations={results.feedback?.recommendations ?? []}
        />

        {/* Per-question review */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Per-Question Review
          </h2>
          <div className="space-y-3">
            {results.questions.map((q) => (
              <QuestionReviewCard key={q.questionId} q={q} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
