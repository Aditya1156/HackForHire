"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Shield, GraduationCap, Loader2, Lock, Eye, EyeOff } from "lucide-react";

export default function SelectRolePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<"student" | "admin" | null>(null);
  const [adminCode, setAdminCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");

    try {
      const body: any = { role: selected };
      if (selected === "admin") body.adminCode = adminCode;

      const res = await fetch("/api/auth/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        const role = data.data.role;
        if (role === "admin") router.push("/admin");
        else router.push("/student/dashboard");
      } else {
        setError(data.error ?? "Something went wrong");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Image
            src="/image/VULCAN Logo_transparent.png"
            alt="Vulcan Prep"
            width={72}
            height={72}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Vulcan Prep 360</h1>
          <p className="text-gray-500 text-sm mt-2">Select your role to get started</p>
        </div>

        <div className="space-y-3">
          {/* Student */}
          <button
            onClick={() => { setSelected("student"); setError(""); }}
            className={`w-full p-5 rounded-2xl border-2 transition-all text-left flex items-center gap-4
              ${selected === "student"
                ? "border-cyan-500 bg-cyan-50 ring-1 ring-cyan-200"
                : "border-gray-200 bg-white hover:border-cyan-300"
              }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center
              ${selected === "student" ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-500"}`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Student</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Take AI interviews, assessments, and track your progress
              </p>
            </div>
          </button>

          {/* Admin */}
          <button
            onClick={() => { setSelected("admin"); setError(""); }}
            className={`w-full p-5 rounded-2xl border-2 transition-all text-left flex items-center gap-4
              ${selected === "admin"
                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                : "border-gray-200 bg-white hover:border-blue-300"
              }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center
              ${selected === "admin" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Admin</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Create question sets, manage users, and review results
              </p>
            </div>
          </button>
        </div>

        {/* Admin access code input */}
        {selected === "admin" && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <label className="text-sm font-semibold text-blue-900">Admin Access Code</label>
            </div>
            <div className="relative">
              <input
                type={showCode ? "text" : "password"}
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Enter admin access code"
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-blue-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Contact your organization admin for the access code.
            </p>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm text-center mt-4">{error}</p>
        )}

        <button
          onClick={handleContinue}
          disabled={!selected || loading || (selected === "admin" && !adminCode.trim())}
          className="w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Setting up...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}
