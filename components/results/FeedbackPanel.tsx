import { CheckCircle, AlertTriangle, ArrowRight, Lightbulb } from "lucide-react";

interface FeedbackPanelProps {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export function FeedbackPanel({ strengths, weaknesses, recommendations }: FeedbackPanelProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-5 h-5 text-primary-600" />
        <h2 className="text-lg font-bold text-gray-900">AI Feedback</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strengths */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold text-green-700">Strengths</h3>
          </div>
          {strengths.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No strengths identified</p>
          ) : (
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Weaknesses */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-amber-700">Areas to Improve</h3>
          </div>
          {weaknesses.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No major weaknesses found</p>
          ) : (
            <ul className="space-y-2">
              {weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recommendations */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-blue-700">Recommendations</h3>
          </div>
          {recommendations.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No recommendations</p>
          ) : (
            <ul className="space-y-2">
              {recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
