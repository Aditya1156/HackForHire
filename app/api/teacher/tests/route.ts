import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["teacher", "admin"]);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
    const skip = (page - 1) * limit;

    // Build query — only completed or reviewed tests
    const query: Record<string, unknown> = {
      status: { $in: ["completed", "reviewed"] },
    };

    if (domain) query.domain = domain;
    if (status === "completed" || status === "reviewed") query.status = status;

    const [tests, total] = await Promise.all([
      Test.find(query)
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "userId", select: "name email" })
        .lean(),
      Test.countDocuments(query),
    ]);

    const testsFormatted = tests.map((t: any) => ({
      _id: String(t._id),
      student: {
        _id: String(t.userId?._id ?? t.userId),
        name: t.userId?.name ?? "Unknown",
        email: t.userId?.email ?? "",
      },
      domain: t.domain,
      mode: t.mode,
      status: t.status,
      totalScore: t.totalScore,
      maxTotalScore: t.maxTotalScore,
      percentage:
        t.maxTotalScore > 0
          ? Math.round((t.totalScore / t.maxTotalScore) * 100)
          : 0,
      airsScore: t.airsScore,
      questionCount: t.questions?.length ?? 0,
      completedAt: t.completedAt,
      startedAt: t.startedAt,
    }));

    return successResponse({
      tests: testsFormatted,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/teacher/tests error:", error);
    return errorResponse("Failed to fetch tests", 500);
  }
}
