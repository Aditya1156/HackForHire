import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

// --- Success Response ---
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

// --- Error Response ---
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// --- Validate Request Body ---
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | NextResponse> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return errorResponse(`Validation failed: ${messages.join(", ")}`, 400);
    }
    return errorResponse("Invalid request body", 400);
  }
}

// --- Safe Async Handler ---
export function safeHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof NextResponse) return error; // re-throw auth errors
      console.error("API Error:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return errorResponse(message, 500);
    }
  };
}
