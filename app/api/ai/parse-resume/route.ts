import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { authenticateRequest, extractUser } from "@/lib/auth/jwt";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { parseResume } from "@/lib/ai/resume-parser";

const parseResumeSchema = z.object({
  resumeText: z.string().min(10, "Resume text is too short"),
  save: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await authenticateRequest(req, ["student", "teacher", "admin"]);
    if (authResult instanceof Response) return authResult as never;
    const user = extractUser(authResult);

    const bodyResult = await validateBody(req, parseResumeSchema);
    if (bodyResult instanceof Response) return bodyResult as never;
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
