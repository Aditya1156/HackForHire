import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICriteriaScore {
  name: string;
  score: number;
  maxScore: number;
  comment: string;
}

export interface IAIEvaluation {
  score: number;
  maxScore: number;
  criteriaScores: ICriteriaScore[];
  feedback: string;
  explanation: string;
}

export interface ITestQuestion {
  questionId: mongoose.Types.ObjectId;
  answer: string;
  voiceTranscript?: string;
  codeSubmission?: {
    code: string;
    language: string;
    testResults: { passed: number; total: number };
  };
  aiEvaluation: IAIEvaluation;
  followUpQuestions?: {
    question: string;
    answer: string;
    evaluation: string;
  }[];
  answeredAt: Date;
}

export interface ITest extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  mode: "test" | "interview";
  folderId?: mongoose.Types.ObjectId;
  domain?: string;
  questions: ITestQuestion[];
  status: "in-progress" | "completed" | "reviewed";
  scores: { domain: string; score: number; maxScore: number }[];
  airsScore?: number;
  totalScore: number;
  maxTotalScore: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  startedAt: Date;
  completedAt?: Date;
}

const TestSchema = new Schema<ITest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, enum: ["test", "interview"], default: "test" },
    folderId: { type: Schema.Types.ObjectId, ref: "QuestionFolder" },
    domain: String,
    questions: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: "Question" },
        answer: { type: String, default: "" },
        voiceTranscript: String,
        codeSubmission: {
          code: String,
          language: String,
          testResults: { passed: Number, total: Number },
        },
        aiEvaluation: {
          score: { type: Number, default: 0 },
          maxScore: { type: Number, default: 0 },
          criteriaScores: [{ name: String, score: Number, maxScore: Number, comment: String }],
          feedback: { type: String, default: "" },
          explanation: { type: String, default: "" },
        },
        followUpQuestions: [{ question: String, answer: String, evaluation: String }],
        answeredAt: { type: Date, default: Date.now },
      },
    ],
    status: { type: String, enum: ["in-progress", "completed", "reviewed"], default: "in-progress" },
    scores: [{ domain: String, score: Number, maxScore: Number }],
    airsScore: Number,
    totalScore: { type: Number, default: 0 },
    maxTotalScore: { type: Number, default: 0 },
    feedback: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true }
);

TestSchema.index({ userId: 1, status: 1 });
TestSchema.index({ completedAt: -1 });

const Test: Model<ITest> = mongoose.models.Test || mongoose.model<ITest>("Test", TestSchema);
export default Test;
