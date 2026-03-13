import { Brain } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-navy flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse">
          <Brain className="w-8 h-8 text-white" />
        </div>

        {/* Spinner */}
        <div className="w-10 h-10 border-4 border-primary-700 border-t-primary-300 rounded-full animate-spin mx-auto mb-4" />

        <p className="text-white/60 text-sm font-medium">
          Versatile Evaluator
        </p>
        <p className="text-white/30 text-xs mt-1">
          Loading...
        </p>
      </div>
    </div>
  );
}
