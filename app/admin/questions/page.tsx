import { Suspense } from "react";
import Image from "next/image";
import QuestionTable from "@/components/admin/QuestionTable";

export const metadata = {
  title: "Question Bank — Vulcan Prep 360",
};

export default function QuestionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select a folder to view and manage its questions.
          </p>
        </div>

        {/* Table (client component using useSearchParams needs Suspense) */}
        <Suspense fallback={
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <Image src="/image/VULCAN Logo_transparent.png" alt="Loading" width={48} height={48} className="animate-pulse" />
          </div>
        }>
          <QuestionTable />
        </Suspense>
      </div>
    </div>
  );
}
