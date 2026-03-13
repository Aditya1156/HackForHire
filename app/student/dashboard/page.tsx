"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/layout/AuthGuard";
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
  Mixed: "#0891b2",
};

const DOMAIN_BADGE: Record<string, string> = {
  english: "badge-english",
  math: "badge-math",
  aptitude: "badge-aptitude",
  coding: "badge-coding",
  hr: "badge-hr",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ScoreBar({ pct }: { pct: number }) {
  const color =
    pct >= 80
      ? "bg-green-500"
      : pct >= 60
      ? "bg-blue-500"
      : pct >= 40
      ? "bg-yellow-500"
      : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    // Get user name
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.user?.name) setUserName(d.data.user.name.split(" ")[0]);
      })
      .catch(() => {});

    // Get dashboard data
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

  return (
    <AuthGuard requiredRole="student">
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LayoutDashboard className="w-5 h-5 opacity-80" />
                <span className="text-sm font-medium opacity-80">Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Welcome back, {userName}! 👋
              </h1>
              <p className="text-white/70 text-sm mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {today}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                Student
              </span>
              <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs px-3 py-1.5 rounded-full">
                Vulcan Prep 360
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : data ? (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Tests Taken</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{data.stats.totalTests}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {data.stats.totalQuestions} questions answered
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Avg Score</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{data.stats.avgScore}%</div>
                <div className="mt-2">
                  <ScoreBar pct={data.stats.avgScore} />
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Best Domain</span>
                </div>
                <div className="text-xl font-bold text-gray-900 capitalize">
                  {data.stats.bestDomain}
                </div>
                <span
                  className={`badge ${
                    DOMAIN_BADGE[data.stats.bestDomain?.toLowerCase()] || "bg-gray-100 text-gray-700"
                  } mt-2`}
                >
                  Top performer
                </span>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-pink-600" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">AIRS Best</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{data.stats.airsBest}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {data.stats.totalInterviews} interviews
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/student/test">
                <div className="card-hover p-6 bg-gradient-to-br from-cyan-500 to-blue-600 text-white cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Start a Test</h3>
                      <p className="text-white/70 text-sm mt-0.5">
                        English, Math, Aptitude, Coding, HR
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              <Link href="/student/interview">
                <div className="card-hover p-6 bg-gradient-to-br from-blue-500 to-blue-700 text-white cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mic className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Mock Interview</h3>
                      <p className="text-white/70 text-sm mt-0.5">
                        AI-powered, resume-personalized
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>

            {/* Progress Chart + Domain Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progress Chart */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                  <h2 className="section-title mb-0">Score Progress</h2>
                </div>
                {data.progress.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={[...data.progress].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
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
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        formatter={(v: any) => [`${v}%`, "Score"]}
                        labelFormatter={(l) => formatDate(l)}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="percentage"
                        stroke="#0891b2"
                        strokeWidth={2}
                        dot={{ fill: "#0891b2", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                    No test history yet. Take your first test!
                  </div>
                )}
              </div>

              {/* Domain Breakdown */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Target className="w-5 h-5 text-accent" />
                  <h2 className="section-title mb-0">Domain Breakdown</h2>
                </div>
                {data.domainStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.domainStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <YAxis
                        dataKey="domain"
                        type="category"
                        tick={{ fontSize: 12, fill: "#4b5563" }}
                        width={72}
                      />
                      <Tooltip
                        formatter={(v: any) => [`${v}%`, "Avg Score"]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                        {data.domainStats.map((entry) => (
                          <Cell
                            key={entry.domain}
                            fill={
                              DOMAIN_COLORS[entry.domain?.toLowerCase()] ||
                              DOMAIN_COLORS["Mixed"]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                    No domain data yet.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Tests */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <h2 className="section-title mb-0">Recent Tests</h2>
                </div>
                <Link
                  href="/student/test"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {data.recentTests.length > 0 ? (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full min-w-[560px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3">
                          Domain
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3">
                          Score
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 hidden sm:table-cell">
                          Percentage
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 hidden sm:table-cell">
                          Date
                        </th>
                        <th className="pb-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.recentTests.map((test) => (
                        <tr key={test.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 pr-4">
                            <span
                              className={`badge ${
                                DOMAIN_BADGE[test.domain?.toLowerCase()] ||
                                "bg-gray-100 text-gray-700"
                              } capitalize`}
                            >
                              {test.domain}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-sm font-semibold text-gray-900">
                            {test.score}/{test.maxScore}
                          </td>
                          <td className="py-3 pr-4 hidden sm:table-cell w-40">
                            <ScoreBar pct={test.percentage} />
                          </td>
                          <td className="py-3 pr-4 text-sm text-gray-500 hidden sm:table-cell">
                            {formatDate(test.date)}
                          </td>
                          <td className="py-3 text-right">
                            <Link
                              href={`/student/test?view=${test.id}`}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                            >
                              View
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No tests taken yet.</p>
                  <Link href="/student/test" className="btn-primary btn-sm mt-4 inline-flex">
                    Start your first test
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Interviews */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-accent" />
                  <h2 className="section-title mb-0">Recent Interviews</h2>
                </div>
                <Link
                  href="/student/interview"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  New interview <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {data.recentInterviews.length > 0 ? (
                <div className="space-y-3">
                  {data.recentInterviews.map((iv) => {
                    const grade = getAIRSGrade(iv.airsScore);
                    return (
                      <div
                        key={iv.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all"
                      >
                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Mic className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">
                            {iv.role}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {formatDate(iv.date)}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-gray-900">
                            {iv.airsScore}
                            <span className="text-xs font-normal text-gray-400">/100</span>
                          </div>
                          <span className={`text-xs font-bold ${grade.color}`}>
                            {grade.grade} — {grade.label}
                          </span>
                        </div>
                        <Link
                          href={`/student/interview?view=${iv.id}`}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex-shrink-0"
                        >
                          Report
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <Mic className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No interviews completed yet.</p>
                  <Link href="/student/interview" className="btn-accent btn-sm mt-4 inline-flex">
                    Start a mock interview
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
