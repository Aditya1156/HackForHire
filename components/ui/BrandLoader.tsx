"use client";

import Image from "next/image";

interface BrandLoaderProps {
  /** Text below the logo */
  text?: string;
  /** Sub-text below the main text */
  subText?: string;
  /** Full-page centered layout (default: true) */
  fullPage?: boolean;
  /** Background class override */
  bg?: string;
  /** Size of the logo: "sm" (32px), "md" (48px), "lg" (64px) */
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { img: 64, wrapper: "w-20 h-20" },
  md: { img: 96, wrapper: "w-28 h-28" },
  lg: { img: 128, wrapper: "w-36 h-36" },
};

export default function BrandLoader({
  text,
  subText,
  fullPage = true,
  bg = "bg-gray-50",
  size = "md",
}: BrandLoaderProps) {
  const s = SIZES[size];

  const content = (
    <div className="text-center flex flex-col items-center gap-3">
      <div className={`${s.wrapper} relative animate-pulse`}>
        <Image
          src="/image/VULCAN Logo_transparent.png"
          alt="VulcanPrep"
          width={s.img}
          height={s.img}
          className="object-contain"
          style={{ width: "auto", height: "auto" }}
          priority
        />
      </div>
      {text && <p className="text-sm font-medium text-gray-500">{text}</p>}
      {subText && <p className="text-xs text-gray-400">{subText}</p>}
    </div>
  );

  if (!fullPage) return content;

  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center`}>
      {content}
    </div>
  );
}
