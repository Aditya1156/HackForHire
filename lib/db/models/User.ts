import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "student" | "admin" | "teacher";
  resume?: {
    fileUrl: string;
    parsed: {
      skills: string[];
      projects: { name: string; description: string; tech: string[] }[];
      experience: { role: string; company: string; duration: string }[];
      domain: string;
      education: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "admin", "teacher"], default: "student" },
    resume: {
      fileUrl: String,
      parsed: {
        skills: [String],
        projects: [{ name: String, description: String, tech: [String] }],
        experience: [{ role: String, company: String, duration: String }],
        domain: String,
        education: String,
      },
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
