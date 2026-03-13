"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, AlertCircle } from "lucide-react";
import QuestionForm from "@/components/admin/QuestionForm";
import BrandLoader from "@/components/ui/BrandLoader";

export default function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/questions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error ?? "Failed to load question");
        const q = data.data.question;
        setInitialData({
          folderId: String(q.folderId?._id || q.folderId),
          domain: q.domain,
          type: q.type,
          difficulty: q.difficulty,
          answerFormat: q.answerFormat || "text",
          content: {
            text: q.content?.text || "",
            formula: q.content?.formula || "",
            imageUrl: q.content?.imageUrl || "",
            audioUrl: q.content?.audioUrl || "",
            instructions: q.content?.instructions || "",
            options: q.content?.options || [],
            blanks: q.content?.blanks || [],
          },
          rubric: {
            criteria: q.rubric?.criteria || [],
            maxScore: q.rubric?.maxScore ?? 10,
            gradingLogic: q.rubric?.gradingLogic || "",
          },
          expectedAnswer: q.expectedAnswer || "",
          testCases: q.testCases || [],
          tags: q.tags || [],
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <BrandLoader text="Loading question..." />;
  }

  if (error || !initialData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card p-8 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold mb-2">Failed to load question</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/admin/questions?folderId=${initialData.folderId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Question Bank
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Question</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update the question content, options, and scoring.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex flex-col justify-center items-center py-20 gap-3">
              <Image src="/image/VULCAN Logo_transparent.png" alt="Loading" width={48} height={48} className="animate-pulse" />
            </div>
          }
        >
          <QuestionForm initialData={initialData} questionId={id} />
        </Suspense>
      </div>
    </div>
  );
}
