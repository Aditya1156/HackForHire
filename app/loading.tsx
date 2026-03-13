import Image from "next/image";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-navy flex items-center justify-center">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-36 h-36 animate-pulse">
          <Image
            src="/image/VULCAN Logo_transparent.png"
            alt="VulcanPrep"
            width={128}
            height={128}
            className="object-contain"
            priority
          />
        </div>
        <p className="text-white/60 text-sm font-medium">VulcanPrep</p>
        <p className="text-white/30 text-xs">Loading...</p>
      </div>
    </div>
  );
}
