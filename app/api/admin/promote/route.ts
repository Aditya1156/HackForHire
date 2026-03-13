import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

/**
 * POST /api/admin/promote
 * Body: { "email": "your@email.com", "role": "admin" }
 *
 * Promotes a user to admin/teacher role.
 * Only works if the caller is already an admin OR if there are no admins yet (first-time setup).
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return errorResponse("Not authenticated", 401);

    await connectDB();

    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return errorResponse("email and role are required", 400);
    }
    if (!["admin", "teacher", "student"].includes(role)) {
      return errorResponse("role must be admin, teacher, or student", 400);
    }

    // Check if any admin exists
    const adminCount = await User.countDocuments({ role: "admin" });
    const caller = await User.findOne({ clerkId });

    // Allow if: no admins exist (first-time setup) OR caller is already admin
    if (adminCount > 0 && caller?.role !== "admin") {
      return errorResponse("Only admins can promote users", 403);
    }

    const target = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role },
      { new: true }
    );

    if (!target) {
      return errorResponse(`User with email "${email}" not found. Sign in first to create your account.`, 404);
    }

    return successResponse({
      message: `${target.name} (${target.email}) is now ${role}`,
      user: { name: target.name, email: target.email, role: target.role },
    });
  } catch (error) {
    console.error("POST /api/admin/promote error:", error);
    return errorResponse("Failed to promote user", 500);
  }
}
