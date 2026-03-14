import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Question from "@/lib/db/models/Question";
import QuestionFolder from "@/lib/db/models/QuestionFolder";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { callAIForJSON } from "@/lib/ai/client";
import { getDefaultRubric } from "@/lib/ai/rubric-templates";
import mongoose from "mongoose";

// Extract text from uploaded file
async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (name.endsWith(".txt") || name.endsWith(".text")) {
    return buffer.toString("utf-8");
  }

  throw new Error("Unsupported file type. Upload PDF, DOCX, DOC, or TXT.");
}

interface GeneratedQuestion {
  domain: string;
  type: string;
  difficulty: string;
  answerFormat: string;
  content: {
    text: string;
    instructions?: string;
    wordLimit?: string;
    options?: { label: string; text: string; isCorrect: boolean }[];
    blanks?: { id: number; correctAnswer: string }[];
    matchingPairs?: { id: number; item: string; correctMatch: string }[];
    multiSelectCorrect?: string[];
  };
  expectedAnswer?: string;
  testCases?: { input: string; expectedOutput: string }[];
  tags: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// MASTER PROMPT — handles ALL question types from any document/exam paper
// ═══════════════════════════════════════════════════════════════════════
const MASTER_PROMPT = `You are an expert exam question parser. Your job is to read a question paper/document and convert EVERY question into structured JSON — preserving exact question numbers, exact text, and detecting the correct format automatically.

═══ HOW TO DETECT QUESTION FORMAT ═══

1. FILL-IN-THE-BLANKS (answerFormat: "fill_in_blanks")
   Trigger: "Complete the notes/table/sentences/summary", "Write NO MORE THAN X WORDS"
   - Each blank = one entry in "blanks" array
   - Use the ORIGINAL question number as the blank ID (e.g. Q11 → id:11, Q31 → id:31)
   - The "text" field = the full sentence with ___N___ where the blank is
   - Include "wordLimit" from the instructions
   - "correctAnswer" = "" (empty — admin fills later)

   Example from document:
     "Questions 11-17: Complete the table. Write NO MORE THAN TWO WORDS."
     "The tutor's new room number is ___"

   Output:
   {
     "type": "audio", "answerFormat": "fill_in_blanks",
     "content": {
       "text": "Complete the notes below.\\n\\nThe tutor's new room number is ___21___\\nThe tutorial time is at ___22___\\nThe reason for the student to see his tutor is to ___23___\\nThe student's trouble is to have many ___24___ to read.",
       "instructions": "Complete the notes below.",
       "wordLimit": "NO MORE THAN THREE WORDS AND/OR A NUMBER",
       "blanks": [
         {"id": 21, "correctAnswer": ""},
         {"id": 22, "correctAnswer": ""},
         {"id": 23, "correctAnswer": ""},
         {"id": 24, "correctAnswer": ""}
       ]
     }
   }

2. MATCHING / DROPDOWN (answerFormat: "matching")
   Trigger: "Choose your answer", "write the letters A-F next to Questions"
   - Each item to match = one entry in "matchingPairs" (use original Q number as ID)
   - The available choices (A-F) = entries in "options" array
   - "correctMatch" = "" (empty — admin fills later)

   Example:
     "Q25-28: Choose A-F. What recommendations about reference books?"
     "25. Bayer  26. Oliver  27. Billy  28. Andrew"
     "A. All  B. Research method  C. Main Body  D. Conclusion  E. Avoid  F. Argument"

   Output:
   {
     "type": "audio", "answerFormat": "matching",
     "content": {
       "text": "What recommendations does the tutor make about the reference books?\\nChoose your answer and write the letters A-F next to Questions 25-28.",
       "instructions": "Choose your answer below and write the letters, A-F, next to Questions 25-28.",
       "options": [
         {"label": "A", "text": "All", "isCorrect": false},
         {"label": "B", "text": "Research method", "isCorrect": false},
         {"label": "C", "text": "Main Body", "isCorrect": false},
         {"label": "D", "text": "Conclusion", "isCorrect": false},
         {"label": "E", "text": "Avoid", "isCorrect": false},
         {"label": "F", "text": "Argument", "isCorrect": false}
       ],
       "matchingPairs": [
         {"id": 25, "item": "Bayer", "correctMatch": ""},
         {"id": 26, "item": "Oliver", "correctMatch": ""},
         {"id": 27, "item": "Billy", "correctMatch": ""},
         {"id": 28, "item": "Andrew", "correctMatch": ""}
       ]
     }
   }

3. MULTI-SELECT / CHOOSE TWO (answerFormat: "multi_select")
   Trigger: "Choose TWO letters", "Choose THREE letters"
   - All choices go in "options"
   - "multiSelectCorrect" = [] (empty — admin fills later)

   Example:
     "Q29-30: Choose TWO letters A-E. Which TWO points does the tutor warn about?"

   Output:
   {
     "type": "audio", "answerFormat": "multi_select",
     "content": {
       "text": "Which TWO of the following points does the tutor warn student's research work?",
       "instructions": "Choose TWO letters, A-E.",
       "options": [
         {"label": "A", "text": "interviewees", "isCorrect": false},
         {"label": "B", "text": "make data clearly", "isCorrect": false},
         {"label": "C", "text": "time arrangement", "isCorrect": false},
         {"label": "D", "text": "reference books", "isCorrect": false},
         {"label": "E", "text": "questionnaire design", "isCorrect": false}
       ],
       "multiSelectCorrect": []
     }
   }

4. STANDARD MCQ (answerFormat: "mcq")
   Trigger: "Choose the correct answer", single correct option A-D
   - Exactly 4 options, mark isCorrect only if answer is known

5. TABLE COMPLETION (answerFormat: "fill_in_blanks")
   Trigger: "Complete the table below"
   - Format the table as readable text with blanks numbered sequentially
   - Each cell that needs filling = one blank entry

   Example from Part 2 table:
   {
     "type": "audio", "answerFormat": "fill_in_blanks",
     "content": {
       "text": "Complete the table below.\\n\\nTennis - Number of teams: ___11___\\nSoccer - Age: Up to ___12___\\nTennis - Location: ___13___ (Tennis: court 2)\\nSoccer - Location: ___14___\\nTennis - Date: ___15___\\nTennis - Contact: ___16___ (Tennis: George Hansen)\\nSoccer - Contact: ___17___",
       "wordLimit": "NO MORE THAN TWO WORDS AND/OR A NUMBER",
       "blanks": [
         {"id": 11, "correctAnswer": ""},
         {"id": 12, "correctAnswer": ""},
         {"id": 13, "correctAnswer": ""},
         {"id": 14, "correctAnswer": ""},
         {"id": 15, "correctAnswer": ""},
         {"id": 16, "correctAnswer": ""},
         {"id": 17, "correctAnswer": ""}
       ]
     }
   }

6. TEXT / ESSAY (answerFormat: "text")
   Trigger: Open-ended, short answer, essay
7. CODE (answerFormat: "code")
   Trigger: Programming questions

═══ CRITICAL RULES ═══

1. PRESERVE original question numbers (Q11 → id:11, Q31 → id:31)
2. ONE JSON object per question GROUP (e.g. Q21-24 = one fill_in_blanks object with 4 blanks, Q25-28 = one matching object with 4 pairs)
3. For listening/IELTS papers: set type = "audio" for ALL questions
4. Leave ALL correctAnswer/correctMatch EMPTY — the admin will fill answers later
5. Detect the EXACT instructions (wordLimit, etc.) from the document
6. For tables: read the table structure and identify which cells are blanks
7. Include relevant tags like the Part number, topic, etc.
8. DOMAIN: for IELTS/English tests use "english", for math use "math", etc.
9. Return ONLY a valid JSON array — no markdown, no explanation, no backticks

═══ OUTPUT FORMAT ═══
Return a JSON array where each element has:
{
  "domain": "english|math|aptitude|coding|hr|situational|general|communication",
  "type": "audio|text|mcq|code",
  "difficulty": "easy|medium|hard",
  "answerFormat": "fill_in_blanks|matching|multi_select|mcq|text|code",
  "content": {
    "text": "...",
    "instructions": "...",
    "wordLimit": "...",
    "options": [...],
    "blanks": [...],
    "matchingPairs": [...],
    "multiSelectCorrect": [...]
  },
  "expectedAnswer": "",
  "tags": ["Part 3", "listening", "tutorial"]
}`;

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["admin"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const formData = await req.formData();

    // Support multiple file uploads
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "file" && value instanceof File) {
        files.push(value);
      }
    }

    const folderId = formData.get("folderId") as string | null;
    const folderName = formData.get("folderName") as string | null;
    const folderDomain = formData.get("folderDomain") as string || "general";
    const audioUrl = formData.get("audioUrl") as string || "";
    const folderTags = formData.get("folderTags") as string || "";
    const folderPublished = formData.get("isPublished") as string;

    if (files.length === 0) {
      return errorResponse("No file uploaded", 400);
    }

    // Extract text from all files
    let allText = "";
    for (const file of files) {
      try {
        const text = await extractText(file);
        allText += `\n\n--- File: ${file.name} ---\n${text}`;
      } catch (err: any) {
        return errorResponse(`Error reading ${file.name}: ${err.message}`, 400);
      }
    }

    if (allText.trim().length < 30) {
      return errorResponse("File content is too short or empty", 400);
    }

    // Truncate very long documents
    const maxChars = 20000;
    const truncated = allText.length > maxChars
      ? allText.substring(0, maxChars) + "\n\n[Document truncated...]"
      : allText;

    // Create or use existing folder
    let targetFolderId: string;

    if (folderId) {
      const folder = await QuestionFolder.findById(folderId);
      if (!folder) return errorResponse("Folder not found", 404);
      targetFolderId = folderId;
    } else {
      const name = folderName || files.map(f => f.name.replace(/\.(pdf|docx?|txt)$/i, "")).join(" + ").replace(/[_-]/g, " ");
      const parsedTags = folderTags ? folderTags.split(",").map(t => t.trim()).filter(Boolean) : [];
      const newFolder = await QuestionFolder.create({
        name,
        domain: folderDomain,
        description: `Auto-generated from: ${files.map(f => f.name).join(", ")}`,
        tags: parsedTags,
        questionCount: 0,
        fetchCount: 10,
        isPublished: folderPublished !== "false",
        createdBy: new mongoose.Types.ObjectId(user.userId),
      });
      targetFolderId = newFolder._id.toString();
    }

    // Call AI with master prompt
    const audioHint = audioUrl
      ? `\n\nThis is a LISTENING TEST. An audio file is provided. Set type="audio" for ALL questions.`
      : "";
    const userMessage = `Parse this exam paper and convert ALL questions to structured JSON. Each question group (e.g. Q11-17, Q18-20, Q21-24) = ONE JSON object.${audioHint}\n\nDOCUMENT:\n${truncated}`;

    let questions: GeneratedQuestion[];
    try {
      questions = await callAIForJSON<GeneratedQuestion[]>(
        MASTER_PROMPT,
        userMessage,
        { maxTokens: 8000, retries: 2 }
      );
    } catch (err: any) {
      console.error("AI generation failed:", err);
      return errorResponse("AI failed to parse questions. Please try again.", 500);
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return errorResponse("AI returned no valid questions", 500);
    }

    // Validate and prepare for insertion
    const validDomains = ["english", "math", "aptitude", "coding", "hr", "situational", "general", "communication"];
    const validTypes = ["text", "image", "audio", "voice", "code", "letter_writing", "mcq", "mixed"];
    const validFormats = ["text", "code", "file", "voice", "mcq", "fill_in_blanks", "matching", "multi_select"];
    const validDifficulties = ["easy", "medium", "hard"];

    const createdBy = new mongoose.Types.ObjectId(user.userId);
    const docs = questions.map((q) => {
      const domain = validDomains.includes(q.domain) ? q.domain : "general";
      const type = validTypes.includes(q.type) ? q.type : "text";
      const difficulty = validDifficulties.includes(q.difficulty) ? q.difficulty : "medium";
      const answerFormat = validFormats.includes(q.answerFormat) ? q.answerFormat : "text";

      const rubric = getDefaultRubric(domain, type);

      return {
        folderId: new mongoose.Types.ObjectId(targetFolderId),
        domain,
        type,
        difficulty,
        answerFormat,
        content: {
          text: q.content.text,
          instructions: q.content.instructions || "",
          wordLimit: q.content.wordLimit || "",
          audioUrl: audioUrl || "",
          options: q.content.options || [],
          blanks: q.content.blanks || [],
          matchingPairs: q.content.matchingPairs || [],
          multiSelectCorrect: q.content.multiSelectCorrect || [],
        },
        rubric: {
          criteria: rubric.criteria,
          maxScore: answerFormat === "mcq" ? 1 : (q.content.blanks?.length || q.content.matchingPairs?.length || 1) * 1,
          gradingLogic: rubric.gradingLogic,
        },
        expectedAnswer: q.expectedAnswer || "",
        testCases: q.testCases || [],
        tags: q.tags || [],
        createdBy,
      };
    });

    const created = await Question.insertMany(docs);

    // Collect unique tags and format types in a single pass
    const allTags = new Set<string>(["ai-generated"]);
    for (const q of questions) {
      if (q.tags) q.tags.forEach((t: string) => allTags.add(t));
      if (q.answerFormat) allTags.add(q.answerFormat.replace(/_/g, " "));
    }

    await QuestionFolder.findByIdAndUpdate(targetFolderId, {
      $inc: { questionCount: created.length },
      $addToSet: { tags: { $each: Array.from(allTags) } },
    });

    return successResponse({
      message: `Parsed ${created.length} question groups from ${files.length} file(s)`,
      folderId: targetFolderId,
      questionsCreated: created.length,
      questions: created,
      extractedTextPreview: truncated.substring(0, 500) + "...",
    }, 201);

  } catch (error) {
    console.error("POST /api/questions/auto-generate error:", error);
    return errorResponse("Failed to auto-generate questions", 500);
  }
}
