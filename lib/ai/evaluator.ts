import { callAIForJSON } from "./client";
import { getSystemPrompt } from "./rubric-switcher";
import { IRubricCriteria } from "@/lib/db/models/Question";
import { IAIEvaluation } from "@/lib/db/models/Test";

interface EvaluationRequest {
  question: {
    content: { text: string; formula?: string };
    domain: string;
    rubric: { criteria: IRubricCriteria[]; maxScore: number; gradingLogic?: string };
    expectedAnswer?: string;
  };
  studentAnswer: string;
  codeExecutionResults?: {
    passed: number;
    total: number;
    results: { input: string; expected: string; actual: string; passed: boolean }[];
  };
}

interface AIEvaluationResponse {
  totalScore: number;
  maxScore: number;
  criteriaScores: { name: string; score: number; maxScore: number; comment: string }[];
  overallFeedback: string;
  strengths?: string[];
  improvements?: string[];
  toneAnalysis?: { detected: string; isAppropriate: boolean; note: string };
  timeComplexity?: string;
  equivalenceNote?: string;
}

export async function evaluateAnswer(req: EvaluationRequest): Promise<IAIEvaluation> {
  const systemPrompt = getSystemPrompt(req.question.domain, req.question.rubric.criteria);

  let userMessage = `QUESTION: ${req.question.content.text}`;
  if (req.question.content.formula) {
    userMessage += `\nFORMULA: ${req.question.content.formula}`;
  }
  if (req.question.expectedAnswer) {
    userMessage += `\nEXPECTED ANSWER (reference): ${req.question.expectedAnswer}`;
  }
  userMessage += `\nMAX SCORE: ${req.question.rubric.maxScore}`;
  userMessage += `\n\n---\n\nSTUDENT'S ANSWER:\n<student_answer>\n${req.studentAnswer}\n</student_answer>`;

  if (req.codeExecutionResults) {
    userMessage += `\n\nCODE EXECUTION RESULTS:`;
    userMessage += `\nTest cases passed: ${req.codeExecutionResults.passed}/${req.codeExecutionResults.total}`;
    if (req.codeExecutionResults.results?.length) {
      req.codeExecutionResults.results.forEach((r, i) => {
        userMessage += `\n  Case ${i + 1}: ${r.passed ? "PASS" : "FAIL"} | Input: ${r.input} | Expected: ${r.expected} | Got: ${r.actual}`;
      });
    }
  }

  try {
    const result = await callAIForJSON<AIEvaluationResponse>(systemPrompt, userMessage);

    return {
      score: Math.min(result.totalScore, req.question.rubric.maxScore),
      maxScore: req.question.rubric.maxScore,
      criteriaScores: result.criteriaScores.map((cs) => ({
        name: cs.name,
        score: cs.score,
        maxScore: cs.maxScore,
        comment: cs.comment,
      })),
      feedback: result.overallFeedback,
      explanation: [
        ...(result.strengths?.map((s) => `✓ ${s}`) ?? []),
        ...(result.improvements?.map((i) => `→ ${i}`) ?? []),
        result.equivalenceNote ? `≡ ${result.equivalenceNote}` : "",
        result.timeComplexity ? `⏱ Time complexity: ${result.timeComplexity}` : "",
        result.toneAnalysis ? `🎭 Tone: ${result.toneAnalysis.detected} — ${result.toneAnalysis.note}` : "",
      ].filter(Boolean).join("\n"),
    };
  } catch (error) {
    console.error("AI evaluation failed:", error);
    return {
      score: 0,
      maxScore: req.question.rubric.maxScore,
      criteriaScores: [],
      feedback: "Evaluation failed. This answer has been flagged for manual review.",
      explanation: "AI evaluation encountered an error. A teacher will review this manually.",
    };
  }
}
