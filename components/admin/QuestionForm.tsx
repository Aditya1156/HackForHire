"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Tag,
  X,
  FileText,
  Mic,
  Code,
  Image as ImageIcon,
  Headphones,
  PenLine,
  Shuffle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  BookOpen,
  Award,
  Sparkles,
  FolderOpen,
  Search,
  Globe,
  Brain,
  MessageSquare,
  Calculator,
  Users,
  Briefcase,
  Lightbulb,
  ListChecks,
  CircleDot,
  Upload,
} from "lucide-react";
import { KaTeXRenderer } from "@/components/shared/KaTeXRenderer";

/* ─── Types ─── */
interface RubricCriteria { name: string; weight: number; description: string; }
interface TestCase { input: string; expectedOutput: string; }
interface MCQOption { label: string; text: string; isCorrect: boolean; }
interface Blank { id: number; correctAnswer: string; }
interface Folder { _id: string; name: string; domain: string; }

interface QuestionFormProps {
  initialData?: Partial<QuestionFormData>;
  questionId?: string;
}

interface QuestionFormData {
  folderId: string;
  domain: string;
  type: string;
  difficulty: string;
  answerFormat: string;
  content: {
    text: string;
    formula: string;
    imageUrl: string;
    audioUrl: string;
    instructions: string;
    options: MCQOption[];
    blanks: Blank[];
  };
  rubric: {
    criteria: RubricCriteria[];
    maxScore: number;
    gradingLogic: string;
  };
  expectedAnswer: string;
  testCases: TestCase[];
  tags: string[];
}

/* ─── Constants ─── */
const QUESTION_TYPES = [
  {
    id: "text",
    label: "Text",
    icon: FileText,
    desc: "Standard written question with text answer",
    color: "border-blue-400",
    bg: "bg-blue-50",
    iconBg: "bg-blue-500",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    id: "mcq",
    label: "MCQ",
    icon: ListChecks,
    desc: "Multiple choice with options A, B, C, D",
    color: "border-violet-400",
    bg: "bg-violet-50",
    iconBg: "bg-violet-500",
    text: "text-violet-700",
    badge: "bg-violet-100 text-violet-700",
  },
  {
    id: "image",
    label: "Image",
    icon: ImageIcon,
    desc: "Question with picture, diagram or chart",
    color: "border-green-400",
    bg: "bg-green-50",
    iconBg: "bg-green-500",
    text: "text-green-700",
    badge: "bg-green-100 text-green-700",
  },
  {
    id: "audio",
    label: "Listening",
    icon: Headphones,
    desc: "Audio-based listening comprehension",
    color: "border-amber-400",
    bg: "bg-amber-50",
    iconBg: "bg-amber-500",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    id: "code",
    label: "Coding",
    icon: Code,
    desc: "Programming challenge with test cases",
    color: "border-orange-400",
    bg: "bg-orange-50",
    iconBg: "bg-orange-500",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-700",
  },
  {
    id: "voice",
    label: "Speech",
    icon: Mic,
    desc: "Voice response / speaking assessment",
    color: "border-pink-400",
    bg: "bg-pink-50",
    iconBg: "bg-pink-500",
    text: "text-pink-700",
    badge: "bg-pink-100 text-pink-700",
  },
  {
    id: "letter_writing",
    label: "Writing",
    icon: PenLine,
    desc: "Letter, email, or essay composition",
    color: "border-teal-400",
    bg: "bg-teal-50",
    iconBg: "bg-teal-500",
    text: "text-teal-700",
    badge: "bg-teal-100 text-teal-700",
  },
  {
    id: "mixed",
    label: "Mixed",
    icon: Shuffle,
    desc: "Multi-format: text + image + audio",
    color: "border-gray-400",
    bg: "bg-gray-50",
    iconBg: "bg-gray-500",
    text: "text-gray-700",
    badge: "bg-gray-100 text-gray-700",
  },
] as const;

