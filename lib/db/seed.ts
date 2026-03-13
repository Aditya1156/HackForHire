import mongoose from "mongoose";
import { connectDB } from "./mongodb";
import User from "./models/User";
import Question from "./models/Question";
import QuestionFolder from "./models/QuestionFolder";

// Folder definitions with role tags — matching your actual folder structure
const SEED_FOLDERS = [
  {
    name: "Writing",
    domain: "english",
    description: "Professional writing: emails, letters, reports",
    fetchCount: 2,
    tags: ["Software Developer", "Full Stack Developer", "Product Manager", "Business Analyst", "HR Manager", "Content Writer", "Marketing Manager", "Public Relations Manager", "Social Media Manager", "Journalist"],
  },
  {
    name: "Quantitative Aptitude",
    domain: "math",
    description: "Numerical reasoning, data interpretation, calculations",
    fetchCount: 2,
    tags: ["Software Developer", "Data Scientist", "Financial Analyst", "Accountant", "Business Analyst", "DevOps Engineer", "Machine Learning Engineer", "Budget Analyst", "Cost Analyst", "Investment Banker"],
  },
  {
    name: "Coding (Optional)",
    domain: "coding",
    description: "Programming problems, algorithms, data structures",
    fetchCount: 2,
    tags: ["Software Developer", "Full Stack Developer", "DevOps Engineer", "Machine Learning Engineer", "Data Scientist", "System Design Engineer", "Embedded Systems Engineer", "Cybersecurity Analyst", "Cloud Architect"],
  },
  {
    name: "Verbal Aptitude",
    domain: "aptitude",
    description: "Logical reasoning, comprehension, verbal ability",
    fetchCount: 2,
    tags: ["Software Developer", "Data Scientist", "Business Analyst", "Product Manager", "Consultant", "Strategy Analyst", "Full Stack Developer", "Content Writer", "Journalist", "UX Researcher"],
  },
  {
    name: "Reading",
    domain: "english",
    description: "Reading comprehension and analysis",
    fetchCount: 2,
    tags: ["Software Developer", "Product Manager", "Business Analyst", "Content Writer", "Journalist", "UX Researcher", "Data Scientist", "Consultant", "Marketing Manager", "Public Relations Manager"],
  },
  {
    name: "Listening",
    domain: "communication",
    description: "Audio comprehension and listening skills",
    fetchCount: 1,
    tags: ["Software Developer", "Product Manager", "HR Manager", "Business Analyst", "Marketing Manager", "Consultant", "Operations Manager", "Content Writer"],
  },
  {
    name: "Maths",
    domain: "math",
    description: "Mathematical problem solving",
    fetchCount: 2,
    tags: ["Software Developer", "Data Scientist", "Financial Analyst", "Accountant", "Machine Learning Engineer", "DevOps Engineer", "Budget Analyst", "Cost Analyst", "Equity Research Analyst"],
  },
  {
    name: "MCQ",
    domain: "general",
    description: "Multiple choice questions across domains",
    fetchCount: 3,
    tags: ["Software Developer", "Full Stack Developer", "Data Scientist", "Business Analyst", "Product Manager", "Financial Analyst", "Accountant", "HR Manager", "Marketing Manager", "DevOps Engineer", "Content Writer", "Consultant"],
  },
  {
    name: "Speech (Optional)",
    domain: "communication",
    description: "Spoken communication and presentation skills",
    fetchCount: 1,
    tags: ["Software Developer", "Product Manager", "HR Manager", "Business Analyst", "Marketing Manager", "Content Writer", "Consultant", "Full Stack Developer", "Data Scientist", "Financial Analyst"],
  },
];

