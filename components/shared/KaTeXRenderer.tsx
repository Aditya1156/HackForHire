"use client";

import { useEffect, useRef, useState } from "react";

interface KaTeXRendererProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

export function KaTeXRenderer({ formula, displayMode = false, className = "" }: KaTeXRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !formula) return;

    // Dynamically import KaTeX to avoid SSR issues
    import("katex")
      .then((katex) => {
        if (!containerRef.current) return;
        try {
          katex.default.render(formula, containerRef.current, {
            displayMode,
            throwOnError: false,
            errorColor: "#ef4444",
            strict: false,
          });
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Render error");
        }
      })
      .catch(() => {
        setError("KaTeX failed to load");
      });
  }, [formula, displayMode]);

  if (error) {
    return (
      <span className="text-red-500 text-sm font-mono">
        [Math Error: {error}]
      </span>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`katex-container ${displayMode ? "block my-4 text-center" : "inline"} ${className}`}
    />
  );
}

// Convenience component for inline math
export function InlineMath({ formula, className }: { formula: string; className?: string }) {
  return <KaTeXRenderer formula={formula} displayMode={false} className={className} />;
}

// Convenience component for block/display math
export function DisplayMath({ formula, className }: { formula: string; className?: string }) {
  return <KaTeXRenderer formula={formula} displayMode={true} className={className} />;
}
