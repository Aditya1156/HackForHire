"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Bot,
  User,
  Download,
  RefreshCw,
  LayoutDashboard,
  Star,
  TrendingUp,
  Award,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getAIRSGrade } from "@/lib/scoring/airs";

interface AIRSBreakdown {
  resumeStrength: { score: number; max: number };
  communication: { score: number; max: number };
  technicalKnowledge: { score: number; max: number };
  codingAbility: { score: number; max: number };
  problemSolving: { score: number; max: number };
  professionalTone: { score: number; max: number };
  total: number;
}

interface ReportData {
  role: string;
  status: string;
  airsScore: {
    resumeStrength: number;
    communication: number;
    technicalKnowledge: number;
    codingAbility: number;
    problemSolving: number;
    professionalTone: number;
    total: number;
  };
  conversationHistory: { role: string; content: string; timestamp: string }[];
  resumeContext: { name: string; skills: string[]; domain: string };
  analysis: {
    strengths: string[];
    weaknesses: string[];
    overallSummary: string;
    rawScores: {
      resumeScore: number;
      communicationScore: number;
      technicalScore: number;
      codingScore: number;
      problemSolvingScore: number;
      toneScore: number;
    };
  };
  duration: number;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const gradeInfo = getAIRSGrade(score);

  const ringColor =
    score >= 80 ? "#22c55e"
    : score >= 70 ? "#0891b2"
    : score >= 60 ? "#3b82f6"
    : score >= 50 ? "#f59e0b"
    : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={12}
          />
          {/* Filled arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - filled}
            style={{ transition: "stroke-dashoffset 1.5s ease-in-out" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-gray-900">{score}</span>
          <span className="text-xs text-gray-500 font-medium">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <span
          className={`text-2xl font-bold ${gradeInfo.color}`}
        >
          {gradeInfo.grade}
        </span>
        <p className="text-sm text-gray-600 font-medium">{gradeInfo.label}</p>
      </div>
    </div>
  );
}

function DimensionCard({
  label,
  score,
  max,
  comment,
  icon: Icon,
  colorClass,
}: {
  label: string;
  score: number;
  max: number;
  comment?: string;
  icon: any;
  colorClass: string;
}) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-gray-800">{label}</span>
        </div>
        <span className="text-lg font-bold text-gray-900">
          {score}<span className="text-xs text-gray-400 font-normal">/{max}</span>
        </span>
      </div>
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            pct >= 80 ? "bg-green-500"
            : pct >= 60 ? "bg-primary-500"
            : pct >= 40 ? "bg-yellow-500"
            : "bg-red-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {comment && <p className="text-xs text-gray-500 italic">{comment}</p>}
    </div>
  );
}

const DIMENSION_META = [
  { key: "resumeStrength", label: "Resume Strength", max: 20, icon: Award, colorClass: "bg-blue-100 text-blue-600" },
  { key: "communication", label: "Communication", max: 20, icon: Star, colorClass: "bg-pink-100 text-pink-600" },
  { key: "technicalKnowledge", label: "Technical Knowledge", max: 25, icon: TrendingUp, colorClass: "bg-purple-100 text-purple-600" },
  { key: "codingAbility", label: "Coding Ability", max: 20, icon: Bot, colorClass: "bg-orange-100 text-orange-600" },
  { key: "problemSolving", label: "Problem Solving", max: 10, icon: RefreshCw, colorClass: "bg-green-100 text-green-600" },
  { key: "professionalTone", label: "Professional Tone", max: 5, icon: CheckCircle2, colorClass: "bg-teal-100 text-teal-600" },
] as const;

const DIMENSION_COMMENTS: Record<string, (pct: number) => string> = {
  resumeStrength: (p) => p >= 75 ? "Strong background well-matched to the role." : "Some gaps between background and role requirements.",
  communication: (p) => p >= 75 ? "Clear, structured, and professional communication." : "Communication could be more structured and confident.",
  technicalKnowledge: (p) => p >= 75 ? "Solid technical depth demonstrated." : "Technical depth needs further development.",
  codingAbility: (p) => p >= 75 ? "Good coding skills demonstrated." : "Coding practice recommended.",
  problemSolving: (p) => p >= 75 ? "Strong analytical and problem-solving approach." : "Work on breaking down complex problems methodically.",
  professionalTone: (p) => p >= 75 ? "Consistently professional demeanor." : "Maintain professional tone throughout.",
};

export default function InterviewReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/interviews/${id}/report`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error ?? "Failed to load report");
        setReport(data.data.interview);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-navy to-primary-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold text-lg">Generating your AIRS Report...</p>
          <p className="text-primary-300 text-sm mt-1">Analyzing your interview performance</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card p-8 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold mb-2">Failed to load report</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const total = report.airsScore?.total ?? 0;
  const gradeInfo = getAIRSGrade(total);
  const rawScores = report.analysis?.rawScores ?? {};

  // Radar chart data
  const radarData = [
    { subject: "Resume", score: rawScores.resumeScore ?? 0, fullMark: 100 },
    { subject: "Communication", score: rawScores.communicationScore ?? 0, fullMark: 100 },
    { subject: "Technical", score: rawScores.technicalScore ?? 0, fullMark: 100 },
    { subject: "Coding", score: rawScores.codingScore ?? 0, fullMark: 100 },
    { subject: "Problem Solving", score: rawScores.problemSolvingScore ?? 0, fullMark: 100 },
    { subject: "Tone", score: rawScores.toneScore ?? 0, fullMark: 100 },
  ];

  const candidateMessages = report.conversationHistory.filter((m) => m.role === "candidate");
  const totalExchanges = candidateMessages.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-primary-950 via-navy to-primary-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Top meta */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-primary-300 text-sm font-medium uppercase tracking-wider mb-1">
                AIRS Report
              </p>
              <h1 className="text-2xl font-bold text-white">{report.role}</h1>
              <p className="text-primary-400 text-sm mt-1">
                {totalExchanges} responses &bull; {formatDuration(report.duration)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => router.push("/student/interview")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                New Interview
              </button>
            </div>
          </div>

          {/* Score hero card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ScoreRing score={total} size={180} />
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-3">
                  <span className={`text-2xl font-black ${gradeInfo.color}`}>{gradeInfo.grade}</span>
                  <span className="text-white font-semibold">{gradeInfo.label}</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-2">AIRS Score: {total}/100</h2>
                <p className="text-primary-200 text-sm leading-relaxed max-w-md">
                  {report.analysis?.overallSummary || "Interview analysis complete."}
                </p>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: "Questions", value: totalExchanges },
                    { label: "Duration", value: formatDuration(report.duration) },
                    { label: "Grade", value: gradeInfo.grade },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-white font-bold text-lg">{stat.value}</p>
                      <p className="text-primary-300 text-xs">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* 6-Dimension Breakdown */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DIMENSION_META.map((dim) => {
              const score = (report.airsScore as any)[dim.key] ?? 0;
              const pct = dim.max > 0 ? Math.round((score / dim.max) * 100) : 0;
              return (
                <DimensionCard
                  key={dim.key}
                  label={dim.label}
                  score={score}
                  max={dim.max}
                  icon={dim.icon}
                  colorClass={dim.colorClass}
                  comment={DIMENSION_COMMENTS[dim.key]?.(pct)}
                />
              );
            })}
          </div>
        </section>

        {/* Radar Chart */}
        <section>
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Performance Radar</h2>
            <p className="text-sm text-gray-500 mb-4">Visual breakdown of all six AIRS dimensions</p>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#0891b2"
                  fill="#0891b2"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}/100`, "Score"]}
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#f9fafb",
                    fontSize: "12px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* AI Assessment — Strengths & Weaknesses */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">AI Assessment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {(report.analysis?.strengths ?? []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                    {s}
                  </li>
                ))}
                {!report.analysis?.strengths?.length && (
                  <li className="text-sm text-gray-400 italic">No strengths data available.</li>
                )}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="font-semibold text-gray-900">Areas for Improvement</h3>
              </div>
              <ul className="space-y-2">
                {(report.analysis?.weaknesses ?? []).map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                    {w}
                  </li>
                ))}
                {!report.analysis?.weaknesses?.length && (
                  <li className="text-sm text-gray-400 italic">No improvement areas identified.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Overall Summary */}
          {report.analysis?.overallSummary && (
            <div className="card p-5 mt-4 bg-primary-50 border-primary-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Overall Assessment</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{report.analysis.overallSummary}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Conversation Replay */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Conversation Replay</h2>
          <div className="card divide-y divide-gray-100">
            {report.conversationHistory.map((msg, idx) => {
              const isInterviewer = msg.role === "interviewer";
              return (
                <div key={idx} className={`p-4 flex items-start gap-3 ${isInterviewer ? "" : "flex-row-reverse bg-gray-50"}`}>
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                      ${isInterviewer ? "bg-primary-100 text-primary-600" : "bg-cyan-600 text-white"}`}
                  >
                    {isInterviewer ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className={`flex-1 ${isInterviewer ? "" : "text-right"}`}>
                    <p className="text-xs text-gray-400 font-medium mb-1">
                      {isInterviewer ? "AI Interviewer" : "You"}
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Action buttons */}
        <section className="flex flex-col sm:flex-row gap-3 pb-8">
          <button
            onClick={() => router.push("/student/interview")}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Take Another Interview
          </button>
          <button
            onClick={() => router.push("/student/dashboard")}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </button>
          <button
            onClick={() => window.print()}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </section>
      </div>
    </div>
  );
}
