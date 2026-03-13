import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { authenticateRequest } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if ("error" in authResult) return authResult as any;
    const { user: payload } = authResult as { user: any };

    await connectDB();

    const user = await User.findById(payload.userId).select("-password");
    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        resume: user.resume,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Me error:", error);
    return errorResponse("Failed to fetch user", 500);
  }
}
