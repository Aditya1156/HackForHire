export interface AIRSInput {
  resumeScore: number;         // 0-100
  communicationScore: number;  // 0-100
  technicalScore: number;      // 0-100
  codingScore: number;         // 0-100
  problemSolvingScore: number; // 0-100
  toneScore: number;           // 0-100
}

export interface AIRSBreakdown {
  resumeStrength: { score: number; max: 20 };
  communication: { score: number; max: 20 };
  technicalKnowledge: { score: number; max: 25 };
  codingAbility: { score: number; max: 20 };
  problemSolving: { score: number; max: 10 };
  professionalTone: { score: number; max: 5 };
  total: number;
}

export function calculateAIRS(input: AIRSInput): number {
  return Math.round(
    input.resumeScore * 0.20 +
    input.communicationScore * 0.20 +
    input.technicalScore * 0.25 +
    input.codingScore * 0.20 +
    input.problemSolvingScore * 0.10 +
    input.toneScore * 0.05
  );
}

export function getAIRSBreakdown(input: AIRSInput): AIRSBreakdown {
  return {
    resumeStrength: { score: Math.round(input.resumeScore * 0.20), max: 20 },
    communication: { score: Math.round(input.communicationScore * 0.20), max: 20 },
    technicalKnowledge: { score: Math.round(input.technicalScore * 0.25), max: 25 },
    codingAbility: { score: Math.round(input.codingScore * 0.20), max: 20 },
    problemSolving: { score: Math.round(input.problemSolvingScore * 0.10), max: 10 },
    professionalTone: { score: Math.round(input.toneScore * 0.05), max: 5 },
    total: calculateAIRS(input),
  };
}

export function getAIRSGrade(score: number): { grade: string; label: string; color: string } {
  if (score >= 90) return { grade: "A+", label: "Exceptional", color: "text-green-600" };
  if (score >= 80) return { grade: "A", label: "Excellent", color: "text-green-500" };
  if (score >= 70) return { grade: "B+", label: "Very Good", color: "text-blue-600" };
  if (score >= 60) return { grade: "B", label: "Good", color: "text-blue-500" };
  if (score >= 50) return { grade: "C", label: "Average", color: "text-yellow-600" };
  if (score >= 40) return { grade: "D", label: "Below Average", color: "text-orange-500" };
  return { grade: "F", label: "Needs Improvement", color: "text-red-500" };
}
