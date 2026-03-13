/**
 * Deterministic rubric templates per domain/type.
 * Used to auto-generate rubric criteria when admin doesn't provide custom ones.
 */

interface RubricCriteria {
  name: string;
  weight: number;
  description: string;
}

interface RubricTemplate {
  criteria: RubricCriteria[];
  gradingLogic: string;
}

const ENGLISH_TEMPLATE: RubricTemplate = {
  criteria: [
    { name: "Structure & Format", weight: 0.25, description: "Follows the expected format and structure" },
    { name: "Grammar & Language", weight: 0.25, description: "Grammatically correct with proper punctuation" },
    { name: "Tone & Register", weight: 0.20, description: "Appropriate tone for the context" },
    { name: "Content Completeness", weight: 0.20, description: "Addresses all parts of the question" },
    { name: "Vocabulary & Expression", weight: 0.10, description: "Appropriate and varied vocabulary" },
  ],
  gradingLogic: "Evaluate writing quality, format adherence, and communication effectiveness. Award partial credit for good structure even if grammar is weak.",
};

const MATH_TEMPLATE: RubricTemplate = {
  criteria: [
    { name: "Final Answer Accuracy", weight: 0.40, description: "Is the final answer correct" },
    { name: "Logical Steps", weight: 0.30, description: "Are intermediate steps logically sound" },
    { name: "Method Selection", weight: 0.15, description: "Appropriate method chosen for the problem" },
    { name: "Presentation", weight: 0.15, description: "Work is clearly presented and easy to follow" },
  ],
  gradingLogic: "Accept semantically equivalent answers (e.g., '50 km/h' = 'fifty km per hour'). If logic is 70%+ correct but final answer wrong, award proportional credit.",
};

const APTITUDE_TEMPLATE: RubricTemplate = {
  criteria: [
    { name: "Answer Correctness", weight: 0.35, description: "Is the final answer correct" },
    { name: "Reasoning Chain", weight: 0.35, description: "Is the logical chain valid and complete" },
    { name: "Explanation Clarity", weight: 0.20, description: "Can the reasoning be easily followed" },
    { name: "Efficiency", weight: 0.10, description: "Was the approach efficient and direct" },
  ],
  gradingLogic: "Accept multiple valid reasoning approaches. Focus on logical validity, not a single correct path.",
};

const CODING_TEMPLATE: RubricTemplate = {
  criteria: [
    { name: "Correctness", weight: 0.35, description: "Produces correct output for all test cases" },
    { name: "Code Quality", weight: 0.25, description: "Clean, readable, well-structured code" },
    { name: "Efficiency", weight: 0.20, description: "Optimal time and space complexity" },
    { name: "Edge Cases", weight: 0.10, description: "Handles edge cases and boundary conditions" },
    { name: "Best Practices", weight: 0.10, description: "Follows language conventions and best practices" },
  ],
  gradingLogic: "Evaluate based on test case results first, then code quality. Partial credit for partially correct solutions.",
};

const HR_TEMPLATE: RubricTemplate = {
  criteria: [
    { name: "Relevance", weight: 0.30, description: "Directly addresses the question asked" },
    { name: "Clarity & Communication", weight: 0.25, description: "Clear, well-structured response" },
    { name: "Professional Tone", weight: 0.20, description: "Confident and professional tone" },
    { name: "Specificity", weight: 0.15, description: "Uses specific examples and metrics" },
    { name: "Self-Awareness", weight: 0.10, description: "Shows reflection and growth mindset" },
  ],
  gradingLogic: "Prefer STAR method responses. Flag unprofessional tone. Award credit for specific examples over generic statements.",
};

const COMMUNICATION_TEMPLATE: RubricTemplate = {
  criteria: [
    { name: "Clarity of Expression", weight: 0.30, description: "Message is clear and unambiguous" },
    { name: "Structure & Organization", weight: 0.25, description: "Logical flow and coherent structure" },
    { name: "Tone Appropriateness", weight: 0.20, description: "Tone matches the context and audience" },
    { name: "Completeness", weight: 0.15, description: "All required points are addressed" },
    { name: "Language Quality", weight: 0.10, description: "Grammar, spelling, and word choice" },
  ],
  gradingLogic: "Evaluate communication effectiveness. Focus on clarity and audience-appropriateness over perfect grammar.",
};

const MCQ_TEMPLATE: RubricTemplate = {
  criteria: [
    { name: "Answer Correctness", weight: 1.0, description: "Is the selected option the correct answer" },
  ],
  gradingLogic: "Binary grading: full marks if correct option selected, zero if incorrect. No partial credit.",
};

const FILL_IN_BLANKS_TEMPLATE: RubricTemplate = {
  criteria: [
    { name: "Blank Accuracy", weight: 1.0, description: "How many blanks are filled correctly" },
  ],
  gradingLogic: "Score proportionally: each blank is worth equal marks. Compare answers case-insensitively, accept minor spelling variations and equivalent forms (e.g. numbers as digits or words). Award partial credit based on fraction of correct blanks.",
};

const TEMPLATE_MAP: Record<string, RubricTemplate> = {
  english: ENGLISH_TEMPLATE,
  math: MATH_TEMPLATE,
  aptitude: APTITUDE_TEMPLATE,
  coding: CODING_TEMPLATE,
  hr: HR_TEMPLATE,
  situational: HR_TEMPLATE,
  communication: COMMUNICATION_TEMPLATE,
  general: APTITUDE_TEMPLATE,
};

/**
 * Returns the default rubric template for a given domain and question type.
 * Type overrides domain in two cases:
 *   - letter_writing → english template
 *   - code → coding template
 */
export function getDefaultRubric(domain: string, type: string): RubricTemplate {
  // Type overrides
  if (type === "mcq") return MCQ_TEMPLATE;
  if (type === "fill_in_blanks" || type === "audio") return FILL_IN_BLANKS_TEMPLATE;
  if (type === "letter_writing") return ENGLISH_TEMPLATE;
  if (type === "code") return CODING_TEMPLATE;

  return TEMPLATE_MAP[domain] || APTITUDE_TEMPLATE;
}
