import { NextRequest } from "next/server";
import { clearAuthCookie } from "@/lib/auth/jwt";
import { successResponse } from "@/lib/utils/api-helpers";

export async function POST(_req: NextRequest) {
  await clearAuthCookie();
  return successResponse({ message: "Logged out successfully" });
}
