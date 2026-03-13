"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Brain } from "lucide-react";

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
        router.replace(`/auth/login?from=${encodeURIComponent(pathname)}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router, pathname, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="flex">
        <Sidebar role={user.role} />
        {/* Main content — offset by sidebar width on desktop */}
        <main className="flex-1 lg:ml-60 min-h-[calc(100vh-64px)] transition-all duration-300">
          <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
