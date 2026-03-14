"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/layout/AuthGuard";
import BrandLoader from "@/components/ui/BrandLoader";
import { getAIRSGrade } from "@/lib/scoring/airs";
import {
  FileText,
  Mic,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Calendar,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Clock,
  ArrowUpRight,
  BookOpen,
  Trophy,
  Play,
  ExternalLink,
  GraduationCap,
  Brain,
  Rocket,
  Star,
  Hash,
  Activity,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  mixed: "#8b5cf6",
};

const DOMAIN_GRADIENTS: Record<string, string> = {
  english: "from-blue-500 to-cyan-500",
  math: "from-emerald-500 to-teal-500",
  aptitude: "from-purple-500 to-violet-500",
  coding: "from-orange-500 to-amber-500",
  hr: "from-pink-500 to-rose-500",
  situational: "from-teal-500 to-cyan-500",
  general: "from-indigo-500 to-violet-500",
  communication: "from-cyan-500 to-blue-500",
  mixed: "from-violet-500 to-purple-500",
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

function AnimatedRing({
  pct,
  size = 80,
  strokeWidth = 6,
  color,
}: {
  pct: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-white/10"
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
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-black text-white">{pct}%</span>
      </div>
    </div>
  );
}

function ScoreBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
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
      <div className="min-h-screen bg-[#f8f9fc]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* ══════════ Hero Banner ══════════ */}
          <div className="relative overflow-hidden rounded-3xl">
            {/* Animated mesh gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700" />
            <div className="absolute inset-0 opacity-30">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-400 rounded-full blur-[100px]" />
              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-pink-500 rounded-full blur-[100px]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-400 rounded-full blur-[100px]" />
            </div>
            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            <div className="relative px-8 py-10 sm:px-10 sm:py-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs font-medium text-white/80 border border-white/10">
                      <Calendar className="w-3.5 h-3.5" />
                      {today}
                    </div>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                    {greeting}, {userName}
                  </h1>
                  <p className="text-white/50 text-sm mt-2 max-w-md">
                    Track your progress, challenge yourself, and keep pushing towards excellence.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start">
                  <Link
                    href="/student/interview"
                    className="group flex items-center gap-2.5 px-6 py-3.5 bg-white text-indigo-700 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-900/20 hover:shadow-xl hover:shadow-indigo-900/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Rocket className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
                    Start Practice
                    <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <BrandLoader fullPage={false} text="Loading your dashboard..." />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-5">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* ══════════ Stats Row ══════════ */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Assessments */}
                <div className="group relative bg-white rounded-2xl border border-gray-100 p-6 overflow-hidden hover:shadow-lg hover:shadow-blue-100/50 hover:border-blue-100 transition-all duration-300 cursor-default">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50 group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                        <Hash className="w-3 h-3" />
                        TOTAL
                      </div>
                    </div>
                    <div className="text-4xl font-black text-gray-900 tracking-tighter">{data.stats.totalTests}</div>
                    <div className="text-xs text-gray-400 mt-1 font-medium">Assessments taken</div>
                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                      <BookOpen className="w-3.5 h-3.5" />
                      {data.stats.totalQuestions} questions answered
                    </div>
                  </div>
                </div>

                {/* Average Score */}
                <div className="group relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-6 overflow-hidden hover:shadow-lg hover:shadow-emerald-200/50 transition-all duration-300 cursor-default">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="text-4xl font-black text-white tracking-tighter">
                        {data.stats.avgScore}<span className="text-lg text-white/50">%</span>
                      </div>
                      <div className="text-xs text-white/50 mt-1 font-medium">Average score</div>
                      <div className="mt-4 h-1.5 bg-white/15 rounded-full overflow-hidden w-full">
                        <div
                          className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${data.stats.avgScore}%` }}
                        />
                      </div>
                    </div>
                    <AnimatedRing pct={data.stats.avgScore} size={64} strokeWidth={5} color="#fff" />
                  </div>
                </div>

                {/* Strongest Domain */}
                <div className="group relative bg-white rounded-2xl border border-gray-100 p-6 overflow-hidden hover:shadow-lg hover:shadow-violet-100/50 hover:border-violet-100 transition-all duration-300 cursor-default">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-50 to-transparent rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200/50 group-hover:scale-110 transition-transform">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      </div>
                    </div>
                    <div className="text-xl font-black text-gray-900 capitalize tracking-tight">
                      {data.stats.bestDomain || "\u2014"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 font-medium">Strongest domain</div>
                    {data.stats.bestDomain && (
                      <div className="mt-4 pt-3 border-t border-gray-50">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${DOMAIN_GRADIENTS[data.stats.bestDomain.toLowerCase()] || DOMAIN_GRADIENTS.general}`}>
                          <Brain className="w-3 h-3" />
                          {data.stats.bestDomain}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AIRS Score */}
                <div className="group relative bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-6 overflow-hidden hover:shadow-lg hover:shadow-amber-200/50 transition-all duration-300 cursor-default">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-white/60 bg-white/10 px-2.5 py-1 rounded-full">
                        BEST
                      </div>
                    </div>
                    <div className="text-4xl font-black text-white tracking-tighter">
                      {data.stats.airsBest}<span className="text-lg text-white/40">/100</span>
                    </div>
                    <div className="text-xs text-white/50 mt-1 font-medium">AIRS interview score</div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs text-white/70 font-semibold">
                      <Mic className="w-3.5 h-3.5" />
                      {data.stats.totalInterviews} interviews done
                    </div>
                  </div>
                </div>
              </div>

              {/* ══════════ Quick Actions ══════════ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/student/interview" className="group">
                  <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-violet-100 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-violet-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200/40 group-hover:scale-105 group-hover:rotate-3 transition-all">
                        <Mic className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-base">Mock Interview</h3>
                        <p className="text-gray-400 text-xs mt-0.5">AI-powered interview practice</p>
                      </div>
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-violet-50 transition-colors">
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/student/interview" className="group">
                  <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-cyan-100 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyan-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-200/40 group-hover:scale-105 group-hover:rotate-3 transition-all">
                        <GraduationCap className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-base">Take Assessment</h3>
                        <p className="text-gray-400 text-xs mt-0.5">Domain-based skill evaluation</p>
                      </div>
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-cyan-50 transition-colors">
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* ══════════ Charts ══════════ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Progress Chart */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-gray-150 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">Score Progress</h2>
                        <p className="text-[11px] text-gray-400 font-medium">Performance over time</p>
                      </div>
                    </div>
                    {data.progress.length > 0 && (
                      <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg font-medium">
                        {data.progress.length} tests
                      </div>
                    )}
                  </div>
                  {data.progress.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={[...data.progress].reverse()}>
                        <defs>
                          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "#9ca3af" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) =>
                            new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
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
                          formatter={(v: number) => [`${v}%`, "Score"]}
                          labelFormatter={(l) => formatDate(l)}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                            fontSize: "12px",
                            boxShadow: "0 8px 24px -4px rgb(0 0 0 / 0.08)",
                            padding: "8px 12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="percentage"
                          stroke="#8b5cf6"
                          strokeWidth={2.5}
                          fill="url(#scoreGrad)"
                          dot={{ fill: "#8b5cf6", r: 3.5, strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2, fill: "#fff" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[240px] flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                        <BarChart3 className="w-8 h-8 text-gray-200" />
                      </div>
                      <p className="text-sm text-gray-400 font-medium">No test history yet</p>
                      <Link
                        href="/student/interview"
                        className="text-xs text-violet-600 font-semibold hover:text-violet-700 flex items-center gap-1"
                      >
                        Take your first test <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Domain Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-gray-150 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">Domain Breakdown</h2>
                        <p className="text-[11px] text-gray-400 font-medium">Average score per domain</p>
                      </div>
                    </div>
                  </div>
                  {data.domainStats.length > 0 ? (
                    <div className="space-y-5">
                      {data.domainStats.map((ds) => {
                        const color = DOMAIN_COLORS[ds.domain?.toLowerCase()] || "#6366f1";
                        const grad = DOMAIN_GRADIENTS[ds.domain?.toLowerCase()] || DOMAIN_GRADIENTS.general;
                        return (
                          <div key={ds.domain} className="group">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center`}
                                >
                                  <span className="text-white text-[10px] font-black uppercase">
                                    {ds.domain?.slice(0, 2)}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-700 capitalize">{ds.domain}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] text-gray-400 font-medium">{ds.totalAttempts} attempts</span>
                                <span className="text-sm font-black text-gray-900 min-w-[40px] text-right">{ds.avgScore}%</span>
                              </div>
                            </div>
                            <ScoreBar pct={ds.avgScore} color={color} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-[240px] flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                        <Target className="w-8 h-8 text-gray-200" />
                      </div>
                      <p className="text-sm text-gray-400 font-medium">No domain data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ══════════ Recent Assessments ══════════ */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Recent Assessments</h2>
                      <p className="text-[11px] text-gray-400 font-medium">{data.recentTests.length} most recent</p>
                    </div>
                  </div>
                </div>

                {data.recentTests.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {data.recentTests.map((test, idx) => {
                      const grad = DOMAIN_GRADIENTS[test.domain?.toLowerCase()] || DOMAIN_GRADIENTS.general;
                      const scoreColor =
                        test.percentage >= 80 ? "text-emerald-600" : test.percentage >= 60 ? "text-blue-600" : test.percentage >= 40 ? "text-amber-600" : "text-red-500";
                      const barColor =
                        test.percentage >= 80 ? "#22c55e" : test.percentage >= 60 ? "#3b82f6" : test.percentage >= 40 ? "#f59e0b" : "#ef4444";

                      return (
                        <div
                          key={test.id}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group"
                        >
                          {/* Index */}
                          <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-xs font-black text-gray-300 flex-shrink-0 group-hover:bg-gray-100 transition-colors">
                            {idx + 1}
                          </div>

                          {/* Domain badge */}
                          <div className="flex-1 min-w-0">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r ${grad}`}>
                              {test.domain}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-gray-400 font-medium">
                              <Clock className="w-3 h-3" />
                              {formatRelativeDate(test.date)}
                            </div>
                          </div>

                          {/* Score */}
                          <div className="text-right flex-shrink-0 mr-2">
                            <div className="text-sm font-black text-gray-900">
                              {test.score}<span className="text-gray-300 font-medium text-xs">/{test.maxScore}</span>
                            </div>
                            <div className={`text-xs font-bold ${scoreColor}`}>{test.percentage}%</div>
                          </div>

                          {/* Mini progress bar */}
                          <div className="hidden sm:block w-28 flex-shrink-0">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${test.percentage}%`, background: barColor }}
                              />
                            </div>
                          </div>

                          {/* Action */}
                          <Link
                            href={`/student/test/${test.id}/results`}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 font-semibold transition-colors flex-shrink-0 bg-gray-50 hover:bg-violet-50 px-3 py-2 rounded-lg"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Details</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-semibold">No assessments taken yet</p>
                    <p className="text-xs text-gray-300 mt-1.5">Start your first assessment to see results here.</p>
                    <Link
                      href="/student/interview"
                      className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                      <Play className="w-4 h-4" />
                      Start Assessment
                    </Link>
                  </div>
                )}
              </div>

              {/* ══════════ Recent Interviews ══════════ */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Mic className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Recent Interviews</h2>
                      <p className="text-[11px] text-gray-400 font-medium">AI mock interview results</p>
                    </div>
                  </div>
                  <Link
                    href="/student/interview"
                    className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-bold hover:gap-2 transition-all"
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
                          <div className="w-11 h-11 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            <Mic className="w-5 h-5 text-violet-600" />
                          </div>

                          {/* Role & Date */}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm truncate">{iv.role}</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5 font-medium">
                              <Clock className="w-3 h-3" />
                              {formatRelativeDate(iv.date)}
                            </div>
                          </div>

                          {/* Score & Grade */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-xl font-black text-gray-900 tracking-tight">
                              {iv.airsScore}<span className="text-xs font-medium text-gray-300 ml-0.5">/100</span>
                            </div>
                            <div className="flex items-center gap-1 justify-end mt-0.5">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${grade.color}`}>
                                <Sparkles className="w-3 h-3" />
                                {grade.grade} {grade.label}
                              </span>
                            </div>
                          </div>

                          {/* Action */}
                          <Link
                            href={`/student/interview/${iv.id}/report`}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 font-semibold transition-colors flex-shrink-0 bg-gray-50 hover:bg-violet-50 px-3 py-2 rounded-lg"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Report</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Mic className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-semibold">No interviews completed yet</p>
                    <p className="text-xs text-gray-300 mt-1.5">Practice with our AI interviewer to get started.</p>
                    <Link
                      href="/student/interview"
                      className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                      <Mic className="w-4 h-4" />
                      Start Interview
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </AuthGuard>
  );
}
