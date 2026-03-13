"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Flag,
  X,
} from "lucide-react";
import { Timer } from "@/components/test/Timer";
import { QuestionNav } from "@/components/test/QuestionNav";
import { QuestionCard, QuestionData } from "@/components/test/QuestionCard";
import { AnswerInput } from "@/components/test/AnswerInput";
import { CodeLanguage } from "@/components/test/CodeEditor";

interface AIEvaluation {
  score: number;
  maxScore: number;
  feedback: string;
  criteriaScores: { name: string; score: number; maxScore: number; comment: string }[];
}

interface AnswerState {
  text: string;
  code: string;
  language: CodeLanguage;
  voiceTranscript: string;
  submitted: boolean;
  aiEvaluation?: AIEvaluation;
  codeTestResults?: { passed: number; total: number; results: any[] } | null;
}

function MiniFeedback({ evaluation }: { evaluation: AIEvaluation }) {
  const pct = evaluation.maxScore > 0
    ? Math.round((evaluation.score / evaluation.maxScore) * 100)
    : 0;
  const color =
    pct >= 80 ? "border-green-200 bg-green-50" : pct >= 50 ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50";
  const textColor = pct >= 80 ? "text-green-700" : pct >= 50 ? "text-blue-700" : "text-red-600";

  return (
    <div className={`border rounded-lg p-4 mt-4 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">AI Evaluation</span>
        <span className={`text-lg font-bold ${textColor}`}>
          {evaluation.score}/{evaluation.maxScore}
          <span className="text-sm font-normal text-gray-500 ml-1">({pct}%)</span>
        </span>
      </div>
      <p className={`text-sm ${textColor}`}>{evaluation.feedback}</p>
    </div>
  );
}

export default function TestTakingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: testId } = use(params);
  const router = useRouter();

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [runningCode, setRunningCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(() => Date.now());
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Fetch test questions on mount
  useEffect(() => {
    fetch(`/api/tests/${testId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error ?? "Failed to load test");
        const test = data.data.test;

        // Handle populated questions
        const qs: QuestionData[] = test.questions.map((q: any) => {
          const populated = q.questionId;
          return {
            _id: String(populated?._id ?? q.questionId),
            domain: populated?.domain ?? "general",
            type: populated?.type ?? "text",
            difficulty: populated?.difficulty ?? "medium",
            content: populated?.content ?? { text: "Question not available" },
            rubric: { maxScore: populated?.rubric?.maxScore ?? 0 },
          };
        });

        setQuestions(qs);
        setAnswers(
          qs.map(() => ({
            text: "",
            code: "",
            language: "python" as CodeLanguage,
            voiceTranscript: "",
            submitted: false,
          }))
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [testId]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];

  const updateAnswer = useCallback(
    (field: keyof AnswerState, value: any) => {
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = { ...next[currentIndex], [field]: value };
        return next;
      });
    },
    [currentIndex]
  );

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;
    setSubmitLoading(true);
    setError(null);

    try {
      const body: any = {
        questionId: currentQuestion._id,
        answer: currentAnswer.text,
      };
      if (currentAnswer.voiceTranscript) {
        body.voiceTranscript = currentAnswer.voiceTranscript;
      }
      if (currentAnswer.code && currentQuestion.type === "code") {
        body.codeSubmission = {
          code: currentAnswer.code,
          language: currentAnswer.language,
        };
      }

      const res = await fetch(`/api/tests/${testId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setAnswers((prev) => {
          const next = [...prev];
          next[currentIndex] = {
            ...next[currentIndex],
            submitted: true,
            aiEvaluation: data.data.evaluation,
            codeTestResults: data.data.codeResults ?? null,
          };
          return next;
        });
      } else {
        setError(data.error ?? "Failed to submit answer");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRunCode = async (code: string, language: CodeLanguage) => {
    setRunningCode(true);
    try {
      const body: any = {
        questionId: currentQuestion._id,
        answer: currentAnswer.text,
        codeSubmission: { code, language },
      };

      const res = await fetch(`/api/tests/${testId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setAnswers((prev) => {
          const next = [...prev];
          next[currentIndex] = {
            ...next[currentIndex],
            submitted: true,
            aiEvaluation: data.data.evaluation,
            codeTestResults: data.data.codeResults ?? null,
          };
          return next;
        });
      }
    } catch {
      setError("Code execution failed");
    } finally {
      setRunningCode(false);
    }
  };

  const handleFinishTest = async () => {
    setCompleteLoading(true);
    setShowFinishModal(false);
    try {
      const res = await fetch(`/api/tests/${testId}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/student/test/${testId}/results`);
      } else {
        setError(data.error ?? "Failed to complete test");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setCompleteLoading(false);
    }
  };

  const allAnswered = answers.every((a) => a.submitted);
  const answeredFlags = answers.map((a) => a.submitted);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card p-8 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold mb-2">Failed to load test</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-900 hidden sm:block">
              Test in Progress
            </span>
            <span className="text-xs text-gray-400">
              {answers.filter((a) => a.submitted).length}/{questions.length} answered
            </span>
          </div>

          <Timer startedAt={startTime} />

          <button
            onClick={() => setShowFinishModal(true)}
            disabled={completeLoading || !allAnswered}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${allAnswered
                ? "bg-accent hover:bg-accent-dark text-white shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            {completeLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Flag className="w-4 h-4" />
            )}
            Finish Test
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar — question navigation */}
          <div className="hidden lg:block w-56 shrink-0">
            <div className="card p-4 sticky top-24">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Questions
              </p>
              <QuestionNav
                total={questions.length}
                current={currentIndex}
                answered={answeredFlags}
                onJump={setCurrentIndex}
              />
            </div>
          </div>

          {/* Main area */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Mobile nav */}
            <div className="card p-3 lg:hidden">
              <QuestionNav
                total={questions.length}
                current={currentIndex}
                answered={answeredFlags}
                onJump={setCurrentIndex}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
                <button onClick={() => setError(null)} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Question card */}
            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                index={currentIndex}
                total={questions.length}
              />
            )}

            {/* Answer card */}
            <div className="card p-6">
              {currentAnswer && currentQuestion && (
                <>
                  <AnswerInput
                    questionType={currentQuestion.type}
                    value={currentAnswer.text}
                    codeValue={currentAnswer.code}
                    codeLanguage={currentAnswer.language}
                    voiceTranscript={currentAnswer.voiceTranscript}
                    onChange={(v) => updateAnswer("text", v)}
                    onCodeChange={(v) => updateAnswer("code", v)}
                    onLanguageChange={(l) => updateAnswer("language", l)}
                    onVoiceTranscript={(t) => updateAnswer("voiceTranscript", t)}
                    onRunCode={handleRunCode}
                    codeTestResults={currentAnswer.codeTestResults}
                    isRunningCode={runningCode}
                    disabled={currentAnswer.submitted && !runningCode}
                  />

                  {/* Mini feedback */}
                  {currentAnswer.aiEvaluation && (
                    <MiniFeedback evaluation={currentAnswer.aiEvaluation} />
                  )}

                  {/* Submit button */}
                  {!currentAnswer.submitted ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={
                        submitLoading ||
                        (!currentAnswer.text.trim() &&
                          !currentAnswer.voiceTranscript.trim() &&
                          !currentAnswer.code.trim())
                      }
                      className="btn-primary mt-5 w-full flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Submit Answer
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Answer submitted
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between gap-3">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="btn-secondary flex items-center gap-2 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
                }
                disabled={currentIndex === questions.length - 1}
                className="btn-secondary flex items-center gap-2 disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Finish confirmation modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-8 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Finish Test?</h2>
            <p className="text-gray-500 text-sm mb-6">
              You have answered {answers.filter((a) => a.submitted).length} of{" "}
              {questions.length} questions. Once you finish, you cannot change your answers.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishModal(false)}
                className="btn-secondary flex-1"
              >
                Continue Test
              </button>
              <button
                onClick={handleFinishTest}
                className="btn-accent flex-1 flex items-center justify-center gap-2"
              >
                <Flag className="w-4 h-4" />
                Finish Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
