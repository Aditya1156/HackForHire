import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import Question from "@/lib/db/models/Question";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { calculateAIRS } from "@/lib/scoring/airs";
import { callAIForJSON } from "@/lib/ai/client";

interface OverallFeedback {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

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

    const test = await Test.findById(id);
    if (!test) return errorResponse("Test not found", 404);
    if (String(test.userId) !== user.userId) return errorResponse("Access denied", 403);
    if (test.status !== "in-progress") return errorResponse("Test is already completed", 400);

    // Fetch all question documents for domain grouping
    const questionIds = test.questions.map((q) => q.questionId);
    const questionDocs = await Question.find({ _id: { $in: questionIds } })
      .select("domain rubric")
      .lean();

    const questionMap = new Map(questionDocs.map((q) => [String(q._id), q]));

    // Calculate total score and per-domain scores
    let totalScore = 0;
    let maxTotalScore = 0;
    const domainMap = new Map<string, { score: number; maxScore: number }>();

    for (const tq of test.questions) {
      const qDoc = questionMap.get(String(tq.questionId));
      const domain = qDoc?.domain ?? test.domain ?? "general";
      const score = tq.aiEvaluation?.score ?? 0;
      const maxScore = tq.aiEvaluation?.maxScore ?? qDoc?.rubric?.maxScore ?? 0;

      totalScore += score;
      maxTotalScore += maxScore;

      const existing = domainMap.get(domain) ?? { score: 0, maxScore: 0 };
      domainMap.set(domain, {
        score: existing.score + score,
        maxScore: existing.maxScore + maxScore,
      });
    }

    const scores = Array.from(domainMap.entries()).map(([domain, vals]) => ({
      domain,
      score: vals.score,
      maxScore: vals.maxScore,
    }));

    // Generate overall AI feedback
    let feedback: OverallFeedback = { strengths: [], weaknesses: [], recommendations: [] };

    try {
      const summaryLines = test.questions.map((tq, i) => {
        const qDoc = questionMap.get(String(tq.questionId));
        return `Q${i + 1} [${qDoc?.domain ?? "general"}]: Score ${tq.aiEvaluation?.score ?? 0}/${tq.aiEvaluation?.maxScore ?? 0}. Answer: "${(tq.answer || "").slice(0, 200)}". Feedback: ${tq.aiEvaluation?.feedback ?? ""}`;
      });

      const systemPrompt = `You are an expert educational assessment AI. Analyze a student's overall test performance and provide concise, actionable feedback. Return ONLY valid JSON.`;
      const userMessage = `Test domain: ${test.domain}. Overall score: ${totalScore}/${maxTotalScore}.

Per-question breakdown:
${summaryLines.join("\n")}

Return JSON exactly:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

      feedback = await callAIForJSON<OverallFeedback>(systemPrompt, userMessage, {
        maxTokens: 800,
      });
    } catch (aiError) {
      console.error("Overall feedback generation failed:", aiError);
      // Provide fallback feedback
      const pct = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
      feedback = {
        strengths: pct >= 70 ? ["Demonstrated solid understanding of core concepts"] : ["Attempted all questions"],
        weaknesses: pct < 70 ? ["Needs improvement in key concept areas"] : [],
        recommendations: ["Review the per-question feedback for targeted improvement areas"],
      };
    }

    // Calculate AIRS score based on domain performance
    const domainScoreMap = new Map(scores.map((s) => [s.domain, s.maxScore > 0 ? (s.score / s.maxScore) * 100 : 0]));

    const airsInput = {
      resumeScore: 50, // default — not available in test mode
      communicationScore: Math.round(
        (domainScoreMap.get("english") ?? domainScoreMap.get("hr") ?? (totalScore / Math.max(maxTotalScore, 1)) * 100)
      ),
      technicalScore: Math.round(
        (domainScoreMap.get("aptitude") ?? domainScoreMap.get("math") ?? (totalScore / Math.max(maxTotalScore, 1)) * 100)
      ),
      codingScore: Math.round(
        (domainScoreMap.get("coding") ?? (totalScore / Math.max(maxTotalScore, 1)) * 100)
      ),
      problemSolvingScore: Math.round(
        (domainScoreMap.get("aptitude") ?? domainScoreMap.get("situational") ?? (totalScore / Math.max(maxTotalScore, 1)) * 100)
      ),
      toneScore: Math.round(
        (domainScoreMap.get("hr") ?? (totalScore / Math.max(maxTotalScore, 1)) * 100)
      ),
    };

    const airsScore = calculateAIRS(airsInput);

    // Update test
    test.status = "completed";
    test.completedAt = new Date();
    test.totalScore = totalScore;
    test.maxTotalScore = maxTotalScore;
    test.scores = scores;
    test.airsScore = airsScore;
    test.feedback = feedback;

    await test.save();

    return successResponse({
      test: {
        _id: test._id,
        status: test.status,
        totalScore,
        maxTotalScore,
        percentage: maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0,
        airsScore,
        scores,
        feedback,
        completedAt: test.completedAt,
      },
    });
  } catch (error) {
    console.error("POST /api/tests/[id]/complete error:", error);
    return errorResponse("Failed to complete test", 500);
  }
}
