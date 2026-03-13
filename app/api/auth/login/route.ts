import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { comparePassword, setAuthCookie } from "@/lib/auth/jwt";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { loginSchema } from "@/lib/utils/validation";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const validation = await validateBody(req, loginSchema);
    if ("error" in validation) return validation as any;
    const { data } = validation as { data: any };

    // Find user with password included (select: false by default)
    const user = await User.findOne({ email: data.email }).select("+password");
    if (!user) {
      return errorResponse("Invalid email or password", 401);
    }

    // Verify password
    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) {
      return errorResponse("Invalid email or password", 401);
    }

    // Set auth cookie
    await setAuthCookie({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return successResponse({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Login failed. Please try again.", 500);
  }
}
