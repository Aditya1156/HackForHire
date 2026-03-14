/**
 * Convert external URLs (audio/images) to usable URLs.
 * Google Drive links are routed through /api/proxy/audio to bypass CORS and hotlink blocks.
 * Local/S3 URLs are returned as-is.
 */
export function toDirectUrl(url: string): string {
  if (!url) return url;

  // Google Drive links → proxy
  if (url.includes("drive.google.com")) {
    return `/api/proxy/audio?url=${encodeURIComponent(url)}`;
  }

  return url;
}
