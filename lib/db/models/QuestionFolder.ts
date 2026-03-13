import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestionFolder extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  domain: string;
  questionCount: number;
  fetchCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const QuestionFolderSchema = new Schema<IQuestionFolder>(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true },
    questionCount: { type: Number, default: 0 },
    fetchCount: { type: Number, default: 10 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const QuestionFolder: Model<IQuestionFolder> =
  mongoose.models.QuestionFolder ||
  mongoose.model<IQuestionFolder>("QuestionFolder", QuestionFolderSchema);
export default QuestionFolder;
