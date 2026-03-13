"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/layout/AuthGuard";
import BrandLoader from "@/components/ui/BrandLoader";
import { getAIRSGrade } from "@/lib/scoring/airs";
import {
  LayoutDashboard,
  FileText,
  Mic,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
  Sparkles,
  Clock,
  ArrowUpRight,
  Zap,
  BookOpen,
  Trophy,
  Flame,
  Play,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Area,
  AreaChart,
} from "recharts";

interface DashboardData {
  recentTests: {
    id: string;
    domain: string;
    score: number;
    maxScore: number;
    percentage: number;
    date: string;
    airsScore: number | null;
  }[];
  recentInterviews: {
    id: string;
    role: string;
    airsScore: number;
    date: string;
  }[];
  stats: {
    totalTests: number;
    totalInterviews: number;
    avgScore: number;
    bestDomain: string;
    airsBest: number;
    totalQuestions: number;
  };
  progress: { date: string; percentage: number }[];
  domainStats: { domain: string; avgScore: number; totalAttempts: number }[];
}

const DOMAIN_COLORS: Record<string, string> = {
  english: "#3b82f6",
  math: "#22c55e",
  aptitude: "#a855f7",
  coding: "#f97316",
  hr: "#ec4899",
  situational: "#14b8a6",
  general: "#6366f1",
  communication: "#0891b2",
  Mixed: "#0891b2",
};

const DOMAIN_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  english: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "bg-blue-100" },
  math: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "bg-emerald-100" },
  aptitude: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: "bg-purple-100" },
  coding: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: "bg-orange-100" },
  hr: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", icon: "bg-pink-100" },
  situational: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", icon: "bg-teal-100" },
  general: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", icon: "bg-indigo-100" },
  communication: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", icon: "bg-cyan-100" },
};

function formatDate(dateStr: string) {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeDate(dateStr: string) {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateStr);
}

function ScoreRing({ pct, size = 56, strokeWidth = 5 }: { pct: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    pct >= 80 ? "#22c55e" : pct >= 60 ? "#3b82f6" : pct >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-900">{pct}%</span>
      </div>
    </div>
  );
}

