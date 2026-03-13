import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { hashPassword, setAuthCookie } from "@/lib/auth/jwt";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { registerSchema } from "@/lib/utils/validation";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const validation = await validateBody(req, registerSchema);
    if ("error" in validation) return validation as any;
    const { data } = validation as { data: any };

    // Check if user already exists
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return errorResponse("An account with this email already exists", 409);
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(data.password);
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    });

    // Set auth cookie
    await setAuthCookie({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return successResponse(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      201
    );
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse("Registration failed. Please try again.", 500);
  }
}
