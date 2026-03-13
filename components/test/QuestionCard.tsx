import { KaTeXRenderer } from "@/components/shared/KaTeXRenderer";
import Image from "next/image";

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
  };
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
};

const difficultyColors: Record<string, string> = {
  easy: "badge-easy",
  medium: "badge-medium",
  hard: "badge-hard",
};

export function QuestionCard({ question, index, total }: QuestionCardProps) {
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
      <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
        {question.content.text}
      </p>

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
            src={question.content.imageUrl}
            alt="Question illustration"
            className="w-full max-h-64 object-contain bg-white"
          />
        </div>
      )}
    </div>
  );
}
