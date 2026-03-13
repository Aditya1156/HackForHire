import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import QuestionForm from "@/components/admin/QuestionForm";

export const metadata = {
  title: "Create Question — Vulcan Prep 360",
};

export default function NewQuestionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Link
          href="/admin/questions"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Question Bank
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create New Question</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pick a question type, fill in the content, and save.
          </p>
        </div>

        {/* Form (uses useSearchParams, needs Suspense) */}
        <Suspense fallback={
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <Image src="/image/VULCAN Logo_transparent.png" alt="Loading" width={48} height={48} className="animate-pulse" />
          </div>
        }>
          <QuestionForm />
        </Suspense>
      </div>
    </div>
  );
}
