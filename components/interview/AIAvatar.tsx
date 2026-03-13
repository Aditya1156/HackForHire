"use client";

import Image from "next/image";

interface AIAvatarProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  name?: string;
  subtitle?: string;
}

export function AIAvatar({
  isThinking = false,
  isSpeaking = false,
  name = "AI Interviewer",
  subtitle = "Senior Hiring Manager",
}: AIAvatarProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar ring layers */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring when speaking */}
        {isSpeaking && (
          <>
            <span className="absolute inline-flex h-24 w-24 rounded-full bg-primary-400 opacity-20 animate-ping" />
            <span className="absolute inline-flex h-20 w-20 rounded-full bg-primary-400 opacity-30 animate-ping [animation-delay:150ms]" />
          </>
        )}

        {/* Main avatar circle */}
        <div
          className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden
            ${isThinking
              ? "bg-amber-50 animate-pulse"
              : isSpeaking
              ? "bg-white"
              : "bg-white"
            }`}
        >
          <Image
            src="/image/VULCAN Logo_transparent.png"
            alt="Vulcan AI"
            width={56}
            height={56}
            className={isThinking ? "animate-spin [animation-duration:3s]" : ""}
          />

          {/* Thinking dots */}
          {isThinking && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
            </div>
          )}
        </div>

        {/* Status indicator dot */}
        <span
          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white
            ${isThinking ? "bg-amber-400" : isSpeaking ? "bg-green-400 animate-pulse" : "bg-gray-300"}`}
        />
      </div>

      {/* Name + subtitle */}
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
        {isThinking && (
          <p className="text-xs text-amber-600 font-medium mt-0.5">Thinking...</p>
        )}
        {isSpeaking && !isThinking && (
          <p className="text-xs text-primary-600 font-medium mt-0.5">Speaking</p>
        )}
      </div>
    </div>
  );
}
