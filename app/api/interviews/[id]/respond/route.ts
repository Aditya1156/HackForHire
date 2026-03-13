import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Interview from "@/lib/db/models/Interview";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { interviewRespondSchema } from "@/lib/utils/validation";
import { evaluateAnswer } from "@/lib/ai/evaluator";
import { generateFollowUp } from "@/lib/ai/follow-up";
import { generateResumeQuestions } from "@/lib/ai/question-generator";

const HR_RUBRIC = {
  criteria: [
    { name: "Relevance", weight: 0.3, description: "Answer directly addresses the question" },
    { name: "Depth", weight: 0.3, description: "Shows genuine understanding and insight" },
    { name: "Communication", weight: 0.2, description: "Clear, structured, professional delivery" },
    { name: "Examples", weight: 0.2, description: "Uses concrete examples or STAR method" },
  ],
  maxScore: 10,
  gradingLogic: "Evaluate the candidate's answer holistically for an interview context.",
};

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

    const validation = await validateBody(req, interviewRespondSchema);
    if (validation instanceof NextResponse) return validation;
    const { data } = validation as { data: typeof interviewRespondSchema._type };

    const interview = await Interview.findById(id);
    if (!interview) return errorResponse("Interview not found", 404);
    if (String(interview.userId) !== user.userId)
      return errorResponse("Unauthorized", 403);
    if (interview.status !== "active")
      return errorResponse("Interview is not active", 400);

    // Add candidate answer to history
    interview.conversationHistory.push({
      role: "candidate",
      content: data.voiceTranscript || data.answer,
      timestamp: new Date(),
    });

    // Find the last interviewer question
    const historyArr = interview.conversationHistory;
    let lastQuestion = "Tell me about yourself.";
    for (let i = historyArr.length - 2; i >= 0; i--) {
      if (historyArr[i].role === "interviewer") {
        lastQuestion = historyArr[i].content;
        break;
      }
    }

    // Evaluate answer with HR rubric
    const evaluation = await evaluateAnswer({
      question: {
        content: { text: lastQuestion },
        domain: "hr",
        rubric: HR_RUBRIC,
        expectedAnswer: undefined,
      },
      studentAnswer: data.voiceTranscript || data.answer,
    });

    // Adaptive logic: count exchanges (candidate messages)
    const candidateCount = historyArr.filter((h) => h.role === "candidate").length;
    const isComplete = candidateCount >= 8;

    let nextQuestion = "";
    if (!isComplete) {
      const questionsQueue: string[] =
        (interview.resumeContext as any)?._questionsQueue ?? [];

      // 60% chance of follow-up if < 8 exchanges
      const doFollowUp = Math.random() < 0.6;

      if (doFollowUp) {
        const convHistory = historyArr.slice(-6).map((h) => ({
          role: h.role === "interviewer" ? "Interviewer" : "Candidate",
          content: h.content,
        }));
        nextQuestion = await generateFollowUp(lastQuestion, data.answer, convHistory);
      } else if (questionsQueue.length > 0) {
        nextQuestion = questionsQueue.shift()!;
        // Update the queue in resumeContext
        (interview.resumeContext as any)._questionsQueue = questionsQueue;
        interview.markModified("resumeContext");
      } else {
        // Generate a fresh question
        const freshQuestions = await generateResumeQuestions(
          interview.resumeContext as any,
          interview.role,
          2
        );
        nextQuestion = freshQuestions[0] ?? "Can you walk me through a challenging project you worked on?";
      }

      // Add new interviewer question to history
      interview.conversationHistory.push({
        role: "interviewer",
        content: nextQuestion,
        timestamp: new Date(),
      });
    }

    await interview.save();

    return successResponse({
      nextQuestion: isComplete ? null : nextQuestion,
      evaluation: {
        score: evaluation.score,
        maxScore: evaluation.maxScore,
        feedback: evaluation.feedback,
      },
      isComplete,
      exchangeCount: candidateCount,
    });
  } catch (error) {
    console.error("POST /api/interviews/[id]/respond error:", error);
    return errorResponse("Failed to process answer", 500);
  }
}
