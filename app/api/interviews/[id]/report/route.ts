import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Interview from "@/lib/db/models/Interview";
import { authenticateRequest, extractUser } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authResult = await authenticateRequest(req, ["student", "teacher", "admin"]);
    if (authResult instanceof Response) return authResult as never;
    const user = extractUser(authResult);

    const { id } = await params;

    const interview = await Interview.findById(id).lean();
    if (!interview) return errorResponse("Interview not found", 404);

    // Students can only see their own interviews; teachers/admins can see all
    if (user.role === "student" && String(interview.userId) !== user.userId) {
      return errorResponse("Unauthorized", 403);
    }

    // Calculate duration in seconds
    const createdAt = interview.createdAt instanceof Date
      ? interview.createdAt
      : new Date(interview.createdAt as any);
    const updatedAt = (interview as any).updatedAt instanceof Date
      ? (interview as any).updatedAt
      : new Date((interview as any).updatedAt ?? Date.now());
    const durationSeconds = Math.round((updatedAt.getTime() - createdAt.getTime()) / 1000);

    const resumeContext = interview.resumeContext as any;
    const analysis = resumeContext?._analysis ?? {};

    return successResponse({
      interview: {
        _id: String(interview._id),
        role: interview.role,
        status: interview.status,
        airsScore: interview.airsScore,
        conversationHistory: interview.conversationHistory,
        resumeContext: {
          name: resumeContext?.name ?? "",
          skills: resumeContext?.skills ?? [],
          domain: resumeContext?.domain ?? "",
          experience: resumeContext?.experience ?? [],
          education: resumeContext?.education ?? "",
          projectCount: (resumeContext?.projects ?? []).length,
        },
        analysis: {
          strengths: analysis.strengths ?? [],
          weaknesses: analysis.weaknesses ?? [],
          overallSummary: analysis.overallSummary ?? "",
          rawScores: analysis.rawScores ?? {},
        },
        duration: durationSeconds,
        createdAt: interview.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/interviews/[id]/report error:", error);
    return errorResponse("Failed to fetch report", 500);
  }
}
