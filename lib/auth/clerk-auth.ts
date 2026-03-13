import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

export interface AuthPayload {
  userId: string;        // MongoDB _id
  clerkId: string;       // Clerk user ID
  email: string;
  role: "student" | "admin" | "teacher";
}

// Get or create MongoDB user from Clerk session
export async function getOrCreateUser(): Promise<AuthPayload | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  await connectDB();

  let user = await User.findOne({ clerkId });

  if (!user) {
    // First time — create MongoDB user synced from Clerk
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || email;
    user = await User.create({
      clerkId,
      name,
      email,
      role: "student", // default role
    });
  }

  return {
    userId: user._id.toString(),
    clerkId,
    email: user.email,
    role: user.role,
  };
}

// Middleware for API routes — replaces authenticateRequest()
export async function requireAuth(
  allowedRoles?: ("student" | "admin" | "teacher")[]
): Promise<{ user: AuthPayload } | NextResponse> {
  const payload = await getOrCreateUser();

  if (!payload) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  return { user: payload };
}
