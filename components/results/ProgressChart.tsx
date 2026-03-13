"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DomainScore {
  domain: string;
  score: number;
  maxScore: number;
}

interface ProgressChartProps {
  scores: DomainScore[];
}

const DOMAIN_COLORS: Record<string, string> = {
  english: "#3b82f6",
  math: "#22c55e",
  aptitude: "#a855f7",
  coding: "#f97316",
  hr: "#ec4899",
  situational: "#14b8a6",
  general: "#6366f1",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const pct = d.maxScore > 0 ? Math.round((d.score / d.maxScore) * 100) : 0;
    return (
      <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-sm shadow-lg">
        <p className="font-semibold capitalize">{d.domain}</p>
        <p>
          {d.score}/{d.maxScore} pts ({pct}%)
        </p>
      </div>
    );
  }
  return null;
};

export function ProgressChart({ scores }: ProgressChartProps) {
  if (!scores || scores.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Domain Breakdown</h2>
        <p className="text-gray-400 text-sm text-center py-8">No domain scores available</p>
      </div>
    );
  }

  const data = scores.map((s) => ({
    domain: s.domain,
    score: s.score,
    maxScore: s.maxScore,
    percentage: s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0,
  }));

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Domain Breakdown</h2>

      {/* Score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {scores.map((s) => {
          const pct = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;
          const color = DOMAIN_COLORS[s.domain] ?? "#6366f1";
          return (
            <div key={s.domain} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs font-medium text-gray-500 capitalize mb-1">{s.domain}</p>
              <p className="text-lg font-bold" style={{ color }}>
                {s.score}/{s.maxScore}
              </p>
              <div className="mt-1.5 bg-gray-200 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{pct}%</p>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="domain"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={DOMAIN_COLORS[entry.domain] ?? "#6366f1"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
