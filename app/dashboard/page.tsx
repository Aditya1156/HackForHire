import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

export default async function DashboardRedirectPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  await connectDB();

  let user = await User.findOne({ clerkId }).lean();

  // First-time sign-up — redirect to role selection
  if (!user) {
    redirect("/select-role");
  }

  // Role-based redirect
  const role = (user as any).role as string;
  if (role === "admin") redirect("/admin");
  if (role === "teacher") redirect("/teacher/dashboard");
  redirect("/student/dashboard");
}
