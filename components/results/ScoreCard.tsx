import { Trophy, Star, TrendingUp } from "lucide-react";
import { getAIRSGrade } from "@/lib/scoring/airs";

interface ScoreCardProps {
  totalScore: number;
  maxTotalScore: number;
  airsScore?: number;
  domain?: string;
}

export function ScoreCard({ totalScore, maxTotalScore, airsScore, domain }: ScoreCardProps) {
  const percentage = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
  const airsGrade = airsScore !== undefined ? getAIRSGrade(airsScore) : null;

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "text-green-600";
    if (pct >= 60) return "text-blue-600";
    if (pct >= 40) return "text-yellow-600";
    return "text-red-500";
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return "bg-green-500";
    if (pct >= 60) return "bg-blue-500";
    if (pct >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="card p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Score Summary</h2>
          {domain && (
            <span className="text-sm text-gray-500 capitalize">{domain} Assessment</span>
          )}
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Score */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Score</p>
          <p className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
            {totalScore}
            <span className="text-xl text-gray-400 font-normal">/{maxTotalScore}</span>
          </p>
          <div className="mt-3 bg-gray-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">{percentage}% correct</p>
        </div>

        {/* AIRS Score */}
        {airsGrade && airsScore !== undefined && (
          <div className="text-center border-x border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">AIRS Score</p>
            <p className={`text-4xl font-bold ${airsGrade.color}`}>{airsScore}</p>
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${airsGrade.color} bg-gray-50`}
              >
                <Star className="w-3.5 h-3.5" />
                {airsGrade.grade} — {airsGrade.label}
              </span>
            </div>
          </div>
        )}

        {/* Performance level */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 mb-1">Performance</p>
          <p className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
            {percentage >= 90
              ? "Exceptional"
              : percentage >= 80
              ? "Excellent"
              : percentage >= 70
              ? "Very Good"
              : percentage >= 60
              ? "Good"
              : percentage >= 50
              ? "Average"
              : percentage >= 40
              ? "Below Avg"
              : "Needs Work"}
          </p>
          <div className="mt-3 flex items-center justify-center gap-1 text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">See breakdown below</span>
          </div>
        </div>
      </div>
    </div>
  );
}