// Questions — tags removed since selection is now folder-based
const SEED_QUESTIONS = [
  // WRITING folder questions
  {
    folder: "Writing",
    domain: "english" as const,
    type: "text" as const,
    difficulty: "medium" as const,
    content: { text: "Write a formal apology letter to a client for a delayed shipment of their order #4521. Include: acknowledgment of the delay, reason (warehouse logistics issue), new delivery date, and a goodwill gesture." },
    rubric: { criteria: [
      { name: "Structure & Format", weight: 0.25, description: "Proper letter format" },
      { name: "Grammar & Language", weight: 0.25, description: "Correct grammar and spelling" },
      { name: "Tone & Register", weight: 0.20, description: "Formal and empathetic" },
      { name: "Content Completeness", weight: 0.20, description: "Addresses all 4 required points" },
      { name: "Vocabulary & Expression", weight: 0.10, description: "Professional vocabulary" },
    ], maxScore: 20, gradingLogic: "" },
    expectedAnswer: "A formal letter including greeting, apology, specific order reference, reason for delay, new delivery timeline, compensation offer, and professional closing.",
    tags: ["letter", "formal", "apology"],
  },
  {
    folder: "Writing",
    domain: "english" as const,
    type: "text" as const,
    difficulty: "easy" as const,
    content: { text: "Write a short email to your team announcing that the office will be closed next Friday for maintenance. Keep it professional and include key details: date, reason, and what to do (work from home)." },
    rubric: { criteria: [
      { name: "Structure & Format", weight: 0.25, description: "Email format with subject, greeting, body, sign-off" },
      { name: "Grammar & Language", weight: 0.25, description: "Correct grammar" },
      { name: "Tone & Register", weight: 0.20, description: "Professional but friendly" },
      { name: "Content Completeness", weight: 0.20, description: "Includes date, reason, and WFH instruction" },
      { name: "Vocabulary & Expression", weight: 0.10, description: "Clear and concise" },
    ], maxScore: 10, gradingLogic: "" },
    tags: ["email", "professional", "announcement"],
  },
  // QUANTITATIVE APTITUDE folder questions
  {
    folder: "Quantitative Aptitude",
    domain: "math" as const,
    type: "text" as const,
    difficulty: "easy" as const,
    content: { text: "A train travels 240 km in 3 hours. What is its average speed? Show your working.", formula: "\\text{Speed} = \\frac{\\text{Distance}}{\\text{Time}}" },
    rubric: { criteria: [
      { name: "Final Answer Accuracy", weight: 0.40, description: "Correct: 80 km/h" },
      { name: "Logical Steps", weight: 0.30, description: "Shows Speed = Distance/Time" },
      { name: "Method Selection", weight: 0.15, description: "Uses correct formula" },
      { name: "Presentation", weight: 0.15, description: "Clear working with units" },
    ], maxScore: 10, gradingLogic: "" },
    expectedAnswer: "Speed = 240/3 = 80 km/h",
    tags: ["speed", "distance", "basic"],
  },
  {
    folder: "Quantitative Aptitude",
    domain: "math" as const,
    type: "text" as const,
    difficulty: "medium" as const,
    content: { text: "If a shirt costs ₹800 after a 20% discount, what was the original price? Show your calculation step by step." },
    rubric: { criteria: [
      { name: "Final Answer Accuracy", weight: 0.40, description: "Correct: ₹1000" },
      { name: "Logical Steps", weight: 0.30, description: "Sets up equation: 0.8x = 800" },
      { name: "Method Selection", weight: 0.15, description: "Percentage/algebra approach" },
      { name: "Presentation", weight: 0.15, description: "Clear step-by-step" },
    ], maxScore: 10, gradingLogic: "" },
    expectedAnswer: "Original price × 0.80 = 800, so Original = 800/0.80 = ₹1000",
    tags: ["percentage", "discount", "algebra"],
  },
  // VERBAL APTITUDE folder questions
  {
    folder: "Verbal Aptitude",
    domain: "aptitude" as const,
    type: "text" as const,
    difficulty: "medium" as const,
    content: { text: "If all roses are flowers, and some flowers fade quickly, can we conclude that some roses fade quickly? Explain your reasoning." },
    rubric: { criteria: [
      { name: "Answer Correctness", weight: 0.35, description: "Correct: No, we cannot conclude this" },
      { name: "Reasoning Chain", weight: 0.35, description: "Explains the logical fallacy" },
      { name: "Explanation Clarity", weight: 0.20, description: "Clear reasoning" },
      { name: "Efficiency", weight: 0.10, description: "Concise explanation" },
    ], maxScore: 10, gradingLogic: "" },
    expectedAnswer: "No. While all roses are flowers, the 'some flowers that fade quickly' may not include any roses. This is the fallacy of the undistributed middle.",
    tags: ["logic", "syllogism", "reasoning"],
  },
  // CODING folder questions
  {
    folder: "Coding (Optional)",
    domain: "coding" as const,
    type: "code" as const,
    difficulty: "medium" as const,
    content: { text: "Write a function that takes an array of integers and returns the second largest number. Handle edge cases: duplicates, arrays with less than 2 elements." },
    rubric: { criteria: [
      { name: "Correctness", weight: 0.35, description: "Passes all test cases" },
      { name: "Code Quality", weight: 0.25, description: "Clean, readable code" },
      { name: "Efficiency", weight: 0.20, description: "O(n) preferred over O(n log n)" },
      { name: "Edge Cases", weight: 0.10, description: "Handles duplicates, small arrays" },
      { name: "Best Practices", weight: 0.10, description: "Good naming, input validation" },
    ], maxScore: 10, gradingLogic: "" },
    testCases: [
      { input: "[5, 3, 8, 1, 9]", expectedOutput: "8" },
      { input: "[5, 5, 3]", expectedOutput: "3" },
      { input: "[1]", expectedOutput: "-1" },
      { input: "[]", expectedOutput: "-1" },
      { input: "[10, 10, 10]", expectedOutput: "-1" },
      { input: "[1, 2]", expectedOutput: "1" },
    ],
    expectedAnswer: "function secondLargest(arr) { const unique = [...new Set(arr)]; if (unique.length < 2) return -1; unique.sort((a,b) => b-a); return unique[1]; }",
    tags: ["array", "sorting", "edge-cases"],
  },
  {
    folder: "Coding (Optional)",
    domain: "coding" as const,
    type: "code" as const,
    difficulty: "easy" as const,
    content: { text: "Write a function `isPalindrome(str)` that checks if a given string is a palindrome. Ignore case and spaces." },
    rubric: { criteria: [
      { name: "Correctness", weight: 0.35, description: "Handles all test cases" },
      { name: "Code Quality", weight: 0.25, description: "Clean and readable" },
      { name: "Efficiency", weight: 0.20, description: "O(n) solution" },
      { name: "Edge Cases", weight: 0.10, description: "Empty string, single char" },
      { name: "Best Practices", weight: 0.10, description: "Proper naming" },
    ], maxScore: 10, gradingLogic: "" },
    testCases: [
      { input: "racecar", expectedOutput: "true" },
      { input: "Race Car", expectedOutput: "true" },
      { input: "hello", expectedOutput: "false" },
      { input: "", expectedOutput: "true" },
      { input: "a", expectedOutput: "true" },
    ],
    tags: ["string", "palindrome", "basic"],
  },
  // MCQ folder questions
  {
    folder: "MCQ",
    domain: "general" as const,
    type: "text" as const,
    difficulty: "easy" as const,
    content: { text: "Which data structure uses FIFO (First In, First Out) ordering?\n\nA) Stack\nB) Queue\nC) Tree\nD) Graph" },
    rubric: { criteria: [
      { name: "Answer Correctness", weight: 1.0, description: "Correct answer: B) Queue" },
    ], maxScore: 5, gradingLogic: "" },
    expectedAnswer: "B) Queue",
    tags: ["data-structures", "mcq"],
  },
  // SPEECH folder questions
  {
    folder: "Speech (Optional)",
    domain: "communication" as const,
    type: "voice" as const,
    difficulty: "easy" as const,
    content: { text: "Introduce yourself in a professional context. You are interviewing for a position at a tech startup. Cover: your name, background, key skills, and why you're interested." },
    rubric: { criteria: [
      { name: "Relevance", weight: 0.30, description: "Relevant to the role" },
      { name: "Clarity & Communication", weight: 0.25, description: "Structured introduction" },
      { name: "Professional Tone", weight: 0.20, description: "Confident, not arrogant" },
      { name: "Specificity", weight: 0.15, description: "Mentions skills, experience, projects" },
      { name: "Self-Awareness", weight: 0.10, description: "Knows what they bring" },
    ], maxScore: 10, gradingLogic: "" },
    tags: ["introduction", "self-presentation", "voice"],
  },
  // HR-style behavioral (in MCQ folder as general)
  {
    folder: "MCQ",
    domain: "general" as const,
    type: "text" as const,
    difficulty: "medium" as const,
    content: { text: "Tell me about a time you failed at work or in a project. What happened and what did you learn?" },
    rubric: { criteria: [
      { name: "Relevance", weight: 0.30, description: "Describes a real failure" },
      { name: "Clarity & Communication", weight: 0.25, description: "Uses STAR method" },
      { name: "Professional Tone", weight: 0.20, description: "Takes accountability" },
      { name: "Specificity", weight: 0.15, description: "Specific details and metrics" },
      { name: "Self-Awareness", weight: 0.10, description: "Shows growth and lessons learned" },
    ], maxScore: 10, gradingLogic: "" },
    tags: ["behavioral", "failure", "self-awareness"],
  },
];

