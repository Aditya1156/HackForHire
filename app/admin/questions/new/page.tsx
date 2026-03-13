import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import QuestionForm from "@/components/admin/QuestionForm";

export const metadata = {
  title: "Create Question — Versatile Evaluator",
};

export default function NewQuestionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Link
          href="/admin/questions"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Question Bank
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create New Question</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in all sections below. Rubric weights must sum to 1.0.
          </p>
        </div>

        {/* Form (client component) */}
        <QuestionForm />
      </div>
    </div>
  );
}
