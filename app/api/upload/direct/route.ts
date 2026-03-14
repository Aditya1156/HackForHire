import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";
import path from "path";
import fs from "fs/promises";

// ── S3 (optional — only used if AWS credentials are set) ──
let s3: any = null;
let PutObjectCommand: any = null;

const USE_S3 = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET);

if (USE_S3) {
  // Dynamic import so the app doesn't crash if @aws-sdk isn't installed
  import("@aws-sdk/client-s3").then((mod) => {
    PutObjectCommand = mod.PutObjectCommand;
    s3 = new mod.S3Client({
      region: process.env.AWS_S3_REGION || "ap-south-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  });
}

const BUCKET = process.env.AWS_S3_BUCKET || "";

// ── Shared config ──
const FOLDER_MAP: Record<string, string> = {
  audio: "audio",
  image: "images",
  video: "video",
};

const ALLOWED_TYPES: Record<string, string[]> = {
  audio: ["audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/webm", "audio/aac", "audio/m4a", "audio/x-m4a"],
  image: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

const MAX_SIZE: Record<string, number> = {
  audio: 50 * 1024 * 1024,
  image: 10 * 1024 * 1024,
  video: 200 * 1024 * 1024,
};

/**
 * POST /api/upload/direct
 *
 * Storage strategy:
 *  - If AWS_S3_BUCKET + credentials are set → uploads to S3
 *  - Otherwise → saves to public/uploads/ (local filesystem)
 *
 * Accepts multipart/form-data: { file, mediaType }
 * Returns: { fileUrl, key }
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "teacher", "student"]);
    if (authResult instanceof NextResponse) return authResult;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mediaType = (formData.get("mediaType") as string) || "audio";

    if (!file) {
      return errorResponse("No file provided", 400);
    }

    if (!FOLDER_MAP[mediaType]) {
      return errorResponse(`Invalid mediaType: ${mediaType}`, 400);
    }

    const fileType = file.type || "application/octet-stream";
    const allowedTypes = ALLOWED_TYPES[mediaType];
    if (!allowedTypes.includes(fileType)) {
      return errorResponse(
        `File type "${fileType}" not allowed for ${mediaType}. Allowed: ${allowedTypes.join(", ")}`,
        400
      );
    }

    const maxSize = MAX_SIZE[mediaType];
    if (file.size > maxSize) {
      return errorResponse(`File too large. Max ${Math.round(maxSize / 1024 / 1024)}MB for ${mediaType}.`, 400);
    }

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const timestamp = Date.now();
    const safeName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50);
    const fileName = `${timestamp}_${safeName}.${ext}`;
    const folder = FOLDER_MAP[mediaType];

    const buffer = Buffer.from(await file.arrayBuffer());

    // ── Upload to S3 ──
    if (USE_S3 && s3 && PutObjectCommand) {
      const key = `${folder}/${fileName}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buffer,
          ContentType: fileType,
        })
      );
      const fileUrl = `https://${BUCKET}.s3.${process.env.AWS_S3_REGION || "ap-south-2"}.amazonaws.com/${key}`;
      return successResponse({ fileUrl, key });
    }

    // ── Local filesystem fallback ──
    const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${folder}/${fileName}`;
    return successResponse({ fileUrl, key: `${folder}/${fileName}` });
  } catch (error) {
    console.error("POST /api/upload/direct error:", error);
    return errorResponse("Failed to upload file", 500);
  }
}
