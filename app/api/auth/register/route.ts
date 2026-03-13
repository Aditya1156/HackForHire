import { NextResponse } from "next/server";

// Clerk handles authentication — this route is no longer used.
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Authentication is handled by Clerk." },
    { status: 404 }
  );
}
