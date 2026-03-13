import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authResult = await requireAuth(["student"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const test = await Test.findById(id);
    if (!test) return errorResponse("Test not found", 404);
    if (String(test.userId) !== user.userId) return errorResponse("Access denied", 403);

    const body = await req.json();
    const { violations, warningCount, recordingUrl } = body as {
      violations: { type: string; timestamp: string; message: string }[];
      warningCount: number;
      recordingUrl?: string;
    };

    test.proctoring = {
      enabled: true,
      violations: (violations || []).map((v) => ({
        type: v.type,
        timestamp: new Date(v.timestamp),
        message: v.message,
      })),
      warningCount: warningCount || 0,
      recordingUrl: recordingUrl || undefined,
    };

    await test.save();

    return successResponse({ saved: true });
  } catch (error) {
    console.error("POST /api/tests/[id]/proctoring error:", error);
    return errorResponse("Failed to save proctoring data", 500);
  }
}
