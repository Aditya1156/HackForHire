import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import Interview from "@/lib/db/models/Interview";
import { authenticateRequest, extractUser } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await authenticateRequest(req, ["student"]);
    if (authResult instanceof Response) return authResult as never;
    const user = extractUser(authResult);

    const userId = new mongoose.Types.ObjectId(user.userId);

    // Fetch all data in parallel
    const [recentTestsDocs, recentInterviewsDocs, allTests, allInterviews] =
      await Promise.all([
        // Last 5 completed tests
        Test.find({ userId, mode: "test", status: { $in: ["completed", "reviewed"] } })
          .sort({ completedAt: -1 })
          .limit(5)
          .select("domain totalScore maxTotalScore airsScore completedAt scores")
          .lean(),

        // Last 5 completed interviews
        Interview.find({ userId, status: "completed" })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("role airsScore createdAt")
          .lean(),

        // All completed tests for stats
        Test.find({ userId, mode: "test", status: { $in: ["completed", "reviewed"] } })
          .sort({ completedAt: -1 })
          .select("domain totalScore maxTotalScore completedAt scores airsScore")
          .lean(),

        // All completed interviews for stats
        Interview.find({ userId, status: "completed" })
          .select("airsScore")
          .lean(),
      ]);

    // Build recentTests
    const recentTests = recentTestsDocs.map((t: any) => ({
      id: t._id,
      domain: t.domain || "Mixed",
      score: t.totalScore,
      maxScore: t.maxTotalScore,
      percentage:
        t.maxTotalScore > 0
          ? Math.round((t.totalScore / t.maxTotalScore) * 100)
          : 0,
      date: t.completedAt,
      airsScore: t.airsScore ?? null,
    }));

    // Build recentInterviews
    const recentInterviews = recentInterviewsDocs.map((iv: any) => ({
      id: iv._id,
      role: iv.role,
      airsScore: iv.airsScore?.total ?? 0,
      date: iv.createdAt,
    }));

    // Compute stats
    const totalTests = allTests.length;
    const totalInterviews = allInterviews.length;

    const avgScore =
      totalTests > 0
        ? Math.round(
            allTests.reduce((sum: number, t: any) => {
              const pct =
                t.maxTotalScore > 0
                  ? (t.totalScore / t.maxTotalScore) * 100
                  : 0;
              return sum + pct;
            }, 0) / totalTests
          )
        : 0;

    // Best domain by average score
    const domainMap: Record<string, { total: number; max: number; count: number }> = {};
    for (const t of allTests) {
      const scores: any[] = (t as any).scores || [];
      if (scores.length > 0) {
        for (const s of scores) {
          if (!domainMap[s.domain]) domainMap[s.domain] = { total: 0, max: 0, count: 0 };
          domainMap[s.domain].total += s.score;
          domainMap[s.domain].max += s.maxScore;
          domainMap[s.domain].count += 1;
        }
      } else {
        const domain = (t as any).domain || "Mixed";
        if (!domainMap[domain]) domainMap[domain] = { total: 0, max: 0, count: 0 };
        domainMap[domain].total += (t as any).totalScore;
        domainMap[domain].max += (t as any).maxTotalScore;
        domainMap[domain].count += 1;
      }
    }

    let bestDomain = "—";
    let bestPct = -1;
    for (const [domain, stats] of Object.entries(domainMap)) {
      const pct = stats.max > 0 ? (stats.total / stats.max) * 100 : 0;
      if (pct > bestPct) {
        bestPct = pct;
        bestDomain = domain;
      }
    }

    // AIRS best
    const airsScores = allInterviews.map((iv: any) => iv.airsScore?.total ?? 0);
    const airsBest = airsScores.length > 0 ? Math.max(...airsScores) : 0;

    // Total questions answered
    const totalQuestions = allTests.reduce(
      (sum: number, t: any) => sum + ((t as any).questions?.length || 0),
      0
    );

    // Progress: last 10 tests for chart
    const progress = allTests.slice(0, 10).map((t: any) => ({
      date: t.completedAt,
      percentage:
        t.maxTotalScore > 0
          ? Math.round((t.totalScore / t.maxTotalScore) * 100)
          : 0,
    }));

    // Domain stats
    const domainStats = Object.entries(domainMap).map(([domain, stats]) => ({
      domain,
      avgScore: stats.max > 0 ? Math.round((stats.total / stats.max) * 100) : 0,
      totalAttempts: stats.count,
    }));

    return successResponse({
      recentTests,
      recentInterviews,
      stats: {
        totalTests,
        totalInterviews,
        avgScore,
        bestDomain,
        airsBest,
        totalQuestions,
      },
      progress,
      domainStats,
    });
  } catch (error) {
    console.error("GET /api/dashboard/student error:", error);
    return errorResponse("Failed to fetch dashboard data", 500);
  }
}
