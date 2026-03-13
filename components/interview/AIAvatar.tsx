"use client";

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
          className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg
            ${isThinking
              ? "bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse"
              : isSpeaking
              ? "bg-gradient-to-br from-primary-500 to-primary-700"
              : "bg-gradient-to-br from-primary-600 to-navy"
            }`}
        >
          {/* Bot face SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-9 h-9 ${isThinking ? "animate-spin [animation-duration:3s]" : ""}`}
          >
            <rect x="2" y="8" width="20" height="13" rx="3" />
            <circle cx="9" cy="14" r="1.5" fill="white" stroke="none" />
            <circle cx="15" cy="14" r="1.5" fill="white" stroke="none" />
            <path d="M9 19h6" />
            <path d="M12 5v3M8 5.5l1.5 2.5M16 5.5l-1.5 2.5" />
            <circle cx="12" cy="4" r="1.5" fill="white" stroke="none" />
          </svg>

          {/* Thinking dots */}
          {isThinking && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-200 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-200 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-200 animate-bounce [animation-delay:300ms]" />
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
