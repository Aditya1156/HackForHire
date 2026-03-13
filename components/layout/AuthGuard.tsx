"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import BrandLoader from "@/components/ui/BrandLoader";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin" | "teacher";
}

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "student" | "admin" | "teacher";
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for Clerk to finish loading
    if (!isLoaded) return;

    // Not signed in — redirect to Clerk sign-in
    if (!isSignedIn) {
      router.replace(`/sign-in?redirect_url=${encodeURIComponent(pathname)}`);
      return;
    }

    // Fetch MongoDB user profile (includes role)
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        const userData = data.data.user;
        setUser(userData);

        // Role-based redirect
        if (requiredRole && userData.role !== requiredRole) {
          router.replace(`/${userData.role}/dashboard`);
          return;
        }
      })
      .catch(() => {
        router.replace(`/sign-in?redirect_url=${encodeURIComponent(pathname)}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLoaded, isSignedIn, router, pathname, requiredRole]);

  if (!isLoaded || isLoading) {
    return (
      <BrandLoader text="Loading..." />
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <main className="min-h-[calc(100vh-64px)]">
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
