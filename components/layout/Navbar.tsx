"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Video,
  FolderOpen,
  Users,
  BookOpen,
  CheckSquare,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

type Role = "student" | "admin" | "teacher";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    role: Role;
  };
}

const NAV_ITEMS: Record<Role, { href: string; icon: any; label: string }[]> = {
  student: [
    { href: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/student/interview", icon: Video, label: "Interview" },
  ],
  admin: [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/questions", icon: BookOpen, label: "Questions" },
    { href: "/admin/folders", icon: FolderOpen, label: "Folders" },
    { href: "/admin/users", icon: Users, label: "Users" },
  ],
  teacher: [
    { href: "/teacher/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/teacher/review", icon: CheckSquare, label: "Review" },
  ],
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  student: "bg-cyan-50 text-cyan-700 border border-cyan-200",
  admin: "bg-blue-50 text-blue-700 border border-blue-200",
  teacher: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = NAV_ITEMS[user.role] || [];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image
              src="/image/VULCAN Logo_transparent.png"
              alt="Vulcan Prep"
              width={44}
              height={44}
            />
            <span className="font-bold text-gray-900 hidden sm:block">Vulcan Prep 360</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? "text-cyan-700 bg-cyan-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-cyan-600" : "text-gray-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            <span className={`text-xs hidden sm:inline-flex px-2 py-1 rounded-full font-medium ${ROLE_BADGE_COLORS[user.role]}`}>
              {user.role}
            </span>

            <UserButton />

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? "text-cyan-700 bg-cyan-50"
                      : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-cyan-600" : "text-gray-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
