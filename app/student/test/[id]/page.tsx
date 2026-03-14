"use client";

import { useEffect, useState, useCallback, use, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import BrandLoader from "@/components/ui/BrandLoader";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Flag,
  Shield,
  Maximize,
  Lock,
  Send,
  Clock,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Zap,
  Award,
  XCircle,
  Check,
  Mic,
} from "lucide-react";
import { QuestionCard } from "@/components/test/QuestionCard";
import { VoiceControls } from "@/components/interview/VoiceControls";
import { ProctorProvider, useProctor } from "@/components/test/ProctorProvider";
import type { CodeLanguage } from "@/components/test/CodeEditor";

interface MCQOption {
  label: string;
  text: string;
  isCorrect: boolean;
}

interface BlankDef {
  id: number;
  correctAnswer?: string;
}

interface MatchingPair {
  id: number;
  item: string;
  correctMatch?: string;
}

interface QuestionData {
  _id: string;
  domain: string;
  type: string;
  difficulty: string;
  content: {
    text: string;
    options?: MCQOption[];
    blanks?: BlankDef[];
    codeTemplate?: string;
    audioUrl?: string;
    instructions?: string;
    formula?: string;
    imageUrl?: string;
    matchingPairs?: MatchingPair[];
    multiSelectCorrect?: string[];
    wordLimit?: string;
  };
  answerFormat: string;
  rubric: { maxScore: number };
  testCasesCount?: number;
}

interface AnswerResult {
  score: number;
  maxScore: number;
  feedback: string;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const DOMAIN_COLORS: Record<string, string> = {
  english: "bg-blue-500",
  math: "bg-emerald-500",
  aptitude: "bg-purple-500",
  coding: "bg-orange-500",
  hr: "bg-pink-500",
  situational: "bg-amber-500",
  general: "bg-slate-500",
  communication: "bg-cyan-500",
  mixed: "bg-indigo-500",
};

export default function TestTakingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: testId } = use(params);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 320, height: 240 }, audio: true })
      .then((stream) => setCameraStream(stream))
      .catch(() => {});
  }, []);

  const [fullscreenReady, setFullscreenReady] = useState(false);

  const handleEnterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenReady(true);
    } catch {
      // Fullscreen failed (e.g. browser blocked it) — still allow entry
      setFullscreenReady(true);
    }
  };

  if (!fullscreenReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-10 shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Proctored Test Mode</h1>
            <p className="text-gray-300 text-sm mb-8 leading-relaxed">
              This test runs in fullscreen with proctoring enabled. Tab switching, copy/paste,
              and other actions will be monitored and recorded.
            </p>
            <div className="space-y-3 text-left text-sm text-gray-400 mb-8">
              <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                <Shield className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>All violations are logged and reported</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                <Maximize className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Test runs in mandatory fullscreen mode</span>
              </div>
            </div>
            <button
              onClick={handleEnterFullscreen}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary-500 to-accent text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity text-lg shadow-lg shadow-primary-500/30"
            >
              <Maximize className="w-5 h-5" />
              Enter Fullscreen & Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProctorProvider cameraStream={cameraStream} enabled={true}>
      <TestContent testId={testId} />
    </ProctorProvider>
  );
}

const MAX_FULLSCREEN_EXITS = 3;

