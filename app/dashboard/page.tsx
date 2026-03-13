import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardRedirectPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  await connectDB();

  let user = await User.findOne({ clerkId }).lean();

  // First-time sign-up — auto-create MongoDB user from Clerk profile
  if (!user) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";
    const name =
      `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() ||
      email;

    user = await User.create({ clerkId, name, email, role: "student" });
  }

  // Role-based redirect
  const role = (user as any).role as string;
  if (role === "admin") redirect("/admin");
  if (role === "teacher") redirect("/teacher/dashboard");
  redirect("/student/dashboard");
}
