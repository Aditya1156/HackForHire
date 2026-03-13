import FolderManager from "@/components/admin/FolderManager";

export const metadata = {
  title: "Folders — Versatile Evaluator",
};

export default function FoldersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FolderManager />
      </div>
    </div>
  );
}
