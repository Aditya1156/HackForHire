import Link from "next/link";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-navy flex items-center justify-center px-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-md">
        {/* Logo */}
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
          <span className="text-white font-extrabold text-xl">VE</span>
        </div>

        {/* 404 */}
        <div className="text-8xl font-black text-white/10 mb-2 leading-none select-none">
          404
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <h1 className="text-2xl font-bold text-white">Page not found</h1>
        </div>

        <p className="text-white/60 text-base mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
          >
            Sign In
          </Link>
        </div>

        <p className="text-white/20 text-xs mt-12">
          Versatile Evaluator — Anvesana Hack for Hire
        </p>
      </div>
    </div>
  );
}
