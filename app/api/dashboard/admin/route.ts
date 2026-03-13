import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import Interview from "@/lib/db/models/Interview";
import User from "@/lib/db/models/User";
import Question from "@/lib/db/models/Question";
import QuestionFolder from "@/lib/db/models/QuestionFolder";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["admin", "teacher"]);
    if (authResult instanceof NextResponse) return authResult;

    const [
      totalUsers,
      totalStudents,
      totalQuestions,
      totalFolders,
      totalTests,
      totalInterviews,
      recentTestDocs,
      recentInterviewDocs,
      domainQuestionDocs,
      completedTests,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      Question.countDocuments(),
      QuestionFolder.countDocuments(),
      Test.countDocuments({ mode: "test", status: { $in: ["completed", "reviewed"] } }),
      Interview.countDocuments({ status: "completed" }),

      // Recent activity — last 10 tests
      Test.find({ mode: "test", status: { $in: ["completed", "reviewed"] } })
        .sort({ completedAt: -1 })
        .limit(10)
        .select("userId domain totalScore maxTotalScore completedAt")
        .populate({ path: "userId", select: "name email" })
        .lean(),

      // Recent interviews — last 5
      Interview.find({ status: "completed" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("userId role airsScore createdAt")
        .populate({ path: "userId", select: "name email" })
        .lean(),

      // Questions per domain
      Question.aggregate([
        { $group: { _id: "$domain", questionCount: { $sum: 1 } } },
        { $sort: { questionCount: -1 } },
      ]),

      // All completed tests for score distribution & top students
      Test.find({ mode: "test", status: { $in: ["completed", "reviewed"] } })
        .select("userId domain totalScore maxTotalScore")
        .populate({ path: "userId", select: "name email" })
        .lean(),
    ]);

    // Avg score
    const avgScore =
      completedTests.length > 0
        ? Math.round(
            completedTests.reduce((sum: number, t: any) => {
              const pct =
                t.maxTotalScore > 0
                  ? (t.totalScore / t.maxTotalScore) * 100
                  : 0;
              return sum + pct;
            }, 0) / completedTests.length
          )
        : 0;

    // Recent activity: merge tests + interviews, sort by date
    const recentActivity = [
      ...recentTestDocs.map((t: any) => ({
        type: "test",
        userName: t.userId?.name || "Unknown",
        userEmail: t.userId?.email || "",
        domain: t.domain || "Mixed",
        score: t.maxTotalScore > 0 ? Math.round((t.totalScore / t.maxTotalScore) * 100) : 0,
        date: t.completedAt,
      })),
      ...recentInterviewDocs.map((iv: any) => ({
        type: "interview",
        userName: iv.userId?.name || "Unknown",
        userEmail: iv.userId?.email || "",
        domain: iv.role,
        score: iv.airsScore?.total ?? 0,
        date: iv.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Domain distribution
    const domainDistribution = domainQuestionDocs.map((d: any) => ({
      domain: d._id,
      questionCount: d.questionCount,
    }));

    // Score distribution (grade bands)
    const gradeBands: Record<string, number> = {
      "A+": 0, A: 0, "B+": 0, B: 0, C: 0, D: 0, F: 0,
    };
    for (const t of completedTests) {
      const pct =
        (t as any).maxTotalScore > 0
          ? ((t as any).totalScore / (t as any).maxTotalScore) * 100
          : 0;
      if (pct >= 90) gradeBands["A+"]++;
      else if (pct >= 80) gradeBands["A"]++;
      else if (pct >= 70) gradeBands["B+"]++;
      else if (pct >= 60) gradeBands["B"]++;
      else if (pct >= 50) gradeBands["C"]++;
      else if (pct >= 40) gradeBands["D"]++;
      else gradeBands["F"]++;
    }
    const scoreDistribution = Object.entries(gradeBands).map(([grade, count]) => ({
      grade,
      count,
    }));

    // Top 5 students by avg score
    const studentMap: Record<
      string,
      { name: string; email: string; totalPct: number; count: number }
    > = {};
    for (const t of completedTests) {
      const uid = (t as any).userId?._id?.toString();
      if (!uid) continue;
      if (!studentMap[uid]) {
        studentMap[uid] = {
          name: (t as any).userId?.name || "Unknown",
          email: (t as any).userId?.email || "",
          totalPct: 0,
          count: 0,
        };
      }
      const pct =
        (t as any).maxTotalScore > 0
          ? ((t as any).totalScore / (t as any).maxTotalScore) * 100
          : 0;
      studentMap[uid].totalPct += pct;
      studentMap[uid].count += 1;
    }

    const topStudents = Object.entries(studentMap)
      .map(([id, s]) => ({
        id,
        name: s.name,
        email: s.email,
        avgScore: s.count > 0 ? Math.round(s.totalPct / s.count) : 0,
        testsTaken: s.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    return successResponse({
      stats: {
        totalUsers,
        totalStudents,
        totalQuestions,
        totalFolders,
        totalTests,
        totalInterviews,
        avgScore,
      },
      recentActivity,
      domainDistribution,
      scoreDistribution,
      topStudents,
    });
  } catch (error) {
    console.error("GET /api/dashboard/admin error:", error);
    return errorResponse("Failed to fetch admin dashboard data", 500);
  }
}
