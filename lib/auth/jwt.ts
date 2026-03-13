// lib/auth/jwt.ts — deprecated, use clerk-auth instead
export { requireAuth, getOrCreateUser } from "./clerk-auth";
export type { AuthPayload } from "./clerk-auth";

// Legacy stub — hashPassword and verifyPassword are no longer used (Clerk handles auth)
export async function hashPassword(password: string): Promise<string> {
  console.warn("hashPassword is deprecated — Clerk handles authentication");
  return password;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  console.warn("verifyPassword is deprecated — Clerk handles authentication");
  return false;
}
