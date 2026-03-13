import Link from "next/link";
import { Plus } from "lucide-react";
import QuestionTable from "@/components/admin/QuestionTable";

export const metadata = {
  title: "Question Bank — Versatile Evaluator",
};

export default function QuestionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage all questions across domains and folders.
            </p>
          </div>
          <Link href="/admin/questions/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Question
          </Link>
        </div>

        {/* Table (client component) */}
        <QuestionTable />
      </div>
    </div>
  );
}
