import { callAIForJSON } from "./client";

export interface ParsedResume {
  name: string;
  skills: string[];
  projects: { name: string; description: string; tech: string[] }[];
  experience: { role: string; company: string; duration: string }[];
  education: string;
  domain: string;
}

const RESUME_PARSER_SYSTEM = `Extract structured data from this resume. Return ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "name": "<full name>",
  "skills": ["skill1", "skill2", "skill3"],
  "projects": [{ "name": "<project name>", "description": "<1 sentence summary>", "tech": ["tech1", "tech2"] }],
  "experience": [{ "role": "<job title>", "company": "<company name>", "duration": "<e.g., 6 months>" }],
  "education": "<highest qualification with institution>",
  "domain": "<one of: frontend, backend, fullstack, data, ai, devops, other>"
}

If a field is not found in the resume, use empty string or empty array. Never make up information.`;

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  return callAIForJSON<ParsedResume>(RESUME_PARSER_SYSTEM, resumeText);
}
