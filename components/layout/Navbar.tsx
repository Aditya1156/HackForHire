"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { Brain, Bell } from "lucide-react";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    role: "student" | "admin" | "teacher";
  };
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  student: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
  teacher: "bg-green-100 text-green-700",
};

export function Navbar({ user }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 hidden sm:block">Versatile Evaluator</span>
          <span className="font-bold text-gray-900 sm:hidden">VE</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications bell */}
          <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* Role badge */}
          <span className={`badge text-xs hidden sm:inline-flex ${ROLE_BADGE_COLORS[user.role]}`}>
            {user.role}
          </span>

          {/* Clerk UserButton — handles avatar, profile, sign-out */}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}
