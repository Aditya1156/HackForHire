"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  startedAt?: number; // timestamp ms
  className?: string;
}

export function Timer({ startedAt, className = "" }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const base = startedAt ?? Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - base) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className={`flex items-center gap-1.5 text-gray-600 ${className}`}>
      <Clock className="w-4 h-4" />
      <span className="font-mono text-sm font-medium">{formatted}</span>
    </div>
  );
}