async function seed() {
  await connectDB();
  console.log("Connected to MongoDB");

  // Clear existing data
  await User.deleteMany({});
  await Question.deleteMany({});
  await QuestionFolder.deleteMany({});
  console.log("Cleared existing data");

  // Create seed users (Clerk handles real auth; these are placeholder DB records)
  const admin = await User.create({
    clerkId: "seed_admin_clerkid", name: "Admin User", email: "admin@test.com", role: "admin",
  });
  await User.create({
    clerkId: "seed_student_clerkid", name: "Test Student", email: "student@test.com", role: "student",
  });
  await User.create({
    clerkId: "seed_teacher_clerkid", name: "Test Teacher", email: "teacher@test.com", role: "teacher",
  });
  console.log("Created seed users: admin@test.com, student@test.com, teacher@test.com");

  // Create folders with role tags
  const folderMap: Record<string, any> = {};
  for (const def of SEED_FOLDERS) {
    folderMap[def.name] = await QuestionFolder.create({
      name: def.name,
      description: def.description,
      domain: def.domain,
      tags: def.tags,
      fetchCount: def.fetchCount,
      isPublished: true,
      createdBy: admin._id,
    });
  }
  console.log(`Created ${SEED_FOLDERS.length} folders with role tags`);

  // Create questions (linked to folders by name)
  for (const q of SEED_QUESTIONS) {
    const folder = folderMap[q.folder];
    if (!folder) {
      console.warn(`Folder "${q.folder}" not found, skipping question`);
      continue;
    }
    const { folder: _folderName, ...questionData } = q;
    await Question.create({
      ...questionData,
      folderId: folder._id,
      createdBy: admin._id,
    });
    folder.questionCount += 1;
    await folder.save();
  }
  console.log(`Seeded ${SEED_QUESTIONS.length} questions across ${SEED_FOLDERS.length} folders`);

  await mongoose.disconnect();
  console.log("Seed complete!");
}

seed().catch(console.error);
