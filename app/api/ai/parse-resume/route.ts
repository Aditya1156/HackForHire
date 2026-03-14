import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { parseResume } from "@/lib/ai/resume-parser";

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["student", "teacher", "admin"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const contentType = req.headers.get("content-type") || "";
    let resumeText: string;
    let save = false;

    if (contentType.includes("multipart/form-data")) {
      // File upload — extract text from PDF server-side
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      save = formData.get("save") === "true";

      if (!file) {
        return errorResponse("No file uploaded", 400);
      }

      const name = file.name.toLowerCase();
      if (!name.endsWith(".pdf") && !name.endsWith(".docx") && !name.endsWith(".doc") && !name.endsWith(".txt")) {
        return errorResponse("Unsupported file type. Upload PDF, DOCX, or TXT.", 400);
      }

      if (file.size > 5 * 1024 * 1024) {
        return errorResponse("File size must be under 5MB", 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      if (name.endsWith(".pdf")) {
        resumeText = await extractTextFromPDF(buffer);
      } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        resumeText = result.value;
      } else {
        resumeText = buffer.toString("utf-8");
      }
    } else {
      // JSON body — legacy support for plain text resumes
      const body = await req.json();
      resumeText = body.resumeText;
      save = body.save ?? false;
    }

    if (!resumeText || resumeText.trim().length < 10) {
      return errorResponse("Could not extract text from file. The file may be empty or image-based.", 400);
    }

    const parsed = await parseResume(resumeText);

    // Optionally persist parsed resume to user document
    if (save) {
      await User.findByIdAndUpdate(user.userId, {
        $set: {
          "resume.parsed": {
            skills: parsed.skills,
            projects: parsed.projects,
            experience: parsed.experience,
            domain: parsed.domain,
            education: parsed.education,
          },
        },
      });
    }

    return successResponse({ parsed, extractedText: resumeText });
  } catch (error) {
    console.error("POST /api/ai/parse-resume error:", error);
    return errorResponse("Failed to parse resume", 500);
  }
}