function TestContent({ testId }: { testId: string }) {
  const router = useRouter();
  const { warningCount, isFullscreen, fullscreenExitCount, finishProctoring } = useProctor();
  const [autoCancelling, setAutoCancelling] = useState(false);

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Answer states
  const [answer, setAnswer] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>("python");
  const [blanksAnswers, setBlanksAnswers] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track which questions have been answered and their results
  const [answeredMap, setAnsweredMap] = useState<Record<number, AnswerResult>>({});
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [showingResult, setShowingResult] = useState(false);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch test on mount
  useEffect(() => {
    fetch(`/api/tests/${testId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error ?? "Failed to load test");
        const test = data.data.test;
        const qs: QuestionData[] = test.questions.map((q: any) => {
          const populated = q.questionId;
          return {
            _id: String(populated?._id ?? q.questionId),
            domain: populated?.domain ?? "general",
            type: populated?.type ?? "text",
            difficulty: populated?.difficulty ?? "medium",
            content: populated?.content ?? { text: "Question not available" },
            answerFormat: populated?.answerFormat ?? "text",
            rubric: { maxScore: populated?.rubric?.maxScore ?? 0 },
            testCasesCount: populated?.testCasesCount ?? q.testCasesCount ?? 0,
          };
        });
        setQuestions(qs);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [testId]);

  // Auto-cancel on fullscreen exits
  useEffect(() => {
    if (fullscreenExitCount >= MAX_FULLSCREEN_EXITS && !autoCancelling) {
      setAutoCancelling(true);
      (async () => {
        try {
          await finishProctoring(testId);
          await fetch(`/api/tests/${testId}/complete`, { method: "POST" });
        } catch {}
        router.push(`/student/test/${testId}/results`);
      })();
    }
  }, [fullscreenExitCount, autoCancelling, finishProctoring, testId, router]);

  // Reset answer state when question changes
  useEffect(() => {
    setAnswer("");
    setVoiceTranscript("");
    setBlanksAnswers({});
    setShowingResult(false);
    setLastResult(null);
  }, [currentIndex, questions]);

  const answeredCount = Object.keys(answeredMap).length;
  const totalScore = Object.values(answeredMap).reduce((s, r) => s + r.score, 0);
  const totalMaxScore = Object.values(answeredMap).reduce((s, r) => s + r.maxScore, 0);

  const submitAnswer = useCallback(async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ || isSubmitting) return;

    const isCodeQuestion = currentQ.type === "code" || currentQ.answerFormat === "code";
    let finalAnswer = voiceTranscript || answer;
    if (currentQ.answerFormat === "fill_in_blanks" && Object.keys(blanksAnswers).length > 0) {
      finalAnswer = JSON.stringify(blanksAnswers);
    }
    if (!finalAnswer.trim()) return;

    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        questionId: currentQ._id,
        answer: finalAnswer,
      };
      if (currentQ.answerFormat === "fill_in_blanks") {
        body.blanksAnswers = blanksAnswers;
      }
      if (voiceTranscript) body.voiceTranscript = voiceTranscript;
      if (isCodeQuestion) {
        body.codeSubmission = { code: finalAnswer, language: codeLanguage };
      }

      const res = await fetch(`/api/tests/${testId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to submit answer");

      const evaluation = data.data.evaluation;
      const result: AnswerResult = {
        score: evaluation.score,
        maxScore: evaluation.maxScore,
        feedback: evaluation.feedback,
      };

      setAnsweredMap((prev) => ({ ...prev, [currentIndex]: result }));
      setLastResult(result);
      setShowingResult(true);

      // Check if all answered
      const newAnswered = { ...answeredMap, [currentIndex]: result };
      if (Object.keys(newAnswered).length >= questions.length) {
        setIsComplete(true);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answer, voiceTranscript, codeLanguage, currentIndex, questions, testId, isSubmitting, blanksAnswers, answeredMap]);

  const goToQuestion = (idx: number) => {
    if (idx >= 0 && idx < questions.length) {
      setCurrentIndex(idx);
    }
  };

  const handleFinishTest = async () => {
    if (isEnding) return;
    setIsEnding(true);
    try {
      await finishProctoring(testId);
      const res = await fetch(`/api/tests/${testId}/complete`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        router.push(`/student/test/${testId}/results`);
      } else {
        setError(data.error ?? "Failed to complete test");
        setIsEnding(false);
      }
    } catch {
      setError("Network error — please try again");
      setIsEnding(false);
    }
  };

  // ── Overlays ──
  if (autoCancelling) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-red-500/30 p-10 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Exam Auto-Cancelled</h2>
            <p className="text-red-200 text-sm mb-4">
              You exited fullscreen {MAX_FULLSCREEN_EXITS} times. Your test has been automatically submitted.
            </p>
            <div className="w-10 h-10 border-4 border-red-400/30 border-t-red-400 rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!isFullscreen && !loading) {
    const remaining = MAX_FULLSCREEN_EXITS - fullscreenExitCount;
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-orange-500/30 p-10 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Fullscreen Required</h2>
            <p className="text-gray-300 text-sm mb-3">You exited fullscreen mode. This has been recorded as a violation.</p>
            <div className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full mb-6 ${remaining <= 1 ? "bg-red-500/20 text-red-300" : "bg-orange-500/20 text-orange-300"}`}>
              <Shield className="w-4 h-4" />
              {remaining} exit{remaining !== 1 ? "s" : ""} remaining before auto-cancel
            </div>
            <button
              onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity text-lg shadow-lg"
            >
              <Maximize className="w-5 h-5" />
              Re-enter Fullscreen
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <BrandLoader text="Loading test..." />;

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

  const currentQ = questions[currentIndex];
  const currentResult = answeredMap[currentIndex];
  const isCurrentAnswered = !!currentResult;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* ── Left Sidebar: Question Navigator ── */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-violet-600" />
            <h2 className="text-sm font-bold text-gray-900">Questions</h2>
          </div>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500 font-medium">{answeredCount}/{questions.length} answered</span>
              <span className="text-violet-600 font-bold">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Score summary */}
        {answeredCount > 0 && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-bold text-violet-700">
                Score: {totalScore.toFixed(1)} / {totalMaxScore.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Question grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, idx) => {
              const isActive = idx === currentIndex;
              const result = answeredMap[idx];
              const isAnswered = !!result;
              const scorePercent = result ? (result.score / result.maxScore) * 100 : 0;
              const domainColor = DOMAIN_COLORS[q.domain] || DOMAIN_COLORS.general;

              return (
                <button
                  key={idx}
                  onClick={() => goToQuestion(idx)}
                  className={`relative w-full aspect-square rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center
                    ${isActive
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-200 scale-110 ring-2 ring-violet-300"
                      : isAnswered
                      ? scorePercent >= 70
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : scorePercent >= 40
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-red-100 text-red-700 border border-red-200"
                      : "bg-gray-50 text-gray-500 border border-gray-200 hover:border-violet-300 hover:bg-violet-50"
                    }`}
                  title={`Q${idx + 1} - ${q.domain} (${q.difficulty})`}
                >
                  {idx + 1}
                  {/* Domain dot */}
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${domainColor}`} />
                  {isAnswered && !isActive && (
                    <span className="absolute -bottom-0.5 -right-0.5">
                      {scorePercent >= 70 ? (
                        <Check className="w-2.5 h-2.5 text-green-600" />
                      ) : (
                        <XCircle className="w-2.5 h-2.5 text-red-400" />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Finish button */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleFinishTest}
            disabled={!isComplete || isEnding}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all
              ${isComplete && !isEnding
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200 hover:-translate-y-0.5"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            {isEnding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
            {isEnding ? "Finishing..." : isComplete ? "Finish & Get Results" : `${answeredCount}/${questions.length} Done`}
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 bg-white border-b border-gray-200 shadow-sm px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-bold text-gray-900">Test in Progress</span>
              </div>
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                Q{currentIndex + 1} of {questions.length}
              </span>
              {currentQ && (
                <span className={`text-[10px] font-bold text-white px-2.5 py-1 rounded-full ${DOMAIN_COLORS[currentQ.domain] || "bg-gray-500"}`}>
                  {currentQ.domain.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {warningCount > 0 && (
                <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                  warningCount >= 5 ? "bg-red-100 text-red-700" : warningCount >= 3 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  <Shield className="w-3 h-3" />
                  {warningCount} warning{warningCount !== 1 ? "s" : ""}
                </span>
              )}
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-mono font-bold text-gray-700">{formatDuration(elapsedSeconds)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Question + Answer area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Audio player */}
            {currentQ?.content.audioUrl && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Listening Audio</span>
                  <audio controls controlsList="nodownload" src={currentQ.content.audioUrl} className="flex-1 h-10" />
                </div>
              </div>
            )}

            {/* Question Card */}
            {currentQ && (
              <QuestionCard
                question={{
                  ...currentQ,
                  difficulty: currentQ.difficulty as "easy" | "medium" | "hard",
                  content: {
                    text: currentQ.content.text,
                    formula: currentQ.content.formula,
                    imageUrl: currentQ.content.imageUrl,
                    audioUrl: currentQ.content.audioUrl,
                    instructions: currentQ.content.instructions,
                    options: currentQ.content.options?.map((o) => ({ ...o, isCorrect: false })),
                    blanks: currentQ.content.blanks?.map((b) => ({ id: b.id })),
                  },
                }}
                index={currentIndex}
                total={questions.length}
              />
            )}

            {/* Score result after answering */}
            {showingResult && lastResult && (
              <div className={`rounded-xl border-2 p-5 transition-all animate-in slide-in-from-top-2 duration-300 ${
                (lastResult.score / lastResult.maxScore) >= 0.7
                  ? "bg-green-50 border-green-300"
                  : (lastResult.score / lastResult.maxScore) >= 0.4
                  ? "bg-amber-50 border-amber-300"
                  : "bg-red-50 border-red-300"
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                    (lastResult.score / lastResult.maxScore) >= 0.7
                      ? "bg-green-500"
                      : (lastResult.score / lastResult.maxScore) >= 0.4
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}>
                    <span className="text-white font-bold text-lg">
                      {lastResult.score}/{lastResult.maxScore}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {(lastResult.score / lastResult.maxScore) >= 0.7 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (lastResult.score / lastResult.maxScore) >= 0.4 ? (
                        <Zap className="w-5 h-5 text-amber-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`text-sm font-bold ${
                        (lastResult.score / lastResult.maxScore) >= 0.7 ? "text-green-800" :
                        (lastResult.score / lastResult.maxScore) >= 0.4 ? "text-amber-800" : "text-red-800"
                      }`}>
                        {(lastResult.score / lastResult.maxScore) >= 0.7 ? "Great job!" :
                         (lastResult.score / lastResult.maxScore) >= 0.4 ? "Good effort!" : "Needs improvement"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{lastResult.feedback}</p>
                  </div>
                </div>

                {/* Navigate to next */}
                {currentIndex < questions.length - 1 && (
                  <button
                    onClick={() => goToQuestion(currentIndex + 1)}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Next Question
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {isComplete && (
                  <button
                    onClick={handleFinishTest}
                    disabled={isEnding}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl py-3 text-sm font-bold shadow-lg disabled:opacity-50"
                  >
                    {isEnding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                    {isEnding ? "Finishing..." : "Finish & Get Results"}
                  </button>
                )}
              </div>
            )}

            {/* Answer Input Area */}
            {!showingResult && currentQ && (
              <StructuredAnswerArea
                question={currentQ}
                answer={answer}
                setAnswer={setAnswer}
                blanksAnswers={blanksAnswers}
                setBlanksAnswers={setBlanksAnswers}
                voiceTranscript={voiceTranscript}
                setVoiceTranscript={setVoiceTranscript}
                codeLanguage={codeLanguage}
                setCodeLanguage={setCodeLanguage}
                isSubmitting={isSubmitting}
                submitAnswer={submitAnswer}
                textareaRef={textareaRef}
                isAnswered={isCurrentAnswered}
              />
            )}

            {/* Already answered — show result */}
            {isCurrentAnswered && !showingResult && currentResult && (
              <div className={`rounded-xl border p-4 ${
                (currentResult.score / currentResult.maxScore) >= 0.7
                  ? "bg-green-50 border-green-200"
                  : (currentResult.score / currentResult.maxScore) >= 0.4
                  ? "bg-amber-50 border-amber-200"
                  : "bg-red-50 border-red-200"
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-700">
                    Score: {currentResult.score}/{currentResult.maxScore}
                  </span>
                  <span className="text-xs text-gray-500">— {currentResult.feedback}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex <= 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-xs text-gray-400 font-medium">
              Question {currentIndex + 1} of {questions.length}
            </span>

            <button
              onClick={() => goToQuestion(currentIndex + 1)}
              disabled={currentIndex >= questions.length - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Structured answer area */
function StructuredAnswerArea({
  question,
  answer,
  setAnswer,
  blanksAnswers,
  setBlanksAnswers,
  voiceTranscript,
  setVoiceTranscript,
  codeLanguage,
  setCodeLanguage,
  isSubmitting,
  submitAnswer,
  textareaRef,
  isAnswered,
}: {
  question: QuestionData;
  answer: string;
  setAnswer: (v: string) => void;
  blanksAnswers: Record<string, string>;
  setBlanksAnswers: (v: Record<string, string>) => void;
  voiceTranscript: string;
  setVoiceTranscript: (v: string) => void;
  codeLanguage: CodeLanguage;
  setCodeLanguage: (v: CodeLanguage) => void;
  isSubmitting: boolean;
  submitAnswer: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  isAnswered: boolean;
}) {
  if (isAnswered) return null;

  const disabled = isSubmitting;
  const af = question.answerFormat;
  const opts = question.content.options;
  const blanks = question.content.blanks;
  const pairs = question.content.matchingPairs;

  const isStructured =
    (af === "mcq" && opts?.length) ||
    (af === "fill_in_blanks" && blanks?.length) ||
    (af === "matching" && pairs?.length && opts?.length) ||
    (af === "multi_select" && opts?.length);

  const canSubmit = (() => {
    if (disabled) return false;
    if (af === "mcq") return !!answer;
    if (af === "fill_in_blanks") return Object.values(blanksAnswers).some((v) => v.trim());
    if (af === "matching") {
      try { const m = JSON.parse(answer); return Object.values(m).some((v) => v); } catch { return false; }
    }
    if (af === "multi_select") {
      try { const s = JSON.parse(answer); return Array.isArray(s) && s.length > 0; } catch { return false; }
    }
    return !!(voiceTranscript || answer).trim();
  })();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Answer</h3>

      {/* MCQ */}
      {af === "mcq" && opts && opts.length > 0 && (
        <div className="space-y-2">
          {opts.map((opt) => {
            const isSelected = answer === opt.label;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => !disabled && setAnswer(opt.label)}
                disabled={disabled}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all text-left disabled:cursor-not-allowed
                  ${isSelected
                    ? "border-violet-500 bg-violet-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all
                  ${isSelected ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {opt.label}
                </span>
                <span className={`text-sm ${isSelected ? "text-violet-900 font-medium" : "text-gray-700"}`}>
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Fill-in-blanks */}
      {af === "fill_in_blanks" && blanks && blanks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {Object.values(blanksAnswers).filter((v) => v.trim()).length} / {blanks.length} answered
            </span>
          </div>
          {question.content.wordLimit && (
            <p className="text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg font-medium">
              Write {question.content.wordLimit} for each answer.
            </p>
          )}
          <div className="space-y-2">
            {blanks.map((blank) => (
              <div key={blank.id} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {blank.id}
                </span>
                <input
                  type="text"
                  value={blanksAnswers[String(blank.id)] || ""}
                  onChange={(e) => setBlanksAnswers({ ...blanksAnswers, [String(blank.id)]: e.target.value })}
                  disabled={disabled}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:opacity-50 transition-all"
                  placeholder={`Answer for #${blank.id}...`}
                  maxLength={100}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matching */}
      {af === "matching" && pairs && pairs.length > 0 && opts && opts.length > 0 && (() => {
        let matchAnswers: Record<string, string> = {};
        try { matchAnswers = answer ? JSON.parse(answer) : {}; } catch { matchAnswers = {}; }
        return (
          <div className="space-y-2">
            {pairs.map((pair) => (
              <div key={pair.id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <span className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold shrink-0">{pair.id}</span>
                <span className="flex-1 text-sm font-medium text-gray-800">{pair.item}</span>
                <select
                  value={matchAnswers[String(pair.id)] || ""}
                  onChange={(e) => {
                    const updated = { ...matchAnswers, [String(pair.id)]: e.target.value };
                    setAnswer(JSON.stringify(updated));
                  }}
                  disabled={disabled}
                  className="px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-sm font-medium focus:outline-none focus:border-violet-400 disabled:opacity-50 transition-all min-w-[140px]"
                >
                  <option value="">Select...</option>
                  {opts.map((opt) => (
                    <option key={opt.label} value={opt.label}>{opt.label}. {opt.text}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Multi-select */}
      {af === "multi_select" && opts && opts.length > 0 && (() => {
        let selected: string[] = [];
        try { selected = answer ? JSON.parse(answer) : []; } catch { selected = []; }
        const expectedCount = question.content.multiSelectCorrect?.length ?? 2;
        return (
          <div className="space-y-2">
            <span className="text-xs text-gray-400">{selected.length} / {expectedCount} selected</span>
            {opts.map((opt) => {
              const isSelected = selected.includes(opt.label);
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    if (disabled) return;
                    const updated = isSelected ? selected.filter((l) => l !== opt.label) : [...selected, opt.label];
                    setAnswer(JSON.stringify(updated));
                  }}
                  disabled={disabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left disabled:cursor-not-allowed
                    ${isSelected ? "border-teal-500 bg-teal-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${isSelected ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {isSelected ? "✓" : opt.label}
                  </span>
                  <span className={`text-sm ${isSelected ? "text-teal-900 font-medium" : "text-gray-700"}`}>{opt.text}</span>
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Text/Voice/Code answer */}
      {!isStructured && (
        <>
          {/* Voice only for non-coding questions */}
          {question.type !== "code" && question.answerFormat !== "code" && (
            <>
              <VoiceControls
                onTranscript={(t) => {
                  setVoiceTranscript(t);
                  if (textareaRef.current) textareaRef.current.value = t;
                }}
                disabled={disabled}
              />

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or type your answer</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </>
          )}

          {/* Language selector for coding questions */}
          {(question.type === "code" || question.answerFormat === "code") && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Language:</span>
              <select
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value as CodeLanguage)}
                disabled={disabled}
                className="text-xs bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 font-medium text-gray-700"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={voiceTranscript || answer}
            onChange={(e) => {
              if (voiceTranscript) setVoiceTranscript(e.target.value);
              else setAnswer(e.target.value);
            }}
            disabled={disabled}
            placeholder={question.type === "code" || question.answerFormat === "code"
              ? "Write your code here..."
              : "Type your answer here... Be detailed and specific."}
            rows={question.type === "code" || question.answerFormat === "code" ? 12 : 6}
            className={`w-full input-field resize-none text-sm disabled:opacity-50 ${
              question.type === "code" || question.answerFormat === "code" ? "font-mono text-xs leading-relaxed bg-gray-900 text-green-400 rounded-xl p-4 border-gray-700" : ""
            }`}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submitAnswer();
              }
            }}
          />
        </>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400">
          {isStructured ? "Select your answer, then submit" : "Ctrl+Enter to submit"}
        </p>
        <button
          onClick={submitAnswer}
          disabled={!canSubmit}
          className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-30 shadow-lg shadow-violet-200 hover:shadow-xl transition-all disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Submit Answer
        </button>
      </div>
    </div>
  );
}
