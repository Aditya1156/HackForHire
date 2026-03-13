"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/layout/AuthGuard";
import BrandLoader from "@/components/ui/BrandLoader";
import {
  Users,
  BookOpen,
  FolderOpen,
  FileText,
  Mic,
  TrendingUp,
  BarChart3,
  PieChart,
  Award,
  ChevronRight,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface AdminDashboardData {
  stats: {
    totalUsers: number;
    totalStudents: number;
    totalQuestions: number;
    totalFolders: number;
    totalTests: number;
    totalInterviews: number;
    avgScore: number;
  };
  recentActivity: {
    type: string;
    userName: string;
    userEmail: string;
    domain: string;
    score: number;
    date: string;
  }[];
  domainDistribution: { domain: string; questionCount: number }[];
  scoreDistribution: { grade: string; count: number }[];
  topStudents: {
    id: string;
    name: string;
    email: string;
    avgScore: number;
    testsTaken: number;
  }[];
}

const GRADE_COLORS: Record<string, string> = {
  "A+": "#22c55e",
  A: "#4ade80",
  "B+": "#3b82f6",
  B: "#60a5fa",
  C: "#f59e0b",
  D: "#f97316",
  F: "#ef4444",
};

const DOMAIN_COLORS: Record<string, string> = {
  english: "#3b82f6",
  math: "#22c55e",
  aptitude: "#a855f7",
  coding: "#f97316",
  hr: "#ec4899",
  situational: "#14b8a6",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/admin")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d) => setData(d.data))
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard requiredRole="admin">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="page-header flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm -mt-4">
            Platform overview and analytics
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <BrandLoader fullPage={false} text="Loading dashboard..." />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : data ? (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard
                icon={Users}
                label="Total Users"
                value={data.stats.totalUsers}
                color="bg-blue-100 text-blue-600"
              />
              <StatCard
                icon={Users}
                label="Students"
                value={data.stats.totalStudents}
                color="bg-cyan-100 text-cyan-600"
              />
              <StatCard
                icon={BookOpen}
                label="Questions"
                value={data.stats.totalQuestions}
                color="bg-green-100 text-green-600"
              />
              <StatCard
                icon={FolderOpen}
                label="Folders"
                value={data.stats.totalFolders}
                color="bg-yellow-100 text-yellow-600"
              />
              <StatCard
                icon={FileText}
                label="Tests Taken"
                value={data.stats.totalTests}
                color="bg-purple-100 text-purple-600"
              />
              <StatCard
                icon={TrendingUp}
                label="Avg Score"
                value={`${data.stats.avgScore}%`}
                sub={`${data.stats.totalInterviews} interviews`}
                color="bg-pink-100 text-pink-600"
              />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  href: "/admin/questions",
                  icon: BookOpen,
                  label: "Manage Questions",
                  desc: "Add, edit, delete questions",
                  color: "border-blue-200 hover:border-blue-300",
                  iconColor: "text-blue-600",
                },
                {
                  href: "/admin/folders",
                  icon: FolderOpen,
                  label: "Manage Folders",
                  desc: "Organize question folders",
                  color: "border-green-200 hover:border-green-300",
                  iconColor: "text-green-600",
                },
                {
                  href: "/teacher/dashboard",
                  icon: Award,
                  label: "Teacher Reviews",
                  desc: "Review student submissions",
                  color: "border-purple-200 hover:border-purple-300",
                  iconColor: "text-purple-600",
                },
              ].map((link) => (
                <Link key={link.href} href={link.href}>
                  <div
                    className={`card p-5 flex items-center gap-4 cursor-pointer border-2 ${link.color} transition-all hover:shadow-md group`}
                  >
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <link.icon className={`w-5 h-5 ${link.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{link.label}</div>
                      <div className="text-xs text-gray-400">{link.desc}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Domain Distribution */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                  <h2 className="section-title mb-0">Questions by Domain</h2>
                </div>
                {data.domainDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.domainDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="domain"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="questionCount" radius={[4, 4, 0, 0]} name="Questions">
                        {data.domainDistribution.map((entry) => (
                          <Cell
                            key={entry.domain}
                            fill={DOMAIN_COLORS[entry.domain] || "#0891b2"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">
                    No questions added yet.
                  </div>
                )}
              </div>

              {/* Score Distribution Pie */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <PieChart className="w-5 h-5 text-accent" />
                  <h2 className="section-title mb-0">Score Distribution</h2>
                </div>
                {data.scoreDistribution.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <RechartsPieChart>
                      <Pie
                        data={data.scoreDistribution.filter((d) => d.count > 0)}
                        dataKey="count"
                        nameKey="grade"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ grade, percent }) =>
                          `${grade} ${Math.round((percent || 0) * 100)}%`
                        }
                        labelLine={false}
                      >
                        {data.scoreDistribution
                          .filter((d) => d.count > 0)
                          .map((entry) => (
                            <Cell
                              key={entry.grade}
                              fill={GRADE_COLORS[entry.grade] || "#6b7280"}
                            />
                          ))}
                      </Pie>
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                          <span style={{ fontSize: "12px", color: "#4b5563" }}>{value}</span>
                        )}
                      />
                      <Tooltip
                        formatter={(v: any) => [v, "Tests"]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          fontSize: "12px",
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">
                    No test data yet.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity + Top Students */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Mic className="w-5 h-5 text-primary-600" />
                  <h2 className="section-title mb-0">Recent Activity</h2>
                </div>
                {data.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentActivity.map((activity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            activity.type === "test"
                              ? "bg-blue-100"
                              : "bg-pink-100"
                          }`}
                        >
                          {activity.type === "test" ? (
                            <FileText className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Mic className="w-4 h-4 text-pink-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {activity.userName}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-2">
                            <span className="capitalize">{activity.domain}</span>
                            <span>·</span>
                            <span>{formatDate(activity.date)}</span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-gray-900 flex-shrink-0">
                          {activity.score}
                          <span className="text-xs font-normal text-gray-400">
                            {activity.type === "test" ? "%" : "/100"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    No recent activity.
                  </div>
                )}
              </div>

              {/* Top Students */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <h2 className="section-title mb-0">Top Students</h2>
                </div>
                {data.topStudents.length > 0 ? (
                  <div className="space-y-3">
                    {data.topStudents.map((student, idx) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            idx === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : idx === 1
                              ? "bg-gray-100 text-gray-600"
                              : idx === 2
                              ? "bg-orange-100 text-orange-600"
                              : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {student.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {student.testsTaken} test{student.testsTaken !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div
                          className={`text-lg font-bold flex-shrink-0 ${
                            student.avgScore >= 80
                              ? "text-green-600"
                              : student.avgScore >= 60
                              ? "text-blue-600"
                              : "text-orange-500"
                          }`}
                        >
                          {student.avgScore}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    No student data yet.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AuthGuard>
  );
}
