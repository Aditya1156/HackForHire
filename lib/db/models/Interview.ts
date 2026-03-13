import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInterview extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: string;
  resumeContext: Record<string, any>;
  conversationHistory: {
    role: "interviewer" | "candidate";
    content: string;
    timestamp: Date;
  }[];
  airsScore: {
    resumeStrength: number;
    communication: number;
    technicalKnowledge: number;
    codingAbility: number;
    problemSolving: number;
    professionalTone: number;
    total: number;
  };
  status: "active" | "completed";
  createdAt: Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    resumeContext: { type: Schema.Types.Mixed, default: {} },
    conversationHistory: [
      {
        role: { type: String, enum: ["interviewer", "candidate"] },
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    airsScore: {
      resumeStrength: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      technicalKnowledge: { type: Number, default: 0 },
      codingAbility: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      professionalTone: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    status: { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true }
);

InterviewSchema.index({ userId: 1, status: 1 });

const Interview: Model<IInterview> =
  mongoose.models.Interview || mongoose.model<IInterview>("Interview", InterviewSchema);
export default Interview;