const DOMAINS = [
  { id: "english", label: "English", icon: BookOpen, badge: "bg-blue-100 text-blue-700" },
  { id: "math", label: "Math", icon: Calculator, badge: "bg-emerald-100 text-emerald-700" },
  { id: "aptitude", label: "Aptitude", icon: Brain, badge: "bg-purple-100 text-purple-700" },
  { id: "coding", label: "Coding", icon: Code, badge: "bg-orange-100 text-orange-700" },
  { id: "hr", label: "HR", icon: Users, badge: "bg-pink-100 text-pink-700" },
  { id: "situational", label: "Situational", icon: Lightbulb, badge: "bg-amber-100 text-amber-700" },
  { id: "general", label: "General", icon: Globe, badge: "bg-gray-100 text-gray-700" },
  { id: "communication", label: "Communication", icon: MessageSquare, badge: "bg-cyan-100 text-cyan-700" },
] as const;

const DOMAIN_TAGS: Record<string, string[]> = {
  english: ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Content Writer", "Technical Writer", "Copywriter", "SEO Specialist", "Journalist", "Translator", "Editor"],
  math: ["Data Analyst", "Data Scientist", "Quantitative Analyst", "Actuary", "Financial Analyst", "Statistician", "Research Analyst", "BI Developer", "Risk Analyst", "Economist"],
  aptitude: ["Software Developer", "Business Analyst", "Consultant", "Management Trainee", "Operations Analyst", "Product Manager", "Strategy Analyst", "Supply Chain Analyst", "Quality Analyst", "Process Analyst"],
  coding: ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile Developer", "DevOps Engineer", "Cloud Engineer", "Data Engineer", "ML Engineer", "AI Engineer", "QA Engineer", "Embedded Developer", "Game Developer", "Blockchain Developer", "Security Engineer"],
  hr: ["HR Executive", "Recruiter", "Talent Acquisition", "HR Manager", "Training & Development", "Employee Relations", "HR Business Partner", "Payroll Specialist", "Office Manager", "Admin Executive"],
  situational: ["Project Manager", "Team Lead", "Scrum Master", "Operations Manager", "Customer Success", "Account Manager", "Delivery Manager", "Program Manager", "Agile Coach", "Department Head"],
  general: ["Management Trainee", "Graduate Trainee", "Executive Trainee", "Intern", "Fresher", "Campus Hire", "Associate", "Analyst", "Coordinator", "Officer"],
  communication: ["Sales Executive", "Business Development", "Client Relations", "Public Relations", "Brand Manager", "Marketing Executive", "Event Manager", "Media Planner", "Social Media Manager", "Corporate Trainer"],
};

