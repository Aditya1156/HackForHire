"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Video,
  FolderOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckSquare,
  Menu,
} from "lucide-react";

type Role = "student" | "admin" | "teacher";

interface SidebarProps {
  role: Role;
}

const NAV_ITEMS: Record<Role, { href: string; icon: any; label: string }[]> = {
  student: [
    { href: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/student/test", icon: FileText, label: "Tests" },
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

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_ITEMS[role] || [];

  const SidebarContent = () => (
    <>
      {/* Collapse toggle (desktop) */}
      <div className="hidden lg:flex items-center justify-end px-3 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                isActive
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"}`}
              />
              {(!collapsed || mobileOpen) && (
                <span className="text-sm truncate">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 bg-primary-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-xl z-40 flex flex-col transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: 240 }}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          <span className="font-bold text-gray-900 text-sm">Navigation</span>
        </div>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r border-gray-200 transition-all duration-300 z-20`}
        style={{ width: collapsed ? 64 : 240 }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
