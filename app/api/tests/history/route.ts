import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["student"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = 10;
    const skip = (page - 1) * limit;

    const query = {
      userId: new mongoose.Types.ObjectId(user.userId),
      mode: "test",
    };

    const [tests, total] = await Promise.all([
      Test.find(query)
        .sort({ completedAt: -1, startedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "folderId domain totalScore maxTotalScore airsScore completedAt startedAt status scores"
        )
        .populate({ path: "folderId", select: "name domain" })
        .lean(),
      Test.countDocuments(query),
    ]);

    return successResponse({
      tests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("GET /api/tests/history error:", error);
    return errorResponse("Failed to fetch test history", 500);
  }
}
