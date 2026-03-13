import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { parseResume } from "@/lib/ai/resume-parser";

const parseResumeSchema = z.object({
  resumeText: z.string().min(10, "Resume text is too short"),
  save: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["student", "teacher", "admin"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const bodyResult = await validateBody(req, parseResumeSchema);
    if (bodyResult instanceof NextResponse) return bodyResult;
    const { resumeText, save } = bodyResult.data;

    const parsed = await parseResume(resumeText);

    // Optionally persist parsed resume to user document
    if (save) {
      await User.findByIdAndUpdate(user.userId, {
        $set: {
          "resume.parsed": {
            skills: parsed.skills,
            projects: parsed.projects,
            experience: parsed.experience,
            domain: parsed.domain,
            education: parsed.education,
          },
        },
      });
    }

    return successResponse({ parsed });
  } catch (error) {
    console.error("POST /api/ai/parse-resume error:", error);
    return errorResponse("Failed to parse resume", 500);
  }
}