const DIFFICULTIES = [
  { id: "easy", label: "Easy", dot: "bg-green-500", bg: "bg-green-50", border: "border-green-300", text: "text-green-700" },
  { id: "medium", label: "Medium", dot: "bg-amber-500", bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700" },
  { id: "hard", label: "Hard", dot: "bg-red-500", bg: "bg-red-50", border: "border-red-300", text: "text-red-700" },
] as const;

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const defaultForm: QuestionFormData = {
  folderId: "",
  domain: "general",
  type: "",
  difficulty: "medium",
  answerFormat: "text",
  content: { text: "", formula: "", imageUrl: "", audioUrl: "", instructions: "", options: [], blanks: [] },
  rubric: { criteria: [], maxScore: 10, gradingLogic: "" },
  expectedAnswer: "",
  testCases: [],
  tags: [],
};

/* ─── Component ─── */
export default function QuestionForm({ initialData, questionId }: QuestionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFolderId = searchParams.get("folderId") || "";
  const [form, setForm] = useState<QuestionFormData>(() => ({
    ...defaultForm,
    ...initialData,
    content: { ...defaultForm.content, ...(initialData?.content ?? {}) },
    rubric: { ...defaultForm.rubric, ...(initialData?.rubric ?? {}) },
  }));
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [formulaPreview, setFormulaPreview] = useState(false);
  const [showCustomRubric, setShowCustomRubric] = useState(
    () => !!(initialData?.rubric?.criteria && initialData.rubric.criteria.length > 0)
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [dragOverImage, setDragOverImage] = useState(false);
  const [dragOverAudio, setDragOverAudio] = useState(false);

  useEffect(() => {
    fetch("/api/folders").then((r) => r.json()).then((d) => {
      if (d.success) setFolders(d.data.folders);
    }).catch(() => {});
  }, []);

  // Auto-set answer format based on type and blanks
  useEffect(() => {
    setForm((prev) => {
      const hasBlanks = (prev.content.blanks ?? []).length > 0;
      const map: Record<string, string> = {
        code: "code", voice: "voice", mcq: "mcq",
        letter_writing: "text", image: "text",
        audio: hasBlanks ? "fill_in_blanks" : "text",
        text: "text", mixed: hasBlanks ? "fill_in_blanks" : "text",
      };
      return { ...prev, answerFormat: map[prev.type] || "text" };
    });
  }, [form.type, form.content.blanks?.length]);

  // Auto-select folder from URL or if only one exists
  useEffect(() => {
    if (urlFolderId && folders.some((f) => f._id === urlFolderId) && !form.folderId) {
      setForm((prev) => ({ ...prev, folderId: urlFolderId }));
    } else if (folders.length === 1 && !form.folderId) {
      setForm((prev) => ({ ...prev, folderId: folders[0]._id }));
    }
  }, [folders, form.folderId, urlFolderId]);

  // Init MCQ options when selecting MCQ type
  useEffect(() => {
    if (form.type === "mcq" && form.content.options.length === 0) {
      setForm((prev) => ({
        ...prev,
        content: {
          ...prev.content,
          options: [
            { label: "A", text: "", isCorrect: false },
            { label: "B", text: "", isCorrect: false },
            { label: "C", text: "", isCorrect: false },
            { label: "D", text: "", isCorrect: false },
          ],
        },
      }));
    }
  }, [form.type, form.content.options.length]);

  const selectedType = QUESTION_TYPES.find((t) => t.id === form.type);
  const selectedDomain = DOMAINS.find((d) => d.id === form.domain);
  const selectedFolder = folders.find((f) => f._id === form.folderId);
  const totalWeight = form.rubric.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  const weightOk = Math.abs(totalWeight - 1) < 0.01;

  const suggestedTags = useMemo(() => {
    const list = DOMAIN_TAGS[form.domain] || [];
    if (!tagSearch) return list.filter((t) => !form.tags.includes(t));
    return list.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase()) && !form.tags.includes(t));
  }, [form.domain, form.tags, tagSearch]);

  /* ─── Helpers ─── */
  function updateField<K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function updateContent(key: keyof QuestionFormData["content"], value: unknown) {
    setForm((prev) => ({ ...prev, content: { ...prev.content, [key]: value } }));
  }
  function updateRubric(key: keyof QuestionFormData["rubric"], value: unknown) {
    setForm((prev) => ({ ...prev, rubric: { ...prev.rubric, [key]: value } }));
  }
  function updateCriteria(index: number, key: keyof RubricCriteria, value: string | number) {
    const updated = form.rubric.criteria.map((c, i) => i === index ? { ...c, [key]: value } : c);
    updateRubric("criteria", updated);
  }
  function addCriteria() {
    updateRubric("criteria", [...form.rubric.criteria, { name: "", weight: 0, description: "" }]);
  }
  function removeCriteria(index: number) {
    updateRubric("criteria", form.rubric.criteria.filter((_, i) => i !== index));
  }
  function addTestCase() {
    updateField("testCases", [...form.testCases, { input: "", expectedOutput: "" }]);
  }
  function updateTestCase(index: number, key: keyof TestCase, value: string) {
    updateField("testCases", form.testCases.map((tc, i) => i === index ? { ...tc, [key]: value } : tc));
  }
  function removeTestCase(index: number) {
    updateField("testCases", form.testCases.filter((_, i) => i !== index));
  }
  function addTag(tag: string) {
    const t = tag.trim();
    if (t && !form.tags.includes(t)) updateField("tags", [...form.tags, t]);
    setTagInput(""); setTagSearch("");
  }
  function removeTag(tag: string) {
    updateField("tags", form.tags.filter((t) => t !== tag));
  }

  // MCQ helpers
  function updateOption(index: number, text: string) {
    const opts = form.content.options.map((o, i) => i === index ? { ...o, text } : o);
    updateContent("options", opts);
  }
  function setCorrectOption(index: number) {
    const opts = form.content.options.map((o, i) => ({ ...o, isCorrect: i === index }));
    updateContent("options", opts);
  }
  function addOption() {
    if (form.content.options.length >= 6) return;
    const label = OPTION_LABELS[form.content.options.length] || String(form.content.options.length + 1);
    updateContent("options", [...form.content.options, { label, text: "", isCorrect: false }]);
  }
  function removeOption(index: number) {
    if (form.content.options.length <= 2) return;
    const opts = form.content.options.filter((_, i) => i !== index)
      .map((o, i) => ({ ...o, label: OPTION_LABELS[i] || String(i + 1) }));
    updateContent("options", opts);
  }

  // Blanks helpers
  function addBlank() {
    const nextId = form.content.blanks.length > 0
      ? Math.max(...form.content.blanks.map((b) => b.id)) + 1
      : 1;
    updateContent("blanks", [...form.content.blanks, { id: nextId, correctAnswer: "" }]);
  }
  function updateBlank(index: number, correctAnswer: string) {
    const updated = form.content.blanks.map((b, i) => i === index ? { ...b, correctAnswer } : b);
    updateContent("blanks", updated);
  }
  function removeBlank(index: number) {
    const updated = form.content.blanks.filter((_, i) => i !== index)
      .map((b, i) => ({ ...b, id: i + 1 }));
    updateContent("blanks", updated);
  }

  // S3 upload helper
  async function uploadToS3(
    file: File,
    mediaType: "audio" | "image" | "video",
    setLoading: (v: boolean) => void,
    onUrl: (url: string) => void,
  ) {
    setLoading(true);
    try {
      // 1. Get presigned URL from our API
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          mediaType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get upload URL");

      // 2. Upload file directly to S3 via presigned URL
      const uploadRes = await fetch(data.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload to S3 failed");

      // 3. Set the public URL
      onUrl(data.data.fileUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function validate(): string | null {
    if (!form.type) return "Please select a question type.";
    if (!form.folderId) return "Please select a folder.";
    if (!form.content.text.trim()) return "Question text is required.";
    if (form.type === "mcq") {
      if (form.content.options.length < 2) return "MCQ needs at least 2 options.";
      if (form.content.options.some((o) => !o.text.trim())) return "All MCQ options need text.";
      if (!form.content.options.some((o) => o.isCorrect)) return "Mark one option as correct.";
    }
    if (form.type === "image" && !form.content.imageUrl) return "Image URL is required for image questions.";
    if (form.type === "audio" && !form.content.audioUrl) return "Audio URL is required for listening questions.";
    if (form.content.blanks.length > 0 && form.content.blanks.some((b) => !b.correctAnswer.trim()))
      return "All blanks must have a correct answer.";
    if (form.rubric.maxScore <= 0) return "Max score must be positive.";
    if (showCustomRubric && form.rubric.criteria.length > 0) {
      if (form.rubric.criteria.some((c) => !c.name.trim())) return "All rubric criteria need a name.";
      if (!weightOk) return `Rubric weights must sum to 1.0 (currently ${totalWeight.toFixed(2)}).`;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setIsLoading(true);
    try {
      const rubricToSend = showCustomRubric && form.rubric.criteria.length > 0
        ? form.rubric
        : { criteria: [], maxScore: form.rubric.maxScore, gradingLogic: form.rubric.gradingLogic };
      const payload = {
        ...form,
        rubric: rubricToSend,
        content: {
          text: form.content.text,
          ...(form.content.formula ? { formula: form.content.formula } : {}),
          ...(form.content.imageUrl ? { imageUrl: form.content.imageUrl } : {}),
          ...(form.content.audioUrl ? { audioUrl: form.content.audioUrl } : {}),
          ...(form.content.instructions ? { instructions: form.content.instructions } : {}),
          ...(form.type === "mcq" ? { options: form.content.options } : {}),
          ...(form.content.blanks.length > 0 ? { blanks: form.content.blanks } : {}),
        },
        testCases: form.type === "code" ? form.testCases : undefined,
      };

      const url = questionId ? `/api/questions/${questionId}` : "/api/questions";
      const method = questionId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save question."); return; }
      router.push("/admin/questions");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Has the user picked a type?
  const typeChosen = !!form.type;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ═══════════════════ STEP 1: Pick Question Type ═══════════════════ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <span className="text-sm font-bold text-violet-600">1</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">What type of question?</h2>
        </div>
        <p className="text-sm text-gray-400 ml-9 mb-4">Pick the format — this determines what fields you'll fill in.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUESTION_TYPES.map((qt) => {
            const Icon = qt.icon;
            const active = form.type === qt.id;
            return (
              <button
                key={qt.id}
                type="button"
                onClick={() => updateField("type", qt.id)}
                className={`relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all duration-200 group
                  ${active
                    ? `${qt.color} ${qt.bg} ring-2 ring-offset-1 shadow-md`
                    : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all
                  ${active ? `${qt.iconBg} text-white shadow-lg` : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className={`text-sm font-bold block ${active ? qt.text : "text-gray-700"}`}>{qt.label}</span>
                  <span className="text-[10px] text-gray-400 leading-tight block mt-0.5">{qt.desc}</span>
                </div>
                {active && (
                  <div className="absolute -top-1.5 -right-1.5">
                    <CheckCircle2 className={`w-5 h-5 ${qt.text}`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Everything below only shows once a type is chosen */}
      {typeChosen && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* ═══════════ STEP 2: Question Content ═══════════ */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <span className="text-sm font-bold text-violet-600">2</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Question Content</h2>
              {selectedType && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selectedType.badge}`}>
                  {selectedType.label}
                </span>
              )}
            </div>

            {/* Question Text */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Question Text <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">
                {form.type === "mcq"
                  ? "Write the question stem. Options are added below."
                  : form.type === "letter_writing"
                  ? "Describe the writing task — who to address, purpose, and context."
                  : form.type === "code"
                  ? "Describe the coding problem, input/output format, and constraints."
                  : form.type === "audio"
                  ? "Write the question about the audio clip (comprehension, dictation, etc.)."
                  : form.type === "image"
                  ? "Write the question about the image/diagram."
                  : "Write the full question text."}
              </p>
              <textarea
                value={form.content.text}
                onChange={(e) => updateContent("text", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                placeholder={
                  form.type === "mcq"
                    ? "e.g. What is the capital of France?"
                    : form.type === "code"
                    ? "e.g. Write a function that returns the nth Fibonacci number..."
                    : form.type === "letter_writing"
                    ? "e.g. Write a formal application letter to the HR Manager..."
                    : "Enter the question text here..."
                }
                required
              />
            </div>

            {/* ── MCQ Options ── */}
            {form.type === "mcq" && (
              <div className="bg-violet-50 rounded-2xl border border-violet-200 p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-violet-800 flex items-center gap-1.5">
                      <ListChecks className="w-4 h-4" />
                      Answer Options
                    </h3>
                    <p className="text-xs text-violet-600 mt-0.5">Click the radio to mark the correct answer.</p>
                  </div>
                  {form.content.options.length < 6 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-200 text-violet-800 text-xs font-semibold hover:bg-violet-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Option
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {form.content.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      {/* Radio for correct */}
                      <button
                        type="button"
                        onClick={() => setCorrectOption(idx)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                          ${opt.isCorrect
                            ? "border-green-500 bg-green-500 text-white shadow-md"
                            : "border-gray-300 bg-white text-gray-400 hover:border-violet-400"
                          }`}
                        title={opt.isCorrect ? "Correct answer" : "Mark as correct"}
                      >
                        {opt.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <CircleDot className="w-4 h-4" />}
                      </button>

                      {/* Label */}
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${opt.isCorrect ? "bg-green-100 text-green-700" : "bg-white text-gray-500 border border-gray-200"}`}>
                        {opt.label}
                      </span>

                      {/* Input */}
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        className={`flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all
                          ${opt.isCorrect
                            ? "border-green-300 bg-green-50 focus:border-green-400"
                            : "border-gray-200 bg-white focus:border-violet-400"
                          }`}
                        placeholder={`Option ${opt.label}...`}
                      />

                      {/* Remove */}
                      {form.content.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {!form.content.options.some((o) => o.isCorrect) && (
                  <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Please mark one option as correct.
                  </p>
                )}
              </div>
            )}

            {/* ── Image Upload / URL ── */}
            {(form.type === "image" || form.type === "mixed") && (
              <div className="bg-green-50 rounded-2xl border border-green-200 p-5 mb-4">
                <label className="block text-sm font-semibold text-green-800 mb-1">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Image <span className="text-red-500">*</span>
                </label>

                {/* Drag & Drop Zone */}
                {!form.content.imageUrl ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOverImage(true); }}
                    onDragLeave={() => setDragOverImage(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setDragOverImage(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith("image/")) {
                        uploadToS3(file, "image", setUploadingImage, (url) => updateContent("imageUrl", url));
                      } else { setError("Please drop an image file (JPG, PNG, SVG, GIF)."); }
                    }}
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
                      ${dragOverImage ? "border-green-500 bg-green-100 scale-[1.01]" : "border-green-300 bg-white hover:border-green-400 hover:bg-green-50"}`}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadToS3(file, "image", setUploadingImage, (url) => updateContent("imageUrl", url));
                        e.target.value = "";
                      }}
                    />
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                        <p className="text-sm font-semibold text-green-700">Uploading to S3...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-green-500" />
                        </div>
                        <p className="text-sm font-semibold text-green-700">
                          Drag & drop an image here
                        </p>
                        <p className="text-xs text-green-500">or click to browse · JPG, PNG, SVG, GIF · Max 10 MB</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 border border-green-200 rounded-2xl overflow-hidden bg-white relative group">
                    <img
                      src={form.content.imageUrl}
                      alt="Preview"
                      className="max-h-56 w-full object-contain"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => updateContent("imageUrl", "")}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-red-600 text-sm font-semibold shadow-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                    <div className="px-3 py-2 bg-green-50 border-t border-green-200">
                      <p className="text-[10px] text-green-600 truncate">{form.content.imageUrl}</p>
                    </div>
                  </div>
                )}

                {/* Or paste URL */}
                {!form.content.imageUrl && (
                  <div className="mt-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-px bg-green-200" />
                      <span className="text-[10px] text-green-500 font-semibold uppercase">or paste URL</span>
                      <div className="flex-1 h-px bg-green-200" />
                    </div>
                    <input
                      type="url"
                      value={form.content.imageUrl}
                      onChange={(e) => updateContent("imageUrl", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-green-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                      placeholder="https://example.com/diagram.png"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Audio Upload / URL ── */}
            {(form.type === "audio" || form.type === "mixed") && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 mb-4">
                <label className="block text-sm font-semibold text-amber-800 mb-1">
                  <Headphones className="w-4 h-4 inline mr-1" />
                  Audio <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-amber-600 mb-3">Upload an audio file or paste a URL (MP3, WAV, OGG).</p>

                {/* Drag & drop zone or audio preview */}
                {!form.content.audioUrl ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOverAudio(true); }}
                    onDragLeave={() => setDragOverAudio(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setDragOverAudio(false);
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith("audio/")) {
                        uploadToS3(file, "audio", setUploadingAudio, (url) => updateContent("audioUrl", url));
                      }
                    }}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "audio/mpeg,audio/wav,audio/mp3,audio/ogg,audio/webm,audio/aac";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) uploadToS3(file, "audio", setUploadingAudio, (url) => updateContent("audioUrl", url));
                      };
                      input.click();
                    }}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                      ${dragOverAudio
                        ? "border-amber-500 bg-amber-100 scale-[1.01]"
                        : "border-amber-300 bg-white hover:border-amber-400 hover:bg-amber-50"}`}
                  >
                    {uploadingAudio ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                        <p className="text-sm font-semibold text-amber-700">Uploading to S3...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-amber-500" />
                        </div>
                        <p className="text-sm font-semibold text-amber-700">
                          Drag & drop an audio file here
                        </p>
                        <p className="text-xs text-amber-500">or click to browse · MP3, WAV, OGG, AAC · Max 50 MB</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 border border-amber-200 rounded-2xl overflow-hidden bg-white relative group">
                    <div className="p-4">
                      <audio controls className="w-full" src={form.content.audioUrl} />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => updateContent("audioUrl", "")}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-red-600 text-sm font-semibold shadow-lg hover:bg-red-50 transition-colors border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                    <div className="px-3 py-2 bg-amber-50 border-t border-amber-200">
                      <p className="text-[10px] text-amber-600 truncate">{form.content.audioUrl}</p>
                    </div>
                  </div>
                )}

                {/* Or paste URL */}
                {!form.content.audioUrl && (
                  <div className="mt-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-px bg-amber-200" />
                      <span className="text-[10px] text-amber-500 font-semibold uppercase">or paste URL</span>
                      <div className="flex-1 h-px bg-amber-200" />
                    </div>
                    <input
                      type="url"
                      value={form.content.audioUrl}
                      onChange={(e) => updateContent("audioUrl", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                      placeholder="https://example.com/listening.mp3"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Fill-in-the-Blanks Builder (for audio, image, mixed) ── */}
            {(form.type === "audio" || form.type === "image" || form.type === "mixed") && (
              <div className="bg-cyan-50 rounded-2xl border border-cyan-200 p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-cyan-800 flex items-center gap-1.5">
                      <ListChecks className="w-4 h-4" />
                      Fill-in-the-Blanks
                    </h3>
                    <p className="text-xs text-cyan-600 mt-0.5">
                      Add numbered blanks with correct answers. Use <code className="bg-cyan-100 px-1 rounded text-[10px]">{"{{1}}"}</code>, <code className="bg-cyan-100 px-1 rounded text-[10px]">{"{{2}}"}</code> in your question text, or provide an image with blanks.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addBlank}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-200 text-cyan-800 text-xs font-semibold hover:bg-cyan-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Blank
                  </button>
                </div>

                {form.content.blanks.length === 0 ? (
                  <p className="text-xs text-cyan-500 italic text-center py-4">
                    No blanks added. Students will answer with a regular text box.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.content.blanks.map((blank, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white rounded-xl border border-cyan-200 p-3">
                        <span className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {blank.id}
                        </span>
                        <input
                          type="text"
                          value={blank.correctAnswer}
                          onChange={(e) => updateBlank(idx, e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
                          placeholder={`Correct answer for blank #${blank.id}...`}
                        />
                        <button
                          type="button"
                          onClick={() => removeBlank(idx)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {form.content.blanks.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-cyan-600 bg-cyan-100 rounded-lg px-3 py-2">
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Each blank is scored equally. Total = max score ÷ {form.content.blanks.length} blanks = {(form.rubric.maxScore / form.content.blanks.length).toFixed(1)} pts each</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Instructions (for letter_writing, image, audio, voice) ── */}
            {(form.type === "letter_writing" || form.type === "image" || form.type === "audio" || form.type === "voice") && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Special Instructions <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  {form.type === "letter_writing"
                    ? "Format requirements, word limits, tone expectations."
                    : form.type === "voice"
                    ? "Speaking duration, language, fluency expectations."
                    : "Additional context for media-based question."}
                </p>
                <textarea
                  value={form.content.instructions}
                  onChange={(e) => updateContent("instructions", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-violet-200"
                  rows={3}
                  placeholder={
                    form.type === "letter_writing"
                      ? "e.g., Use formal tone. Include sender address, date, subject. Minimum 150 words."
                      : "Additional instructions..."
                  }
                />
              </div>
            )}

            {/* ── Code Test Cases ── */}
            {form.type === "code" && (
              <div className="bg-orange-50 rounded-2xl border border-orange-200 p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-orange-800">Test Cases</h3>
                    <p className="text-xs text-orange-600">Input/output pairs for automated evaluation.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addTestCase}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-200 text-orange-800 text-xs font-semibold hover:bg-orange-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
                {form.testCases.length === 0 && (
                  <p className="text-xs text-orange-500 italic text-center py-4">No test cases yet.</p>
                )}
                <div className="space-y-3">
                  {form.testCases.map((tc, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-orange-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-orange-700">#{idx + 1}</span>
                        <button type="button" onClick={() => removeTestCase(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Input</label>
                          <textarea
                            value={tc.input}
                            onChange={(e) => updateTestCase(idx, "input", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-orange-200"
                            rows={2}
                            placeholder="stdin input..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Expected Output</label>
                          <textarea
                            value={tc.expectedOutput}
                            onChange={(e) => updateTestCase(idx, "expectedOutput", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-orange-200"
                            rows={2}
                            placeholder="expected stdout..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Formula (for math questions) ── */}
            {(form.domain === "math" || form.content.formula) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Formula <span className="text-xs font-normal text-gray-400">(LaTeX — optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.content.formula}
                    onChange={(e) => updateContent("formula", e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-200"
                    placeholder="e.g. E = mc^2"
                  />
                  {form.content.formula && (
                    <button
                      type="button"
                      onClick={() => setFormulaPreview((p) => !p)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      {formulaPreview ? "Hide" : "Preview"}
                    </button>
                  )}
                </div>
                {formulaPreview && form.content.formula && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                    <KaTeXRenderer formula={form.content.formula} displayMode />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════ STEP 3: Answer & Scoring ═══════════ */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <span className="text-sm font-bold text-violet-600">3</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Answer & Scoring</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Max Score */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Max Score <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.rubric.maxScore}
                  onChange={(e) => updateRubric("maxScore", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                  min={1}
                  step={1}
                />
              </div>

              {/* AI Auto-Rubric Banner */}
              <div className="md:col-span-2 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl border border-violet-200 p-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-violet-800">AI Auto-Rubric</h3>
                  <p className="text-xs text-violet-600 mt-0.5">
                    Grading criteria auto-generated from domain + type. Override below if needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Expected Answer (not for MCQ) */}
            {form.type !== "mcq" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Expected / Model Answer <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <p className="text-xs text-gray-400 mb-3">AI compares responses against this for grading.</p>
                <textarea
                  value={form.expectedAnswer}
                  onChange={(e) => updateField("expectedAnswer", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-violet-200"
                  rows={4}
                  placeholder={
                    form.type === "letter_writing"
                      ? "Write the model letter/application here..."
                      : form.type === "code"
                      ? "Write the expected code solution here..."
                      : "Enter key points the student should cover..."
                  }
                />
              </div>
            )}

            {/* ── Advanced: Custom Rubric (collapsed) ── */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">Advanced: Custom Rubric</span>
                  {showCustomRubric && form.rubric.criteria.length > 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${weightOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {totalWeight.toFixed(2)} / 1.00
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </button>

              {showAdvanced && (
                <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCustomRubric}
                      onChange={(e) => setShowCustomRubric(e.target.checked)}
                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-200"
                    />
                    <span className="text-sm text-gray-700">Override auto-rubric with custom criteria</span>
                  </label>

                  {showCustomRubric && (
                    <>
                      {form.rubric.criteria.map((criterion, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-gray-500">Criterion {idx + 1}</span>
                            <button type="button" onClick={() => removeCriteria(idx)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                              <input
                                type="text"
                                placeholder="Name (e.g. Accuracy)"
                                value={criterion.name}
                                onChange={(e) => updateCriteria(idx, "name", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                              />
                            </div>
                            <input
                              type="number"
                              placeholder="Weight"
                              value={criterion.weight}
                              onChange={(e) => updateCriteria(idx, "weight", parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                              min={0} max={1} step={0.05}
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="What to evaluate..."
                            value={criterion.description}
                            onChange={(e) => updateCriteria(idx, "description", e.target.value)}
                            className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addCriteria}
                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs font-semibold text-gray-400 hover:border-violet-300 hover:text-violet-600 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Criterion
                      </button>

                      <div className="pt-3 border-t border-gray-100">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Grading Logic <span className="text-gray-400 font-normal">(optional)</span></label>
                        <textarea
                          value={form.rubric.gradingLogic}
                          onChange={(e) => updateRubric("gradingLogic", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-violet-200"
                          rows={2}
                          placeholder="Extra AI grading instructions..."
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ═══════════ Summary Preview ═══════════ */}
          <div className={`rounded-2xl border p-5 ${selectedType ? `${selectedType.bg} ${selectedType.color}` : "bg-violet-50 border-violet-200"}`}>
            <h3 className={`text-sm font-semibold mb-3 ${selectedType?.text || "text-violet-800"}`}>Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-gray-500 font-medium">Type</span>
                <p className={`font-bold capitalize mt-0.5 ${selectedType?.text || "text-gray-800"}`}>{selectedType?.label}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Score</span>
                <p className="text-gray-800 font-semibold mt-0.5">{form.rubric.maxScore} pts</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Folder</span>
                <p className="text-gray-800 font-semibold mt-0.5 truncate">{selectedFolder?.name || "—"}</p>
              </div>
            </div>
            {form.content.text && (
              <div className="mt-3 pt-3 border-t border-gray-200/50">
                <span className="text-gray-500 font-medium text-xs">Preview</span>
                <p className="text-sm text-gray-900 mt-1 line-clamp-2">{form.content.text}</p>
              </div>
            )}
            {form.type === "mcq" && form.content.options.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.content.options.map((o) => (
                  <span key={o.label} className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.isCorrect ? "bg-green-200 text-green-800" : "bg-white/70 text-gray-600"}`}>
                    {o.label}: {o.text || "..."}
                  </span>
                ))}
              </div>
            )}
            {(form.content.blanks ?? []).length > 0 && (
              <div className="mt-2">
                <span className="text-[10px] text-cyan-600 font-semibold">{form.content.blanks.length} blanks</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.content.blanks.map((b) => (
                    <span key={b.id} className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-medium">
                      #{b.id}: {b.correctAnswer || "..."}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══════════ Submit ═══════════ */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push("/admin/questions")}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" />{questionId ? "Update Question" : "Create Question"}</>
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
