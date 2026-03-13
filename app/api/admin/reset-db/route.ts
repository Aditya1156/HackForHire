import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Question from "@/lib/db/models/Question";
import QuestionFolder from "@/lib/db/models/QuestionFolder";
import Test from "@/lib/db/models/Test";
import Interview from "@/lib/db/models/Interview";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

/**
 * POST /api/admin/reset-db
 * Clears all data from the database for a fresh start.
 * Only works in development mode.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return errorResponse("Cannot reset database in production", 403);
  }

  try {
    await connectDB();

    const results = {
      users: await User.deleteMany({}),
      questions: await Question.deleteMany({}),
      folders: await QuestionFolder.deleteMany({}),
      tests: await Test.deleteMany({}),
      interviews: await Interview.deleteMany({}),
    };

    return successResponse({
      message: "Database cleared successfully",
      deleted: {
        users: results.users.deletedCount,
        questions: results.questions.deletedCount,
        folders: results.folders.deletedCount,
        tests: results.tests.deletedCount,
        interviews: results.interviews.deletedCount,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/reset-db error:", error);
    return errorResponse("Failed to reset database", 500);
  }
}
