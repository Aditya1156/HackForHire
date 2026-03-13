import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestionFolder extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  domain: string;
  tags: string[];
  questionCount: number;
  fetchCount: number;
  isPublished: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const QuestionFolderSchema = new Schema<IQuestionFolder>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    domain: { type: String, default: "general" },
    tags: { type: [String], default: [], index: true },
    questionCount: { type: Number, default: 0 },
    fetchCount: { type: Number, default: 10 },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const QuestionFolder: Model<IQuestionFolder> =
  mongoose.models.QuestionFolder ||
  mongoose.model<IQuestionFolder>("QuestionFolder", QuestionFolderSchema);
export default QuestionFolder;
