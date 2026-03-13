"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn, X, ExternalLink } from "lucide-react";

interface ImageViewerProps {
  src: string;
  alt?: string;
  caption?: string;
  className?: string;
}

export function ImageViewer({ src, alt = "Question image", caption, className = "" }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`bg-gray-100 border border-gray-200 rounded-lg p-4 text-center ${className}`}>
        <p className="text-sm text-gray-500">Image could not be loaded</p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-1"
        >
          <ExternalLink className="w-3 h-3" />
          Open in new tab
        </a>
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail */}
      <div
        className={`relative cursor-pointer group rounded-lg overflow-hidden border border-gray-200 ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <div className="relative w-full" style={{ minHeight: 120 }}>
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg" />
          )}
          <img
            src={src}
            alt={alt}
            className={`w-full h-auto max-h-64 object-contain rounded-lg transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all duration-200 rounded-lg">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {caption && (
          <p className="text-xs text-gray-500 text-center mt-1 px-2 pb-1">{caption}</p>
        )}
      </div>

      {/* Lightbox modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {caption && (
              <p className="text-white/70 text-sm text-center mt-3">{caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
