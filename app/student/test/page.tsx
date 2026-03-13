"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import {
  FolderOpen,
  BookOpen,
  Play,
  Loader2,
  AlertCircle,
  Hash,
} from "lucide-react";

interface Folder {
  _id: string;
  name: string;
  domain: string;
  questionCount: number;
  fetchCount: number;
}

const domainBadgeClass: Record<string, string> = {
  english: "badge-english",
  math: "badge-math",
  aptitude: "badge-aptitude",
  coding: "badge-coding",
  hr: "badge-hr",
  situational: "bg-teal-100 text-teal-800",
};

function FolderCard({
  folder,
  onStart,
  isStarting,
}: {
  folder: Folder;
  onStart: (id: string) => void;
  isStarting: boolean;
}) {
  return (
    <div className="card-hover p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
          <FolderOpen className="w-5 h-5 text-primary-600" />
        </div>
        <span
          className={`badge ${domainBadgeClass[folder.domain] ?? "bg-gray-100 text-gray-700"} capitalize`}
        >
          {folder.domain}
        </span>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1">
          {folder.name}
        </h3>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Hash className="w-3.5 h-3.5" />
            {folder.questionCount} question{folder.questionCount !== 1 ? "s" : ""} available
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {folder.fetchCount} per test
          </span>
        </div>
      </div>

      <button
        onClick={() => onStart(folder._id)}
        disabled={isStarting || folder.questionCount === 0}
        className="btn-primary w-full flex items-center justify-center gap-2 mt-auto disabled:opacity-50"
      >
        {isStarting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Starting...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Start Test
          </>
        )}
      </button>
    </div>
  );
}

export default function TestSelectionPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingFolderId, setStartingFolderId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/folders")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setFolders(data.data.folders);
        else setError(data.error ?? "Failed to load folders");
      })
      .catch(() => setError("Network error — please try again"))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async (folderId: string) => {
    setStartingFolderId(folderId);
    try {
      const res = await fetch("/api/tests/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/student/test/${data.data.testId}`);
      } else {
        setError(data.error ?? "Failed to start test");
        setStartingFolderId(null);
      }
    } catch {
      setError("Network error — please try again");
      setStartingFolderId(null);
    }
  };

  return (
    <AuthGuard requiredRole="student">
      <div>
        <div className="mb-8">
          <h1 className="page-header">Available Tests</h1>
          <p className="text-gray-500 text-sm">
            Select a folder to start a test. Questions are randomly selected from the folder.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="w-11 h-11 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-6" />
                <div className="h-10 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No test folders available</p>
            <p className="text-sm mt-1">Ask your teacher to create question folders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {folders.map((folder) => (
              <FolderCard
                key={folder._id}
                folder={folder}
                onStart={handleStart}
                isStarting={startingFolderId === folder._id}
              />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
