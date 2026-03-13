"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { Bell } from "lucide-react";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    role: "student" | "admin" | "teacher";
  };
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  student: "bg-cyan-50 text-cyan-700 border border-cyan-200",
  admin: "bg-blue-50 text-blue-700 border border-blue-200",
  teacher: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

export function Navbar({ user }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/image/VULCAN Logo_transparent.png"
            alt="Vulcan Prep"
            width={36}
            height={36}
          />
          <span className="font-bold text-gray-900 hidden sm:block">Vulcan Prep 360</span>
          <span className="font-bold text-gray-900 sm:hidden">VP</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications bell */}
          <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* Role badge */}
          <span className={`badge text-xs hidden sm:inline-flex ${ROLE_BADGE_COLORS[user.role]}`}>
            {user.role}
          </span>

          {/* Clerk UserButton — handles avatar, profile, sign-out */}
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
