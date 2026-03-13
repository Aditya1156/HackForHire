import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return errorResponse("Not authenticated", 401);

    await connectDB();
    const user = await User.findOne({ clerkId });
    if (!user) return errorResponse("User not found", 404);

    return successResponse({
      user: {
        id: user._id.toString(),
        clerkId: user.clerkId,
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
