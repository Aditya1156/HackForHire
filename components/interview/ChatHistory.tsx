"use client";

import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";

export interface ChatMessage {
  role: "interviewer" | "candidate";
  content: string;
  timestamp?: Date | string;
  miniScore?: { score: number; maxScore: number; feedback: string } | null;
}

interface ChatHistoryProps {
  messages: ChatMessage[];
}

function formatTime(ts?: Date | string) {
  if (!ts) return "";
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ScoreBadge({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const color =
    pct >= 80 ? "bg-green-100 text-green-700 border-green-200"
    : pct >= 60 ? "bg-blue-100 text-blue-700 border-blue-200"
    : pct >= 40 ? "bg-yellow-100 text-yellow-700 border-yellow-200"
    : "bg-red-100 text-red-700 border-red-200";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {score}/{maxScore}
      <span className="opacity-70">({pct}%)</span>
    </span>
  );
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-8">
        Interview will begin shortly...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
      {messages.map((msg, idx) => {
        const isInterviewer = msg.role === "interviewer";
        return (
          <div
            key={idx}
            className={`flex items-start gap-3 ${isInterviewer ? "" : "flex-row-reverse"}`}
          >
            {/* Avatar icon */}
            <div
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${isInterviewer
                  ? "bg-primary-100 text-primary-600"
                  : "bg-cyan-600 text-white"
                }`}
            >
              {isInterviewer ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[75%] ${isInterviewer ? "" : "items-end"} flex flex-col gap-1`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${isInterviewer
                    ? "bg-gray-100 text-gray-800 rounded-tl-sm"
                    : "bg-cyan-600 text-white rounded-tr-sm"
                  }`}
              >
                {msg.content}
              </div>

              {/* Timestamp + mini score */}
              <div className={`flex items-center gap-2 ${isInterviewer ? "" : "flex-row-reverse"}`}>
                {msg.timestamp && (
                  <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                )}
                {!isInterviewer && msg.miniScore && (
                  <ScoreBadge score={msg.miniScore.score} maxScore={msg.miniScore.maxScore} />
                )}
              </div>

              {/* Mini feedback for candidate messages */}
              {!isInterviewer && msg.miniScore?.feedback && (
                <div className="text-xs text-gray-500 italic max-w-xs text-right">
                  {msg.miniScore.feedback.slice(0, 100)}{msg.miniScore.feedback.length > 100 ? "..." : ""}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
