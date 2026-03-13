import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Interview from "@/lib/db/models/Interview";
import { authenticateRequest, extractUser } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { callAIForJSON } from "@/lib/ai/client";
import { calculateAIRS, getAIRSBreakdown } from "@/lib/scoring/airs";

interface InterviewAnalysis {
  resumeStrength: number;
  communication: number;
  technicalKnowledge: number;
  codingAbility: number;
  problemSolving: number;
  professionalTone: number;
  strengths: string[];
  weaknesses: string[];
  overallSummary: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authResult = await authenticateRequest(req, ["student"]);
    if (authResult instanceof Response) return authResult as never;
    const user = extractUser(authResult);

    const { id } = await params;

    const interview = await Interview.findById(id);
    if (!interview) return errorResponse("Interview not found", 404);
    if (String(interview.userId) !== user.userId)
      return errorResponse("Unauthorized", 403);
    if (interview.status !== "active")
      return errorResponse("Interview already completed", 400);

    // Build conversation transcript for analysis
    const transcript = interview.conversationHistory
      .map((h) => `${h.role === "interviewer" ? "Interviewer" : "Candidate"}: ${h.content}`)
      .join("\n\n");

    const resumeContext = interview.resumeContext as any;
    const resumeSummary = resumeContext?.name
      ? `Candidate: ${resumeContext.name}, Skills: ${(resumeContext.skills ?? []).join(", ")}, Domain: ${resumeContext.domain}`
      : "No resume provided";

    // Analyze full conversation with Claude
    const analysisSystem = `You are evaluating a complete interview conversation for the role: "${interview.role}".
${resumeSummary}

Return ONLY valid JSON (no markdown, no backticks):
{
  "resumeStrength": <0-100, how well their background matches the role>,
  "communication": <0-100, clarity, structure, professionalism of answers>,
  "technicalKnowledge": <0-100, depth of technical understanding shown>,
  "codingAbility": <0-100, coding skill demonstrated, default 50 if no code>,
  "problemSolving": <0-100, analytical thinking and approach to problems>,
  "professionalTone": <0-100, professional demeanor throughout>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "overallSummary": "<2-3 sentence summary of the candidate's performance>"
}`;

    let analysis: InterviewAnalysis;
    try {
      analysis = await callAIForJSON<InterviewAnalysis>(
        analysisSystem,
        `INTERVIEW TRANSCRIPT:\n\n${transcript}`,
        { maxTokens: 1500 }
      );
    } catch (err) {
      console.error("AI analysis failed, using defaults:", err);
      analysis = {
        resumeStrength: 60,
        communication: 60,
        technicalKnowledge: 60,
        codingAbility: 50,
        problemSolving: 60,
        professionalTone: 65,
        strengths: ["Participated in the interview", "Provided responses to questions"],
        weaknesses: ["Could provide more detailed answers"],
        overallSummary: "The candidate completed the interview session.",
      };
    }

    // Clamp values 0-100
    const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));
    const input = {
      resumeScore: clamp(analysis.resumeStrength),
      communicationScore: clamp(analysis.communication),
      technicalScore: clamp(analysis.technicalKnowledge),
      codingScore: clamp(analysis.codingAbility),
      problemSolvingScore: clamp(analysis.problemSolving),
      toneScore: clamp(analysis.professionalTone),
    };

    const airsTotal = calculateAIRS(input);
    const breakdown = getAIRSBreakdown(input);

    // Save to interview document
    interview.status = "completed";
    interview.airsScore = {
      resumeStrength: breakdown.resumeStrength.score,
      communication: breakdown.communication.score,
      technicalKnowledge: breakdown.technicalKnowledge.score,
      codingAbility: breakdown.codingAbility.score,
      problemSolving: breakdown.problemSolving.score,
      professionalTone: breakdown.professionalTone.score,
      total: airsTotal,
    };

    // Store AI analysis in resumeContext for report page
    (interview.resumeContext as any)._analysis = {
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      overallSummary: analysis.overallSummary,
      rawScores: input,
    };
    interview.markModified("resumeContext");

    await interview.save();

    return successResponse({
      airsScore: airsTotal,
      breakdown: {
        resumeStrength: breakdown.resumeStrength,
        communication: breakdown.communication,
        technicalKnowledge: breakdown.technicalKnowledge,
        codingAbility: breakdown.codingAbility,
        problemSolving: breakdown.problemSolving,
        professionalTone: breakdown.professionalTone,
      },
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      overallSummary: analysis.overallSummary,
    });
  } catch (error) {
    console.error("POST /api/interviews/[id]/end error:", error);
    return errorResponse("Failed to end interview", 500);
  }
}
