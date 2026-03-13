"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import BrandLoader from "@/components/ui/BrandLoader";
import { InterviewRoom } from "@/components/interview/InterviewRoom";

export default function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [initialData, setInitialData] = useState<{
    firstQuestion: string;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve from sessionStorage (set during start) or fetch from report API
    const stored = sessionStorage.getItem(`interview-${id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setInitialData(parsed);
        setLoading(false);
        return;
      } catch {
        // fall through to fetch
      }
    }

    // Fetch interview data from report endpoint
    fetch(`/api/interviews/${id}/report`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error ?? "Failed to load interview");
        const interview = data.data.interview;
        if (interview.status === "completed") {
          router.replace(`/student/interview/${id}/report`);
          return;
        }
        // Get first interviewer question
        const firstQ = interview.conversationHistory?.find(
          (m: any) => m.role === "interviewer"
        )?.content ?? "Tell me about yourself.";
        setInitialData({ firstQuestion: firstQ, role: interview.role });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <BrandLoader text="Preparing your interview room..." bg="bg-gray-900" />
    );
  }

  if (error || !initialData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-2">Failed to load interview</p>
          <p className="text-gray-400 text-sm mb-4">{error ?? "Interview not found"}</p>
          <button onClick={() => router.push("/student/interview")} className="btn-secondary">
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <InterviewRoom
      interviewId={id}
      initialQuestion={initialData.firstQuestion}
      role={initialData.role}
    />
  );
}
