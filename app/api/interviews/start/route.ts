import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Interview from "@/lib/db/models/Interview";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { startInterviewSchema } from "@/lib/utils/validation";
import { parseResume } from "@/lib/ai/resume-parser";
import { generateResumeQuestions } from "@/lib/ai/question-generator";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["student"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const validation = await validateBody(req, startInterviewSchema);
    if (validation instanceof NextResponse) return validation;
    const { data } = validation as { data: typeof startInterviewSchema._type };

    // Parse resume if provided
    let parsedResume = {
      name: "",
      skills: [] as string[],
      projects: [] as { name: string; description: string; tech: string[] }[],
      experience: [] as { role: string; company: string; duration: string }[],
      education: "",
      domain: "other",
    };

    if (data.resumeText && data.resumeText.trim().length > 0) {
      try {
        parsedResume = await parseResume(data.resumeText);
      } catch (err) {
        console.error("Resume parsing failed, continuing without resume:", err);
      }
    }

    // Generate first 5 questions based on resume + role
    const questions = await generateResumeQuestions(parsedResume, data.role, 5);
    const firstQuestion = questions[0] ?? `Tell me about yourself and why you are interested in the ${data.role} role.`;

    // Create interview document
    const interview = await Interview.create({
      userId: new mongoose.Types.ObjectId(user.userId),
      role: data.role,
      resumeContext: {
        ...parsedResume,
        _questionsQueue: questions.slice(1), // remaining questions
      },
      conversationHistory: [
        {
          role: "interviewer",
          content: firstQuestion,
          timestamp: new Date(),
        },
      ],
      status: "active",
    });

    return successResponse(
      {
        interviewId: String(interview._id),
        firstQuestion,
        resume: {
          name: parsedResume.name,
          skills: parsedResume.skills,
          domain: parsedResume.domain,
          experience: parsedResume.experience,
          education: parsedResume.education,
          projectCount: parsedResume.projects.length,
        },
      },
      201
    );
  } catch (error) {
    console.error("POST /api/interviews/start error:", error);
    return errorResponse("Failed to start interview", 500);
  }
}