function DomainBadge({ domain }: { domain: string }) {
  const config = DOMAIN_CONFIG[domain?.toLowerCase()] || DOMAIN_CONFIG.general;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${config.bg} ${config.text} ${config.border} border`}>
      {domain}
    </span>
  );
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.user?.name) setUserName(d.data.user.name.split(" ")[0]);
      })
      .catch(() => {});

    fetch("/api/dashboard/student")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((d) => setData(d.data))
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <AuthGuard requiredRole="student">
      <div className="space-y-6">
        {/* ========== Welcome Header ========== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-violet-300 text-sm font-medium flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                {today}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {greeting}, {userName}
              </h1>
              <p className="text-white/50 text-sm mt-1.5">
                Track your progress and keep improving.
              </p>
            </div>
            <Link
              href="/student/interview"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] self-start"
            >
              <Play className="w-4 h-4 text-violet-300" />
              Start Practice
              <ArrowUpRight className="w-4 h-4 opacity-50" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <BrandLoader fullPage={false} text="Loading your dashboard..." />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : data ? (
          <>
            {/* ========== Stats Cards ========== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Assessments */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">Total</span>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{data.stats.totalTests}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Assessments taken
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                  <BookOpen className="w-3 h-3" />
                  {data.stats.totalQuestions} questions answered
                </div>
              </div>

              {/* Average Score */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <ScoreRing pct={data.stats.avgScore} size={44} strokeWidth={4} />
                </div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{data.stats.avgScore}%</div>
                <div className="text-xs text-gray-400 mt-1">
                  Average score
                </div>
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      data.stats.avgScore >= 80 ? "bg-emerald-500" : data.stats.avgScore >= 60 ? "bg-blue-500" : data.stats.avgScore >= 40 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${data.stats.avgScore}%` }}
                  />
                </div>
              </div>

              {/* Best Domain */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Trophy className="w-5 h-5 text-violet-600" />
                  </div>
                  <Flame className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-xl font-extrabold text-gray-900 capitalize tracking-tight">
                  {data.stats.bestDomain || "\u2014"}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Strongest domain
                </div>
                {data.stats.bestDomain && (
                  <div className="mt-3">
                    <DomainBadge domain={data.stats.bestDomain} />
                  </div>
                )}
              </div>

              {/* AIRS Score */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">Best</span>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {data.stats.airsBest}
                  <span className="text-base font-normal text-gray-300 ml-0.5">/100</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  AIRS interview score
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                  <Mic className="w-3 h-3" />
                  {data.stats.totalInterviews} interviews done
                </div>
              </div>
            </div>

            {/* ========== Quick Actions ========== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/student/interview" className="group">
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white hover:shadow-lg hover:shadow-violet-200 transition-all hover:scale-[1.01] active:scale-[0.99]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mic className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">Mock Interview</h3>
                      <p className="text-white/60 text-sm">AI-powered interview practice</p>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-40 group-hover:translate-x-1 group-hover:opacity-80 transition-all" />
                  </div>
                </div>
              </Link>

              <Link href="/student/interview" className="group">
                <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl p-6 text-white hover:shadow-lg hover:shadow-cyan-200 transition-all hover:scale-[1.01] active:scale-[0.99]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">Take Assessment</h3>
                      <p className="text-white/60 text-sm">Domain-based skill evaluation</p>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-40 group-hover:translate-x-1 group-hover:opacity-80 transition-all" />
                  </div>
                </div>
              </Link>
            </div>

            {/* ========== Charts Row ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progress Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Score Progress</h2>
                      <p className="text-xs text-gray-400">Your performance over time</p>
                    </div>
                  </div>
                </div>
                {data.progress.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={[...data.progress].reverse()}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          new Date(v).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        }
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        formatter={(v: any) => [`${v}%`, "Score"]}
                        labelFormatter={(l) => formatDate(l)}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e5e7eb",
                          fontSize: "12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="percentage"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fill="url(#scoreGradient)"
                        dot={{ fill: "#8b5cf6", r: 3, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2, fill: "#fff" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex flex-col items-center justify-center text-gray-400 gap-2">
                    <BarChart3 className="w-8 h-8 text-gray-200" />
                    <p className="text-sm">No test history yet</p>
                    <Link href="/student/interview" className="text-xs text-violet-600 font-medium hover:underline">
                      Take your first test
                    </Link>
                  </div>
                )}
              </div>

              {/* Domain Breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Domain Breakdown</h2>
                      <p className="text-xs text-gray-400">Average score per domain</p>
                    </div>
                  </div>
                </div>
                {data.domainStats.length > 0 ? (
                  <div className="space-y-4">
                    {data.domainStats.map((ds) => {
                      const color = DOMAIN_COLORS[ds.domain?.toLowerCase()] || "#6366f1";
                      return (
                        <div key={ds.domain} className="group">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-sm font-medium text-gray-700 capitalize">{ds.domain}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{ds.totalAttempts} attempts</span>
                              <span className="text-sm font-bold text-gray-900">{ds.avgScore}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-80"
                              style={{ width: `${ds.avgScore}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[220px] flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Target className="w-8 h-8 text-gray-200" />
                    <p className="text-sm">No domain data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* ========== Recent Assessments ========== */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Recent Assessments</h2>
                    <p className="text-xs text-gray-400">{data.recentTests.length} most recent</p>
                  </div>
                </div>
                <Link
                  href="/student/interview"
                  className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 hover:gap-1.5 transition-all"
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data.recentTests.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {data.recentTests.map((test, idx) => (
                    <div
                      key={test.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group"
                    >
                      {/* Index */}
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                        {idx + 1}
                      </div>

                      {/* Domain & Date */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <DomainBadge domain={test.domain} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatRelativeDate(test.date)}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-gray-900">
                          {test.score}<span className="text-gray-300 font-normal">/{test.maxScore}</span>
                        </div>
                        <div className={`text-xs font-semibold ${
                          test.percentage >= 80 ? "text-emerald-600" : test.percentage >= 60 ? "text-blue-600" : test.percentage >= 40 ? "text-amber-600" : "text-red-600"
                        }`}>
                          {test.percentage}%
                        </div>
                      </div>

                      {/* Progress bar mini */}
                      <div className="hidden sm:block w-24 flex-shrink-0">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              test.percentage >= 80 ? "bg-emerald-500" : test.percentage >= 60 ? "bg-blue-500" : test.percentage >= 40 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${test.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Action */}
                      <Link
                        href={`/student/test/${test.id}/results`}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 font-medium transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Details</span>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-14 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-7 h-7 text-gray-200" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">No assessments taken yet</p>
                  <p className="text-xs text-gray-300 mt-1">Start your first assessment to see results here.</p>
                  <Link href="/student/interview" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors">
                    <Play className="w-3.5 h-3.5" />
                    Start Assessment
                  </Link>
                </div>
              )}
            </div>

            {/* ========== Recent Interviews ========== */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                    <Mic className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Recent Interviews</h2>
                    <p className="text-xs text-gray-400">AI mock interview results</p>
                  </div>
                </div>
                <Link
                  href="/student/interview"
                  className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 hover:gap-1.5 transition-all"
                >
                  New interview <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data.recentInterviews.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {data.recentInterviews.map((iv) => {
                    const grade = getAIRSGrade(iv.airsScore);
                    return (
                      <div
                        key={iv.id}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group"
                      >
                        {/* Icon */}
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Mic className="w-5 h-5 text-violet-600" />
                        </div>

                        {/* Role & Date */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm truncate">
                            {iv.role}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatRelativeDate(iv.date)}
                          </div>
                        </div>

                        {/* Score & Grade */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-extrabold text-gray-900 tracking-tight">
                            {iv.airsScore}
                            <span className="text-xs font-normal text-gray-300 ml-0.5">/100</span>
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold ${grade.color}`}>
                              <Sparkles className="w-3 h-3" />
                              {grade.grade} {grade.label}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        <Link
                          href={`/student/interview/${iv.id}/report`}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 font-medium transition-colors flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Report</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-14 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Mic className="w-7 h-7 text-gray-200" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">No interviews completed yet</p>
                  <p className="text-xs text-gray-300 mt-1">Practice with our AI interviewer to get started.</p>
                  <Link href="/student/interview" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors">
                    <Mic className="w-3.5 h-3.5" />
                    Start Interview
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AuthGuard>
  );
}
