import { englishRubricPrompt } from "./rubrics/english";
import { mathRubricPrompt } from "./rubrics/math";
import { aptitudeRubricPrompt } from "./rubrics/aptitude";
import { codingRubricPrompt } from "./rubrics/coding";
import { hrRubricPrompt } from "./rubrics/hr";
import { communicationRubricPrompt } from "./rubrics/communication";
import { generalRubricPrompt } from "./rubrics/general";
import { IRubricCriteria } from "@/lib/db/models/Question";

const RUBRIC_MAP: Record<string, string> = {
  english: englishRubricPrompt,
  math: mathRubricPrompt,
  aptitude: aptitudeRubricPrompt,
  coding: codingRubricPrompt,
  hr: hrRubricPrompt,
  situational: hrRubricPrompt,
  communication: communicationRubricPrompt,
  general: generalRubricPrompt,
};

export function getSystemPrompt(domain: string, customRubric?: IRubricCriteria[]): string {
  let basePrompt = RUBRIC_MAP[domain] || RUBRIC_MAP["aptitude"];

  if (customRubric && customRubric.length > 0) {
    const customSection = customRubric
      .map((c) => `${c.name} (weight: ${c.weight}) — ${c.description}`)
      .join("\n");
    basePrompt += `\n\nCUSTOM RUBRIC OVERRIDE (use these criteria INSTEAD of the defaults above):\n${customSection}`;
  }

  return basePrompt;
}

export function getDomainFromString(domain: string): string {
  const normalized = domain.toLowerCase().trim();
  if (RUBRIC_MAP[normalized]) return normalized;
  // Fuzzy matching
  if (normalized.includes("english") || normalized.includes("letter") || normalized.includes("writing")) return "english";
  if (normalized.includes("math") || normalized.includes("quant")) return "math";
  if (normalized.includes("aptitude") || normalized.includes("logic") || normalized.includes("reasoning")) return "aptitude";
  if (normalized.includes("code") || normalized.includes("coding") || normalized.includes("programming")) return "coding";
  if (normalized.includes("hr") || normalized.includes("behavior") || normalized.includes("interview")) return "hr";
  if (normalized.includes("communicat") || normalized.includes("speaking") || normalized.includes("presentation")) return "communication";
  if (normalized.includes("general")) return "general";
  return "aptitude"; // safe fallback
}
