import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple cookie-presence middleware (Edge-compatible).
// Full JWT verification is handled by AuthGuard (client) and
// authenticateRequest (server API routes).

export function middleware(request: NextRequest) {
  const token = request.cookies.get("ve-token")?.value;
  const { pathname } = request.nextUrl;

  const protectedPaths = ["/student", "/admin", "/teacher"];
  const authPaths = ["/auth/login", "/auth/register"];

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuth = authPaths.some((p) => pathname.startsWith(p));

  // Not logged in → redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in → redirect away from auth pages
  if (isAuth && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
