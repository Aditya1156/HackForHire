"use client";

import { useEffect } from "react";
import { Home, RefreshCw, AlertOctagon } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-navy flex items-center justify-center px-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-md">
        {/* Icon */}
        <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <AlertOctagon className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Something went wrong
        </h1>

        <p className="text-white/60 text-base mb-2 leading-relaxed">
          An unexpected error occurred. We&apos;ve noted it — please try again
          or return home.
        </p>

        {error.digest && (
          <p className="text-white/30 text-xs font-mono mb-8">
            Error ID: {error.digest}
          </p>
        )}

        {!error.digest && <div className="mb-8" />}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Go Home
          </a>
        </div>

        <p className="text-white/20 text-xs mt-12">
          Versatile Evaluator — Anvesana Hack for Hire
        </p>
      </div>
    </div>
  );
}
