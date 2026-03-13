import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

// Admin access code — set this in .env.local as ADMIN_ACCESS_CODE
// Default: "vulcan-admin-2024" (change in production!)
const ADMIN_CODE = process.env.ADMIN_ACCESS_CODE ?? "vulcan-admin-2024";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return errorResponse("Not authenticated", 401);

    const body = await req.json();
    const { role, adminCode } = body;

    if (!role || !["student", "admin", "teacher"].includes(role)) {
      return errorResponse("Invalid role", 400);
    }

    // Verify admin access code
    if (role === "admin") {
      if (!adminCode || adminCode !== ADMIN_CODE) {
        return errorResponse("Invalid admin access code", 403);
      }
    }

    await connectDB();

    // Check if user already exists
    const existing = await User.findOne({ clerkId });
    if (existing) {
      return successResponse({
        message: "User already exists",
        role: existing.role,
      });
    }

    // Get Clerk profile info
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";
    const name =
      `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() ||
      email;

    const user = await User.create({ clerkId, name, email, role });

    return successResponse({
      message: `Account created as ${role}`,
      role: user.role,
    }, 201);
  } catch (error) {
    console.error("POST /api/auth/select-role error:", error);
    return errorResponse("Failed to create account", 500);
  }
}
