import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import QuestionFolder from "@/lib/db/models/QuestionFolder";
import { authenticateRequest, extractUser } from "@/lib/auth/jwt";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { createFolderSchema } from "@/lib/utils/validation";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await authenticateRequest(req, ["admin", "teacher", "student"]);
    if (authResult instanceof Response) return authResult as never;

    const folders = await QuestionFolder.find({})
      .sort({ createdAt: -1 })
      .lean();

    return successResponse({ folders });
  } catch (error) {
    console.error("GET /api/folders error:", error);
    return errorResponse("Failed to fetch folders", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await authenticateRequest(req, ["admin"]);
    if (authResult instanceof Response) return authResult as never;
    const user = extractUser(authResult);

    const validation = await validateBody(req, createFolderSchema);
    if ("error" in validation) return validation as never;
    const { data } = validation as { data: typeof createFolderSchema._type };

    const folder = await QuestionFolder.create({
      ...data,
      createdBy: new mongoose.Types.ObjectId(user.userId),
    });

    return successResponse({ folder }, 201);
  } catch (error) {
    console.error("POST /api/folders error:", error);
    return errorResponse("Failed to create folder", 500);
  }
}
