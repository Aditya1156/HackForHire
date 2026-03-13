"use client";

import { CheckCircle, Circle } from "lucide-react";

interface QuestionNavProps {
  total: number;
  current: number; // 0-indexed
  answered: boolean[]; // length = total
  onJump: (index: number) => void;
}

export function QuestionNav({ total, current, answered, onJump }: QuestionNavProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === current;
        const isAnswered = answered[i];
        return (
          <button
            key={i}
            onClick={() => onJump(i)}
            title={`Question ${i + 1}${isAnswered ? " (answered)" : ""}`}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-150 border-2
              ${isCurrent
                ? "bg-primary-600 text-white border-primary-700 shadow-md scale-110"
                : isAnswered
                ? "bg-green-100 text-green-700 border-green-300 hover:border-green-500"
                : "bg-gray-100 text-gray-500 border-gray-200 hover:border-gray-400 hover:bg-gray-200"
              }`}
          >
            {i + 1}
          </button>
        );
      })}

      {/* Legend */}
      <div className="w-full flex gap-4 text-xs text-gray-500 mt-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-primary-600 inline-block" /> Current
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-200 inline-block" /> Answered
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Unanswered
        </span>
      </div>
    </div>
  );
}
