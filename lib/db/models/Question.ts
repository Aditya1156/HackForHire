import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRubricCriteria {
  name: string;
  weight: number;
  description: string;
}

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  folderId: mongoose.Types.ObjectId;
  domain: "english" | "math" | "aptitude" | "coding" | "hr" | "situational" | "general" | "communication";
  type: "text" | "voice" | "code" | "image" | "audio" | "letter_writing" | "mcq" | "mixed";
  difficulty: "easy" | "medium" | "hard";
  content: {
    text: string;
    formula?: string;
    imageUrl?: string;
    audioUrl?: string;
    instructions?: string;
    options?: { label: string; text: string; isCorrect: boolean }[];
    blanks?: { id: number; correctAnswer: string }[];
  };
  rubric: {
    criteria: IRubricCriteria[];
    maxScore: number;
    gradingLogic: string;
  };
  expectedAnswer?: string;
  testCases?: { input: string; expectedOutput: string }[];
  answerFormat?: "text" | "code" | "file" | "voice" | "mcq" | "fill_in_blanks";
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    folderId: { type: Schema.Types.ObjectId, ref: "QuestionFolder", required: true },
    domain: {
      type: String,
      enum: ["english", "math", "aptitude", "coding", "hr", "situational", "general", "communication"],
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "voice", "code", "image", "audio", "letter_writing", "mcq", "mixed"],
      default: "text",
    },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    content: {
      text: { type: String, required: true },
      formula: String,
      imageUrl: String,
      audioUrl: String,
      instructions: String,
      options: [{ label: String, text: String, isCorrect: Boolean }],
      blanks: [{ id: Number, correctAnswer: String }],
    },
    rubric: {
      criteria: [{ name: String, weight: Number, description: String }],
      maxScore: { type: Number, required: true },
      gradingLogic: { type: String, default: "" },
    },
    expectedAnswer: String,
    testCases: [{ input: String, expectedOutput: String }],
    answerFormat: { type: String, enum: ["text", "code", "file", "voice", "mcq", "fill_in_blanks"], default: "text" },
    tags: [String],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

QuestionSchema.index({ folderId: 1, domain: 1, difficulty: 1 });
QuestionSchema.index({ tags: 1 });

const Question: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>("Question", QuestionSchema);
export default Question;
