import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Question from "@/lib/db/models/Question";
import QuestionFolder from "@/lib/db/models/QuestionFolder";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { createQuestionSchema } from "@/lib/utils/validation";
import { z } from "zod";
import mongoose from "mongoose";

const bulkCreateSchema = z.object({
  questions: z.array(createQuestionSchema).min(1, "At least one question is required").max(100),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["admin"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid request body", 400);
    }

    const parseResult = bulkCreateSchema.safeParse(body);
    if (!parseResult.success) {
      const messages = parseResult.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return errorResponse(`Validation failed: ${messages.join(", ")}`, 400);
    }

    const { questions: questionsData } = parseResult.data;

    // Validate all folder IDs exist
    const folderIds = [...new Set(questionsData.map((q) => q.folderId))];
    const folders = await QuestionFolder.find({ _id: { $in: folderIds } }).lean();
    const foundFolderIds = new Set(folders.map((f) => f._id.toString()));

    for (const fid of folderIds) {
      if (!foundFolderIds.has(fid)) {
        return errorResponse(`Folder not found: ${fid}`, 404);
      }
    }

    const createdBy = new mongoose.Types.ObjectId(user.userId);
    const docs = questionsData.map((q) => ({
      ...q,
      folderId: new mongoose.Types.ObjectId(q.folderId),
      createdBy,
    }));

    const created = await Question.insertMany(docs);

    // Increment question counts per folder
    const countsByFolder: Record<string, number> = {};
    for (const q of questionsData) {
      countsByFolder[q.folderId] = (countsByFolder[q.folderId] ?? 0) + 1;
    }

    await Promise.all(
      Object.entries(countsByFolder).map(([fid, count]) =>
        QuestionFolder.findByIdAndUpdate(fid, { $inc: { questionCount: count } })
      )
    );

    return successResponse(
      { created: created.length, questions: created },
      201
    );
  } catch (error) {
    console.error("POST /api/questions/bulk error:", error);
    return errorResponse("Failed to bulk create questions", 500);
  }
}
