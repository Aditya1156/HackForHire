import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Question from "@/lib/db/models/Question";
import QuestionFolder from "@/lib/db/models/QuestionFolder";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { createQuestionSchema } from "@/lib/utils/validation";
import { getDefaultRubric } from "@/lib/ai/rubric-templates";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["admin", "teacher"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user: _user } = authResult;

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");
    const domain = searchParams.get("domain");
    const difficulty = searchParams.get("difficulty");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    const filter: Record<string, unknown> = {};
    if (folderId && mongoose.Types.ObjectId.isValid(folderId)) {
      filter.folderId = new mongoose.Types.ObjectId(folderId);
    }
    if (domain) filter.domain = domain;
    if (difficulty) filter.difficulty = difficulty;

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("folderId", "name domain")
        .lean(),
      Question.countDocuments(filter),
    ]);

    return successResponse({
      questions,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/questions error:", error);
    return errorResponse("Failed to fetch questions", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["admin"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const validation = await validateBody(req, createQuestionSchema);
    if ("error" in validation) return validation as never;
    const { data } = validation as { data: typeof createQuestionSchema._type };

    const folder = await QuestionFolder.findById(data.folderId);
    if (!folder) return errorResponse("Folder not found", 404);

    // Auto-generate rubric if criteria are empty
    if (!data.rubric.criteria || data.rubric.criteria.length === 0) {
      const template = getDefaultRubric(data.domain, data.type);
      data.rubric.criteria = template.criteria;
      if (!data.rubric.gradingLogic) {
        data.rubric.gradingLogic = template.gradingLogic;
      }
    }

    const question = await Question.create({
      ...data,
      folderId: new mongoose.Types.ObjectId(data.folderId),
      createdBy: new mongoose.Types.ObjectId(user.userId),
    });

    await QuestionFolder.findByIdAndUpdate(data.folderId, {
      $inc: { questionCount: 1 },
    });

    return successResponse({ question }, 201);
  } catch (error) {
    console.error("POST /api/questions error:", error);
    return errorResponse("Failed to create question", 500);
  }
}
