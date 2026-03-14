import { memo } from "react";
import { KaTeXRenderer } from "@/components/shared/KaTeXRenderer";
import { toDirectUrl } from "@/lib/utils/url";

export interface QuestionData {
  _id: string;
  domain: string;
  type: string;
  difficulty: "easy" | "medium" | "hard";
  content: {
    text: string;
    formula?: string;
    imageUrl?: string;
    audioUrl?: string;
    instructions?: string;
    options?: { label: string; text: string; isCorrect: boolean }[];
    blanks?: { id: number }[];
  };
  answerFormat?: string;
  rubric: { maxScore: number };
}

interface QuestionCardProps {
  question: QuestionData;
  index: number;
  total: number;
}

const domainColors: Record<string, string> = {
  english: "badge-english",
  math: "badge-math",
  aptitude: "badge-aptitude",
  coding: "badge-coding",
  hr: "badge-hr",
  situational: "bg-teal-100 text-teal-800",
  general: "bg-slate-100 text-slate-800",
  communication: "bg-indigo-100 text-indigo-800",
};

const difficultyColors: Record<string, string> = {
  easy: "badge-easy",
  medium: "badge-medium",
  hard: "badge-hard",
};

export const QuestionCard = memo(function QuestionCard({ question, index, total }: QuestionCardProps) {
  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-500">
            Question {index + 1} of {total}
          </span>
          <span className={`badge ${domainColors[question.domain] ?? "bg-gray-100 text-gray-700"}`}>
            {question.domain}
          </span>
          <span className={`badge ${difficultyColors[question.difficulty] ?? "badge-medium"}`}>
            {question.difficulty}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
          {question.rubric.maxScore} pts
        </span>
      </div>

      {/* Question Text */}
      {question.content.blanks && question.content.blanks.length > 0 ? (
        <div className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
          {question.content.text.split(/(\{\{\d+\}\})/).map((part, i) => {
            const match = part.match(/\{\{(\d+)\}\}/);
            if (match) {
              return (
                <span key={i} className="inline-flex items-center mx-1 px-3 py-0.5 bg-cyan-50 border border-cyan-200 rounded-lg text-cyan-600 font-semibold text-sm">
                  #{match[1]} ________
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      ) : (
        <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
          {question.content.text}
        </p>
      )}

      {/* Formula */}
      {question.content.formula && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Formula</p>
          <KaTeXRenderer formula={question.content.formula} displayMode />
        </div>
      )}

      {/* Image */}
      {question.content.imageUrl && (
        <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
          <img
            src={toDirectUrl(question.content.imageUrl)}
            alt="Question illustration"
            className="w-full max-h-64 object-contain bg-white"
            loading="lazy"
          />
        </div>
      )}

      {/* Audio */}
      {question.content.audioUrl && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Audio</p>
          <audio controls className="w-full" src={toDirectUrl(question.content.audioUrl)}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Instructions */}
      {question.content.instructions && (
        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-600 font-medium mb-1 uppercase tracking-wide">Instructions</p>
          <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
            {question.content.instructions}
          </p>
        </div>
      )}

      {/* Blanks indicator */}
      {question.content.blanks && question.content.blanks.length > 0 && (
        <div className="mt-4 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
          <p className="text-xs text-cyan-600 font-medium">
            Fill in {question.content.blanks.length} blank{question.content.blanks.length !== 1 ? "s" : ""} below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.
          </p>
        </div>
      )}
    </div>
  );
});
