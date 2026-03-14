import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/proxy/audio?url=<encoded-url>
 *
 * Proxies audio from Google Drive (or any external URL) to bypass
 * CORS and hotlink restrictions. Streams the response back with
 * proper audio headers so <audio> elements can play it.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Convert Google Drive share links to direct download
  let directUrl = url;
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (fileMatch) {
    directUrl = `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
  }
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) {
    directUrl = `https://drive.google.com/uc?export=download&id=${openMatch[1]}`;
  }

  try {
    // Follow redirects (Google Drive often redirects through confirmation pages)
    let response = await fetch(directUrl, { redirect: "follow" });

    // Handle Google Drive virus scan confirmation page
    if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
      const html = await response.text();
      const confirmMatch = html.match(/confirm=([^&"]+)/);
      if (confirmMatch && fileMatch) {
        const confirmUrl = `https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${fileMatch[1]}`;
        response = await fetch(confirmUrl, { redirect: "follow" });
      } else if (confirmMatch && openMatch) {
        const confirmUrl = `https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${openMatch[1]}`;
        response = await fetch(confirmUrl, { redirect: "follow" });
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch audio" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    const contentLength = response.headers.get("content-length");
    const body = response.body;

    if (!body) {
      return NextResponse.json({ error: "Empty response from source" }, { status: 502 });
    }

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
      "Accept-Ranges": "bytes",
    };
    if (contentLength) headers["Content-Length"] = contentLength;

    return new NextResponse(body, { status: 200, headers });
  } catch (error) {
    console.error("Audio proxy error:", error);
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}
