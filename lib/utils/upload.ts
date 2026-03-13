/**
 * Upload utility — handles file uploads and PDF text extraction
 * Uses pdf-parse to extract raw text from uploaded resume PDFs
 */

// Dynamically import pdf-parse to avoid issues with Next.js SSR
async function getPdfParse() {
  const pdfParse = await import("pdf-parse");
  return pdfParse.default;
}

/**
 * Extract text content from a PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await getPdfParse();
    const data = await pdfParse(buffer);
    return data.text.trim();
  } catch (error) {
    console.error("PDF extraction failed:", error);
    throw new Error("Failed to extract text from PDF. Please ensure the file is a valid PDF.");
  }
}

/**
 * Convert a File/Blob from FormData to a Buffer
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Validate uploaded file
 */
export function validateUploadedFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const maxSizeMB = options.maxSizeMB ?? 5;
  const allowedTypes = options.allowedTypes ?? ["application/pdf"];

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Parse resume from FormData request (multipart/form-data)
 */
export async function parseResumeFromRequest(request: Request): Promise<{
  resumeText: string;
  fileName: string;
}> {
  const formData = await request.formData();
  const file = formData.get("resume") as File | null;

  if (!file) {
    throw new Error("No resume file provided");
  }

  const validation = validateUploadedFile(file, {
    maxSizeMB: 5,
    allowedTypes: ["application/pdf"],
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const buffer = await fileToBuffer(file);
  const resumeText = await extractTextFromPDF(buffer);

  if (!resumeText || resumeText.length < 50) {
    throw new Error(
      "Could not extract meaningful text from the PDF. Please ensure it contains readable text (not a scanned image)."
    );
  }

  return {
    resumeText,
    fileName: file.name,
  };
}
