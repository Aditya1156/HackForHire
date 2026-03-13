import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRubricCriteria {
  name: string;
  weight: number;
  description: string;
}

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  folderId: mongoose.Types.ObjectId;
  domain: "english" | "math" | "aptitude" | "coding" | "hr" | "situational";
  type: "text" | "voice" | "code" | "mixed";
  difficulty: "easy" | "medium" | "hard";
  content: {
    text: string;
    formula?: string;
    imageUrl?: string;
    audioUrl?: string;
  };
  rubric: {
    criteria: IRubricCriteria[];
    maxScore: number;
    gradingLogic: string;
  };
  expectedAnswer?: string;
  testCases?: { input: string; expectedOutput: string }[];
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    folderId: { type: Schema.Types.ObjectId, ref: "QuestionFolder", required: true },
    domain: {
      type: String,
      enum: ["english", "math", "aptitude", "coding", "hr", "situational"],
      required: true,
    },
    type: { type: String, enum: ["text", "voice", "code", "mixed"], default: "text" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    content: {
      text: { type: String, required: true },
      formula: String,
      imageUrl: String,
      audioUrl: String,
    },
    rubric: {
      criteria: [{ name: String, weight: Number, description: String }],
      maxScore: { type: Number, required: true },
      gradingLogic: { type: String, default: "" },
    },
    expectedAnswer: String,
    testCases: [{ input: String, expectedOutput: String }],
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
