import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import Question from "@/lib/db/models/Question";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { submitAnswerSchema } from "@/lib/utils/validation";
import { evaluateAnswer } from "@/lib/ai/evaluator";
import { executeCode } from "@/lib/code/executor";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authResult = await requireAuth(["student"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const validation = await validateBody(req, submitAnswerSchema);
    if ("error" in validation) return validation as never;
    const { data } = validation as { data: typeof submitAnswerSchema._type };

    // Find test — must belong to user and be in-progress
    const test = await Test.findById(id);
    if (!test) return errorResponse("Test not found", 404);
    if (String(test.userId) !== user.userId) return errorResponse("Access denied", 403);
    if (test.status !== "in-progress") return errorResponse("Test is no longer in progress", 400);

    // Find question index in test
    const qIndex = test.questions.findIndex(
      (q) => String(q.questionId) === data.questionId
    );
    if (qIndex === -1) return errorResponse("Question not found in this test", 404);

    // Fetch full question document for evaluation
    const question = await Question.findById(data.questionId).lean();
    if (!question) return errorResponse("Question document not found", 404);

    // Update answer fields
    test.questions[qIndex].answer = data.answer;
    test.questions[qIndex].answeredAt = new Date();
    if (data.voiceTranscript) {
      test.questions[qIndex].voiceTranscript = data.voiceTranscript;
    }

    // Handle code submission + execution
    let codeExecutionResults:
      | { passed: number; total: number; results: { input: string; expected: string; actual: string; passed: boolean }[] }
      | undefined;

    if (data.codeSubmission && question.testCases && question.testCases.length > 0) {
      try {
        const execResult = await executeCode(
          data.codeSubmission.code,
          data.codeSubmission.language,
          question.testCases
        );
        codeExecutionResults = execResult;
        test.questions[qIndex].codeSubmission = {
          code: data.codeSubmission.code,
          language: data.codeSubmission.language,
          testResults: { passed: execResult.passed, total: execResult.total },
        };
      } catch (execError) {
        console.error("Code execution failed:", execError);
        test.questions[qIndex].codeSubmission = {
          code: data.codeSubmission.code,
          language: data.codeSubmission.language,
          testResults: { passed: 0, total: question.testCases.length },
        };
      }
    } else if (data.codeSubmission) {
      test.questions[qIndex].codeSubmission = {
        code: data.codeSubmission.code,
        language: data.codeSubmission.language,
        testResults: { passed: 0, total: 0 },
      };
    }

    // Determine the best answer text for evaluation (voice transcript preferred if available)
    const answerForEval =
      data.voiceTranscript && data.voiceTranscript.trim()
        ? data.voiceTranscript
        : data.answer;

    let aiEval;

    // MCQ: deterministic check against correct option — no AI needed
    if (question.type === "mcq" && question.content.options?.length) {
      const correctOption = question.content.options.find((o: any) => o.isCorrect);
      const studentLabel = (data.answer || "").trim().toUpperCase();
      const isCorrect = correctOption && correctOption.label.toUpperCase() === studentLabel;
      const maxScore = question.rubric?.maxScore ?? 10;

      aiEval = {
        score: isCorrect ? maxScore : 0,
        maxScore,
        feedback: isCorrect
          ? "Correct answer!"
          : `Incorrect. The correct answer is ${correctOption?.label}: ${correctOption?.text}.`,
        explanation: isCorrect ? "Student selected the correct option." : `Student selected ${studentLabel || "nothing"}, but the correct answer was ${correctOption?.label}.`,
        criteriaScores: [
          {
            name: "Correctness",
            score: isCorrect ? maxScore : 0,
            maxScore,
            comment: isCorrect ? "Correct" : `Expected ${correctOption?.label}, got ${studentLabel || "no answer"}`,
          },
        ],
      };
    }
    // Fill-in-blanks: deterministic proportional scoring
    else if (question.answerFormat === "fill_in_blanks" && question.content.blanks?.length) {
      const blanks = question.content.blanks as { id: number; correctAnswer: string }[];
      const maxScore = question.rubric?.maxScore ?? 10;
      const perBlank = maxScore / blanks.length;
      let earned = 0;
      const details: { name: string; score: number; maxScore: number; comment: string }[] = [];

      for (const blank of blanks) {
        const studentVal = (data.blanksAnswers?.[String(blank.id)] || "").trim().toLowerCase();
        const correct = blank.correctAnswer.trim().toLowerCase();
        const match = studentVal === correct;
        const blankScore = match ? perBlank : 0;
        earned += blankScore;
        details.push({
          name: `Blank #${blank.id}`,
          score: Math.round(blankScore * 100) / 100,
          maxScore: Math.round(perBlank * 100) / 100,
          comment: match ? "Correct" : `Expected "${blank.correctAnswer}", got "${studentVal || "(empty)"}"`,
        });
      }

      aiEval = {
        score: Math.round(earned * 100) / 100,
        maxScore,
        feedback: earned === maxScore
          ? "All blanks correct!"
          : `${details.filter((d) => d.score > 0).length}/${blanks.length} blanks correct.`,
        explanation: `Fill-in-blanks evaluation: ${details.filter((d) => d.score > 0).length} out of ${blanks.length} blanks answered correctly.`,
        criteriaScores: details,
      };
    }
    // All other types: evaluate with AI
    else {
      aiEval = await evaluateAnswer({
        question: {
          content: question.content,
          domain: question.domain,
          rubric: question.rubric,
          expectedAnswer: question.expectedAnswer,
        },
        studentAnswer: answerForEval || "(no answer provided)",
        codeExecutionResults,
      });
    }

    test.questions[qIndex].aiEvaluation = aiEval;

    await test.save();

    return successResponse({
      evaluation: aiEval,
      codeResults: codeExecutionResults
        ? {
            passed: codeExecutionResults.passed,
            total: codeExecutionResults.total,
            results: codeExecutionResults.results,
          }
        : undefined,
    });
  } catch (error) {
    console.error("POST /api/tests/[id]/answer error:", error);
    return errorResponse("Failed to submit answer", 500);
  }
}
