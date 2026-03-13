"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  CheckCircle2,
  BarChart2,
  Clock,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface TestRow {
  _id: string;
  student: { _id: string; name: string; email: string };
  domain: string;
  mode: string;
  status: "completed" | "reviewed";
  totalScore: number;
  maxTotalScore: number;
  percentage: number;
  airsScore?: number;
  questionCount: number;
  completedAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface DashboardStats {
  pendingReview: number;
  totalReviewed: number;
  averageScore: number;
}

const DOMAIN_COLORS: Record<string, string> = {
  english: "badge-english",
  math: "badge-math",
  aptitude: "badge-aptitude",
  coding: "badge-coding",
  hr: "badge-hr",
};

function ScorePill({ percentage }: { percentage: number }) {
  const color =
    percentage >= 80
      ? "bg-green-100 text-green-800"
      : percentage >= 60
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {percentage}%
    </span>
  );
}

export default function TeacherDashboardPage() {
  const [tests, setTests] = useState<TestRow[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "completed" | "reviewed">("");
  const [domainFilter, setDomainFilter] = useState("");
  const [page, setPage] = useState(1);

  async function fetchTests() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (domainFilter) params.set("domain", domainFilter);

      const res = await fetch(`/api/teacher/tests?${params}`);
      if (!res.ok) throw new Error("Failed to load tests");
      const json = await res.json();
      const data: TestRow[] = json.data.tests;
      const pag: PaginationInfo = json.data.pagination;

      setTests(data);
      setPagination(pag);

      // Compute dashboard stats from the full page
      const pending = data.filter((t) => t.status === "completed").length;
      const reviewed = data.filter((t) => t.status === "reviewed").length;
      const avgScore =
        data.length > 0
          ? Math.round(data.reduce((sum, t) => sum + t.percentage, 0) / data.length)
          : 0;
      setStats({
        pendingReview: pag.total - reviewed, // approximate across all pages
        totalReviewed: reviewed,
        averageScore: avgScore,
      });
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, domainFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-500 mt-1">Review and grade completed student assessments</p>
          </div>
          <button
            onClick={fetchTests}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card p-5 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock size={22} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats ? stats.pendingReview : "—"}
              </p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 size={22} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Reviewed (this page)</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats ? stats.totalReviewed : "—"}
              </p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <BarChart2 size={22} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Score (this page)</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats ? `${stats.averageScore}%` : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "" | "completed" | "reviewed");
                setPage(1);
              }}
              className="input-field w-auto py-1.5 text-sm"
            >
              <option value="">All</option>
              <option value="completed">Pending Review</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Domain:</label>
            <select
              value={domainFilter}
              onChange={(e) => {
                setDomainFilter(e.target.value);
                setPage(1);
              }}
              className="input-field w-auto py-1.5 text-sm"
            >
              <option value="">All Domains</option>
              <option value="english">English</option>
              <option value="math">Math</option>
              <option value="aptitude">Aptitude</option>
              <option value="coding">Coding</option>
              <option value="hr">HR</option>
              <option value="situational">Situational</option>
            </select>
          </div>
          {pagination && (
            <p className="text-sm text-gray-500 ml-auto">
              {pagination.total} total test{pagination.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Tests Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center gap-3 text-gray-500">
              <RefreshCw size={32} className="animate-spin text-primary-500" />
              <span>Loading tests…</span>
            </div>
          ) : tests.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-3 text-gray-500">
              <ClipboardList size={40} className="text-gray-300" />
              <p className="font-medium">No tests found</p>
              <p className="text-sm">Adjust filters or wait for students to complete assessments.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Student</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Domain</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Score</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Questions</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Completed</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tests.map((test) => (
                    <tr key={test._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{test.student.name}</p>
                        <p className="text-xs text-gray-500">{test.student.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`badge ${
                            DOMAIN_COLORS[test.domain] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {test.domain ?? "general"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ScorePill percentage={test.percentage} />
                          <span className="text-gray-500 text-xs">
                            {test.totalScore}/{test.maxTotalScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{test.questionCount}</td>
                      <td className="px-4 py-3">
                        {test.status === "reviewed" ? (
                          <span className="badge bg-green-100 text-green-700">Reviewed</span>
                        ) : (
                          <span className="badge bg-yellow-100 text-yellow-700">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {test.completedAt
                          ? new Date(test.completedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/teacher/review/${test._id}`}
                          className="inline-flex items-center gap-1 btn-primary btn-sm"
                        >
                          Review
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary btn-sm"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
