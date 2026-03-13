import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION || "ap-south-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || "vulcan5678";

// Map media type to S3 folder prefix
const FOLDER_MAP: Record<string, string> = {
  audio: "Audio",
  image: "Images",
  video: "Video",
};

const ALLOWED_TYPES: Record<string, string[]> = {
  audio: ["audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/webm", "audio/aac", "audio/m4a"],
  image: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

const MAX_SIZE: Record<string, number> = {
  audio: 50 * 1024 * 1024,  // 50 MB
  image: 10 * 1024 * 1024,  // 10 MB
  video: 200 * 1024 * 1024, // 200 MB
};

/**
 * POST /api/upload
 * Returns a presigned S3 URL for direct client upload.
 *
 * Body: { fileName: string, fileType: string, mediaType: "audio" | "image" | "video" }
 * Response: { uploadUrl: string, fileUrl: string }
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "teacher", "student"]);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { fileName, fileType, mediaType } = body as {
      fileName: string;
      fileType: string;
      mediaType: string;
    };

    if (!fileName || !fileType || !mediaType) {
      return errorResponse("Missing fileName, fileType, or mediaType", 400);
    }

    if (!FOLDER_MAP[mediaType]) {
      return errorResponse(`Invalid mediaType: ${mediaType}. Must be audio, image, or video.`, 400);
    }

    const allowedTypes = ALLOWED_TYPES[mediaType];
    if (!allowedTypes.includes(fileType)) {
      return errorResponse(`File type "${fileType}" not allowed for ${mediaType}. Allowed: ${allowedTypes.join(", ")}`, 400);
    }

    // Generate unique file key
    const ext = fileName.split(".").pop()?.toLowerCase() || "bin";
    const timestamp = Date.now();
    const safeName = fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50);
    const key = `${FOLDER_MAP[mediaType]}/${timestamp}_${safeName}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 }); // 10 minutes
    const fileUrl = `https://${BUCKET}.s3.${process.env.AWS_S3_REGION || "ap-south-2"}.amazonaws.com/${key}`;

    return successResponse({
      uploadUrl,
      fileUrl,
      key,
      maxSize: MAX_SIZE[mediaType],
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return errorResponse("Failed to generate upload URL", 500);
  }
}
