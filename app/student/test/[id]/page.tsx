"use client";

import { useEffect, useState, useCallback, use, useRef } from "react";
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
  Code2,
} from "lucide-react";
import { AIAvatar } from "@/components/interview/AIAvatar";
import { ChatHistory, ChatMessage } from "@/components/interview/ChatHistory";
import { VoiceControls } from "@/components/interview/VoiceControls";
import { ProctorProvider, useProctor } from "@/components/test/ProctorProvider";
import { CodeLanguage } from "@/components/test/CodeEditor";

interface QuestionData {
  _id: string;
  domain: string;
  type: string;
  difficulty: string;
  content: {
    text: string;
    options?: any[];
    blanks?: any[];
    codeTemplate?: string;
    audioUrl?: string;
    matchingPairs?: any[];
    multiSelectCorrect?: string[];
    wordLimit?: string;
  };
  answerFormat: string;
  rubric: { maxScore: number };
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function questionToPrompt(q: QuestionData, index: number, total: number): string {
  let prompt = `Question ${index + 1} of ${total} [${q.domain.toUpperCase()} - ${q.difficulty}]\n\n${q.content.text}`;

  // Audio indicator
  if (q.content.audioUrl) {
    prompt += "\n\n🎧 Listen to the audio above, then answer below.";
  }

  // Options for MCQ, matching, multi-select
  if (q.content.options?.length && (q.type === "mcq" || q.answerFormat === "matching" || q.answerFormat === "multi_select" || q.answerFormat === "mcq")) {
    prompt += "\n\nOptions:\n" + q.content.options.map((o: any) => `${o.label}) ${o.text}`).join("\n");
  }

  if (q.type === "code" && q.content.codeTemplate) {
    prompt += `\n\nCode template:\n\`\`\`\n${q.content.codeTemplate}\n\`\`\``;
  }

  if (q.answerFormat === "fill_in_blanks" && q.content.blanks?.length) {
    prompt += `\n\n(Fill in ${q.content.blanks.length} blank${q.content.blanks.length > 1 ? "s" : ""})`;
    if (q.content.wordLimit) prompt += `\nWrite ${q.content.wordLimit} for each answer.`;
  }

  if (q.answerFormat === "matching" && q.content.matchingPairs?.length) {
    prompt += "\n\nMatch each item to the correct option:";
    q.content.matchingPairs.forEach((p: any) => {
      prompt += `\n${p.id}. ${p.item} → [Select A-F]`;
    });
  }

  if (q.answerFormat === "multi_select") {
    const count = q.content.multiSelectCorrect?.length ?? 2;
    prompt += `\n\n(Choose ${count} correct option${count > 1 ? "s" : ""})`;
  }

  return prompt;
}

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
    } catch {
      // Some browsers may not support fullscreen — proceed anyway
    }
    setFullscreenReady(true);
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

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answer, setAnswer] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>("python");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch test questions on mount
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
          };
        });

        setQuestions(qs);

        // Start with first question as AI message
        if (qs.length > 0) {
          const greeting: ChatMessage = {
            role: "interviewer",
            content: `Welcome to your test! I'll be your AI examiner today. I have ${qs.length} questions for you across different domains. Let's begin!\n\n${questionToPrompt(qs[0], 0, qs.length)}`,
            timestamp: new Date(),
          };
          setMessages([greeting]);
          if (qs[0].type === "code") setCodeMode(true);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [testId]);

  // Auto-cancel exam if student exits fullscreen too many times
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

  const submitAnswer = useCallback(async () => {
    const finalAnswer = codeMode ? codeValue : (voiceTranscript || answer);
    if (!finalAnswer.trim() || isSubmitting) return;

    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setIsSubmitting(true);
    setIsThinking(true);

    // Add candidate message immediately
    const candidateMsg: ChatMessage = {
      role: "candidate",
      content: codeMode ? `\`\`\`${codeLanguage}\n${codeValue}\n\`\`\`` : finalAnswer,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, candidateMsg]);
    setAnswer("");
    setVoiceTranscript("");
    setCodeValue("");
    setCodeMode(false);

    try {
      const body: any = {
        questionId: currentQ._id,
        answer: codeMode ? codeValue : finalAnswer,
      };
      if (voiceTranscript) body.voiceTranscript = voiceTranscript;
      if (codeMode) {
        body.codeSubmission = { code: codeValue, language: codeLanguage };
      }

      const res = await fetch(`/api/tests/${testId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error ?? "Failed to submit answer");

      const evaluation = data.data.evaluation;
      const codeResults = data.data.codeResults;

      // Update candidate message with score
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          miniScore: {
            score: evaluation.score,
            maxScore: evaluation.maxScore,
            feedback: evaluation.feedback,
          },
        };
        return updated;
      });

      // Small delay for natural feel
      await new Promise((r) => setTimeout(r, 800));

      const nextIdx = currentIndex + 1;

      if (nextIdx >= questions.length) {
        // All questions answered
        setIsComplete(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "interviewer",
            content: `Excellent! You've completed all ${questions.length} questions. ${
              evaluation.score >= evaluation.maxScore * 0.7
                ? "Great job on that last one!"
                : "Thanks for your answer."
            }\n\nYour test is now complete. Click "Finish Test" to see your results and detailed feedback.`,
            timestamp: new Date(),
          },
        ]);
      } else {
        // Move to next question
        const nextQ = questions[nextIdx];
        setCurrentIndex(nextIdx);

        let transitionMsg = "";
        if (evaluation.score >= evaluation.maxScore * 0.8) {
          transitionMsg = "Well done! Let's move on to the next question.\n\n";
        } else if (evaluation.score >= evaluation.maxScore * 0.5) {
          transitionMsg = "Good effort! Let's continue with the next question.\n\n";
        } else {
          transitionMsg = "Let's move on. Here's your next question.\n\n";
        }

        if (codeResults) {
          transitionMsg = `Code results: ${codeResults.passed}/${codeResults.total} tests passed. ${transitionMsg}`;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "interviewer",
            content: transitionMsg + questionToPrompt(nextQ, nextIdx, questions.length),
            timestamp: new Date(),
          },
        ]);

        if (nextQ.type === "code") setCodeMode(true);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "interviewer",
          content: "Sorry, there was an error processing your answer. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSubmitting(false);
      setIsThinking(false);
    }
  }, [answer, voiceTranscript, codeValue, codeMode, codeLanguage, currentIndex, questions, testId, isSubmitting]);

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

  // Auto-cancel overlay
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
              You exited fullscreen {MAX_FULLSCREEN_EXITS} times. Your test has been automatically submitted with all recorded violations.
            </p>
            <div className="w-10 h-10 border-4 border-red-400/30 border-t-red-400 rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen exit warning overlay
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
            <p className="text-gray-300 text-sm mb-3">
              You exited fullscreen mode. This has been recorded as a violation.
            </p>
            <div className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full mb-6 ${
              remaining <= 1 ? "bg-red-500/20 text-red-300" : "bg-orange-500/20 text-orange-300"
            }`}>
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

  if (loading) {
    return <BrandLoader text="Loading test..." />;
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <div className="shrink-0 bg-white border-b border-gray-200 shadow-sm px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-gray-900">
              Test in Progress
            </span>
            <span className="text-xs text-gray-400 hidden sm:block">
              Q{currentIndex + 1} of {questions.length}
            </span>
            {warningCount > 0 && (
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                warningCount >= 5 ? "bg-red-100 text-red-700" : warningCount >= 3 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
              }`}>
                <Shield className="w-3 h-3" />
                {warningCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono font-medium">{formatDuration(elapsedSeconds)}</span>
          </div>

          <button
            onClick={handleFinishTest}
            disabled={!isComplete || isEnding}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${isComplete && !isEnding
                ? "bg-accent hover:bg-accent-dark text-white shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            title={isComplete ? "Finish and get results" : `Answer all questions first (${currentIndex}/${questions.length})`}
          >
            {isEnding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Flag className="w-4 h-4" />
            )}
            {isEnding ? "Finishing..." : "Finish Test"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden max-w-4xl mx-auto w-full flex flex-col gap-0">
        {/* Audio player for listening questions */}
        {questions[currentIndex]?.content.audioUrl && (
          <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Listening</span>
              <audio
                controls
                controlsList="nodownload"
                src={questions[currentIndex].content.audioUrl}
                className="flex-1 h-10"
              />
            </div>
          </div>
        )}

        {/* AI Avatar + current question */}
        <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex items-start gap-4">
            <AIAvatar
              isThinking={isThinking}
              isSpeaking={!isThinking && messages[messages.length - 1]?.role === "interviewer"}
              name="AI Examiner"
              subtitle="Test Proctor"
            />
            <div className="flex-1 min-w-0">
              {isThinking ? (
                <div className="flex items-center gap-2 text-amber-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Evaluating your answer...</span>
                </div>
              ) : (
                <div className="bg-primary-50 border border-primary-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {messages.filter((m) => m.role === "interviewer").slice(-1)[0]?.content ?? "Loading..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-hidden px-4">
          <ChatHistory messages={messages} />
        </div>

        {/* Test complete banner */}
        {isComplete && (
          <div className="shrink-0 mx-4 mb-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-800">All Questions Answered!</p>
            <p className="text-xs text-green-600 mb-3">Click &quot;Finish Test&quot; to see your detailed results.</p>
            <button
              onClick={handleFinishTest}
              disabled={isEnding}
              className="btn-primary btn-sm flex items-center gap-2 mx-auto"
            >
              {isEnding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              {isEnding ? "Finishing..." : "Get My Results"}
            </button>
          </div>
        )}

        {/* Answer input area */}
        {!isComplete && (
          <div className="shrink-0 bg-white border-t border-gray-200 px-4 py-4">
            <div className="space-y-3">
              {/* Voice controls */}
              <VoiceControls
                onTranscript={(t) => {
                  setVoiceTranscript(t);
                  if (textareaRef.current) textareaRef.current.value = t;
                }}
                disabled={isSubmitting || isThinking}
              />

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or type your answer</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Code toggle for code questions */}
              {questions[currentIndex]?.type === "code" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCodeMode(!codeMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      codeMode
                        ? "bg-primary-100 text-primary-700 border border-primary-300"
                        : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    {codeMode ? "Code Mode ON" : "Switch to Code"}
                  </button>
                  {codeMode && (
                    <select
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value as CodeLanguage)}
                      className="text-xs bg-gray-100 border border-gray-200 rounded-lg px-2 py-1.5"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                    </select>
                  )}
                </div>
              )}

              {/* Text/Code input */}
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={codeMode ? codeValue : (voiceTranscript || answer)}
                  onChange={(e) => {
                    if (codeMode) {
                      setCodeValue(e.target.value);
                    } else if (voiceTranscript) {
                      setVoiceTranscript(e.target.value);
                    } else {
                      setAnswer(e.target.value);
                    }
                  }}
                  disabled={isSubmitting || isThinking}
                  placeholder={codeMode ? "Write your code here..." : "Type your answer here... Be detailed and specific."}
                  rows={codeMode ? 8 : 3}
                  className={`flex-1 input-field resize-none text-sm disabled:opacity-50 ${
                    codeMode ? "font-mono text-xs" : ""
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !codeMode) {
                      e.preventDefault();
                      submitAnswer();
                    }
                  }}
                />
                <button
                  onClick={submitAnswer}
                  disabled={
                    isSubmitting ||
                    isThinking ||
                    (codeMode ? !codeValue.trim() : !(voiceTranscript || answer).trim())
                  }
                  className="btn-primary px-4 self-end flex items-center gap-2 disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Submit</span>
                </button>
              </div>
              <p className="text-xs text-gray-400">
                {codeMode ? "Write your solution, then click Submit" : "Ctrl+Enter to submit"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
