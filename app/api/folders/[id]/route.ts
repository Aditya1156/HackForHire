import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Question from "@/lib/db/models/Question";
import QuestionFolder from "@/lib/db/models/QuestionFolder";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { updateFolderSchema } from "@/lib/utils/validation";
import mongoose from "mongoose";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const authResult = await requireAuth(["admin", "teacher", "student"]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid folder ID", 400);
    }

    const folder = await QuestionFolder.findById(id).lean();
    if (!folder) return errorResponse("Folder not found", 404);

    return successResponse({ folder });
  } catch (error) {
    console.error("GET /api/folders/[id] error:", error);
    return errorResponse("Failed to fetch folder", 500);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const authResult = await requireAuth(["admin"]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid folder ID", 400);
    }

    const validation = await validateBody(req, updateFolderSchema);
    if ("error" in validation) return validation as never;
    const { data } = validation as { data: typeof updateFolderSchema._type };

    const folder = await QuestionFolder.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!folder) return errorResponse("Folder not found", 404);

    return successResponse({ folder });
  } catch (error) {
    console.error("PUT /api/folders/[id] error:", error);
    return errorResponse("Failed to update folder", 500);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const authResult = await requireAuth(["admin"]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid folder ID", 400);
    }

    const folder = await QuestionFolder.findById(id);
    if (!folder) return errorResponse("Folder not found", 404);

    // Cascade delete all questions in this folder
    const deleteResult = await Question.deleteMany({ folderId: folder._id });

    await QuestionFolder.findByIdAndDelete(id);

    return successResponse({
      message: "Folder and all its questions deleted",
      deletedQuestions: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("DELETE /api/folders/[id] error:", error);
    return errorResponse("Failed to delete folder", 500);
  }
}
