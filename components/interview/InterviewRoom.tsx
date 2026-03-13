"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Flag, Clock, CheckCircle2 } from "lucide-react";
import { AIAvatar } from "./AIAvatar";
import { ChatHistory, ChatMessage } from "./ChatHistory";
import { VoiceControls } from "./VoiceControls";

interface InterviewRoomProps {
  interviewId: string;
  initialQuestion: string;
  role: string;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function InterviewRoom({ interviewId, initialQuestion, role }: InterviewRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "interviewer", content: initialQuestion, timestamp: new Date() },
  ]);
  const [answer, setAnswer] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [lastEvaluation, setLastEvaluation] = useState<{ score: number; maxScore: number; feedback: string } | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const startTimeRef = useRef(Date.now());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const submitAnswer = useCallback(async () => {
    const finalAnswer = voiceTranscript || answer;
    if (!finalAnswer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setIsThinking(true);

    // Add candidate message immediately
    const candidateMsg: ChatMessage = {
      role: "candidate",
      content: finalAnswer,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, candidateMsg]);
    setAnswer("");
    setVoiceTranscript("");

    try {
      const res = await fetch(`/api/interviews/${interviewId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: finalAnswer, voiceTranscript }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error ?? "Failed to process answer");

      const { nextQuestion, evaluation, isComplete: done, exchangeCount: count } = data.data;

      setExchangeCount(count);
      setLastEvaluation(evaluation);

      // Update the candidate message with mini score
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          miniScore: evaluation,
        };
        return updated;
      });

      if (done) {
        setIsComplete(true);
      } else if (nextQuestion) {
        setQuestionNumber((q) => q + 1);
        // Small delay for natural feel
        await new Promise((r) => setTimeout(r, 500));
        setMessages((prev) => [
          ...prev,
          { role: "interviewer", content: nextQuestion, timestamp: new Date() },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setIsThinking(false);
    }
  }, [answer, voiceTranscript, interviewId, isSubmitting]);

  const handleEndInterview = async () => {
    if (isEnding) return;
    setIsEnding(true);
    try {
      const res = await fetch(`/api/interviews/${interviewId}/end`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        router.push(`/student/interview/${interviewId}/report`);
      }
    } catch (err) {
      console.error(err);
      setIsEnding(false);
    }
  };

  const canEnd = exchangeCount >= 5 || isComplete;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <div className="shrink-0 bg-white border-b border-gray-200 shadow-sm px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-gray-900">
              Interview: <span className="text-primary-600">{role}</span>
            </span>
            <span className="text-xs text-gray-400 hidden sm:block">
              Q{questionNumber} of ~8
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono font-medium">{formatDuration(elapsedSeconds)}</span>
          </div>

          <button
            onClick={handleEndInterview}
            disabled={!canEnd || isEnding}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${canEnd && !isEnding
                ? "bg-accent hover:bg-accent-dark text-white shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            title={canEnd ? "End interview and get your report" : `Answer at least 5 questions first (${exchangeCount}/5)`}
          >
            {isEnding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Flag className="w-4 h-4" />
            )}
            {isEnding ? "Generating Report..." : "End Interview"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden max-w-4xl mx-auto w-full flex flex-col gap-0">
        {/* AI Avatar + current question */}
        <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex items-start gap-4">
            <AIAvatar isThinking={isThinking} isSpeaking={!isThinking && messages[messages.length - 1]?.role === "interviewer"} />
            <div className="flex-1 min-w-0">
              {isThinking ? (
                <div className="flex items-center gap-2 text-amber-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Evaluating your response...</span>
                </div>
              ) : (
                <div className="bg-primary-50 border border-primary-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {messages.filter((m) => m.role === "interviewer").slice(-1)[0]?.content ?? initialQuestion}
                  </p>
                </div>
              )}

              {/* Mini score after submission */}
              {lastEvaluation && !isThinking && (
                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-green-700 font-medium">
                    Score: {lastEvaluation.score}/{lastEvaluation.maxScore}
                  </span>
                  <span className="text-xs text-gray-500">
                    {lastEvaluation.feedback.slice(0, 80)}{lastEvaluation.feedback.length > 80 ? "..." : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-hidden px-4">
          <ChatHistory messages={messages} />
        </div>

        {/* Interview complete banner */}
        {isComplete && (
          <div className="shrink-0 mx-4 mb-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-800">Interview Complete!</p>
            <p className="text-xs text-green-600 mb-3">You have answered all questions. Click "End Interview" to get your AIRS report.</p>
            <button
              onClick={handleEndInterview}
              disabled={isEnding}
              className="btn-primary btn-sm flex items-center gap-2 mx-auto"
            >
              {isEnding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              {isEnding ? "Generating..." : "Get My AIRS Report"}
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

              {/* Text input */}
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={voiceTranscript || answer}
                  onChange={(e) => {
                    if (voiceTranscript) setVoiceTranscript(e.target.value);
                    else setAnswer(e.target.value);
                  }}
                  disabled={isSubmitting || isThinking}
                  placeholder="Type your answer here... Be detailed and specific."
                  rows={3}
                  className="flex-1 input-field resize-none text-sm disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      submitAnswer();
                    }
                  }}
                />
                <button
                  onClick={submitAnswer}
                  disabled={isSubmitting || isThinking || (!(voiceTranscript || answer).trim())}
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
              <p className="text-xs text-gray-400">Ctrl+Enter to submit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
