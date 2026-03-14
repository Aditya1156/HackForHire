"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Upload,
  FileText,
  Loader2,
  ChevronRight,
  CheckCircle2,
  X,
  AlertCircle,
  GraduationCap,
  Briefcase,
  ChevronLeft,
  Camera,
  Mic,
  Shield,
  Eye,
  Ban,
  MonitorOff,
  ClipboardX,
  Sparkles,
  Search,
  ArrowRight,
  Check,
  Star,
  Zap,
  User,
  BookOpen,
  Code2,
  BrainCircuit,
  Layers,
} from "lucide-react";

interface ResumePreview {
  name: string;
  skills: string[];
  domain: string;
  experience: { role: string; company: string; duration: string }[];
  education: string;
  projectCount: number;
  projects: { name: string; description: string; tech: string[] }[];
}

const QUALIFICATIONS = [
  { label: "B.Tech / B.E", icon: "🎓", color: "from-blue-500 to-indigo-500" },
  { label: "BCA / MCA / B.Sc IT", icon: "💻", color: "from-cyan-500 to-blue-500" },
  { label: "M.Tech / M.E", icon: "🔬", color: "from-purple-500 to-indigo-500" },
  { label: "MBA / BBA", icon: "📊", color: "from-amber-500 to-orange-500" },
  { label: "B.Com / M.Com / CA", icon: "📈", color: "from-emerald-500 to-green-500" },
  { label: "BA / MA", icon: "📝", color: "from-rose-500 to-pink-500" },
  { label: "B.Sc / M.Sc", icon: "🧪", color: "from-teal-500 to-cyan-500" },
  { label: "Diploma / ITI", icon: "🔧", color: "from-gray-500 to-slate-500" },
  { label: "Others", icon: "📚", color: "from-violet-500 to-purple-500" },
];

const ROLES_BY_QUALIFICATION: Record<string, string[]> = {
  "B.Tech / B.E": [
    "Software Developer", "SDE", "Frontend Developer", "Backend Developer",
    "Full Stack Developer", "Mobile Developer", "DevOps Engineer", "Cloud Architect",
    "Data Scientist", "Machine Learning Engineer", "AI Engineer", "Cybersecurity Analyst",
    "Embedded Systems Engineer", "System Design Engineer", "QA Engineer", "Product Manager (Tech)",
  ],
  "BCA / MCA / B.Sc IT": [
    "Software Developer", "SDE", "Full Stack Developer", "Frontend Developer",
    "Backend Developer", "Web Developer", "Mobile Developer", "QA Engineer",
    "Database Administrator", "IT Support Engineer", "System Administrator", "UI/UX Designer",
    "Python Developer", "Java Developer", "Data Analyst", "Cloud Engineer",
  ],
  "M.Tech / M.E": [
    "Machine Learning Engineer", "AI Engineer", "Data Scientist", "Research Scientist",
    "NLP Engineer", "Computer Vision Engineer", "Cloud Architect", "Cybersecurity Analyst",
    "Robotics Engineer", "System Design Engineer", "R&D Engineer", "Big Data Engineer",
  ],
  "MBA / BBA": [
    "Business Analyst", "Product Manager", "Marketing Manager", "HR Manager",
    "Finance Manager", "Operations Manager", "Consultant", "Strategy Analyst",
    "Brand Manager", "Supply Chain Manager", "Project Manager", "Investment Banker",
    "Sales Manager", "Business Development Manager", "Management Trainee",
  ],
  "B.Com / M.Com / CA": [
    "Accountant", "Financial Analyst", "Tax Consultant", "Auditor",
    "Investment Banker", "Banking Officer", "Insurance Analyst", "Cost Analyst",
    "Budget Analyst", "Equity Research Analyst", "Payroll Specialist", "GST Consultant", "Risk Analyst",
  ],
  "BA / MA": [
    "Content Writer", "Journalist", "Public Relations Manager", "Social Media Manager",
    "Copywriter", "UX Researcher", "Policy Analyst", "HR Executive",
    "Communications Specialist", "Research Associate", "Creative Director", "Event Manager", "Corporate Trainer",
  ],
  "B.Sc / M.Sc": [
    "Data Analyst", "Research Scientist", "Lab Technician", "Biotech Researcher",
    "Statistician", "Quality Analyst", "Environmental Scientist", "Clinical Research Associate",
    "Bioinformatics Analyst", "Science Writer", "Data Scientist",
  ],
  "Diploma / ITI": [
    "Technical Support Engineer", "Network Engineer", "AutoCAD Operator", "CNC Operator",
    "Electrician", "Web Developer", "Data Entry Operator", "Desktop Support",
    "Hardware Engineer", "CCTV Technician", "Mobile Repair Technician",
  ],
  "Others": [
    "Customer Success Manager", "Sales Executive", "Administrative Officer", "Operations Executive",
    "Digital Marketing Executive", "Content Creator", "Executive Assistant", "Relationship Manager",
    "Recruiter", "General Management Trainee",
  ],
};

type Step = "setup" | "terms" | "permissions";

export default function InterviewSetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const camPreviewRef = useRef<HTMLVideoElement>(null);

  const [step, setStep] = useState<Step>("setup");
  const [qualification, setQualification] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumePreview, setResumePreview] = useState<ResumePreview | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [fileName, setFileName] = useState("");

  const availableRoles = qualification
    ? ROLES_BY_QUALIFICATION[qualification] || []
    : [];
  const filteredRoles = roleSearch
    ? availableRoles.filter((r) =>
        r.toLowerCase().includes(roleSearch.toLowerCase())
      )
    : availableRoles;

  // Upload the actual file to the server for proper PDF text extraction
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") && !file.name.toLowerCase().endsWith(".docx") && !file.name.toLowerCase().endsWith(".txt")) {
      setError("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB.");
      return;
    }

    setIsParsing(true);
    setError(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ai/parse-resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        const parsed = data.data.parsed;
        setResumeText(data.data.extractedText || "");
        setResumePreview({
          name: parsed.name || "",
          skills: parsed.skills ?? [],
          domain: parsed.domain || "",
          experience: parsed.experience ?? [],
          education: parsed.education || "",
          projectCount: (parsed.projects ?? []).length,
          projects: parsed.projects ?? [],
        });
      } else {
        setError(data.error || "Could not parse resume. Please try again.");
      }
    } catch {
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const removeResume = () => {
    setResumeText("");
    setResumePreview(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProceedToTerms = () => {
    if (!role.trim()) {
      setError("Please select the role you are interviewing for.");
      return;
    }
    setError(null);
    setStep("terms");
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setStep("permissions");
  };

  const requestPermissions = async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 240 },
        audio: true,
      });
      setMediaStream(stream);
      setCameraGranted(true);
      setMicGranted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Permission denied";
      if (msg.includes("video") || msg.includes("camera")) {
        setPermissionError("Camera access denied. Please allow camera access in browser settings.");
      } else if (msg.includes("audio") || msg.includes("microphone")) {
        setPermissionError("Microphone access denied. Please allow mic access in browser settings.");
      } else {
        setPermissionError("Camera & Microphone access denied. Please allow access and try again.");
      }
    }
  };

  useEffect(() => {
    if (camPreviewRef.current && mediaStream) {
      camPreviewRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [mediaStream]);

  const handleStartInterview = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const res = await fetch("/api/tests/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role.trim(),
          resumeText: resumeText || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem("proctoring_enabled", "true");
        router.push(`/student/test/${data.data.testId}`);
      } else {
        setError(data.error ?? "Failed to start interview.");
        setIsStarting(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setIsStarting(false);
    }
  };

  const canProceed = role.trim() && !isStarting;

  // Progress bar
  const stepIndex = step === "setup" ? 0 : step === "terms" ? 1 : 2;
  const stepLabels = ["Setup", "Terms", "Camera"];

  const ProgressBar = () => (
    <div className="flex items-center justify-center gap-0 mb-10">
      {stepLabels.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                i < stepIndex
                  ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-200"
                  : i === stepIndex
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-200 ring-4 ring-violet-100 scale-110"
                  : "bg-gray-100 text-gray-400 border-2 border-gray-200"
              }`}
            >
              {i < stepIndex ? <Check className="w-5 h-5" /> : i + 1}
            </div>
            <span
              className={`text-[11px] font-bold mt-2 transition-colors ${
                i === stepIndex ? "text-violet-700" : i < stepIndex ? "text-green-600" : "text-gray-400"
              }`}
            >
              {s}
            </span>
          </div>
          {i < stepLabels.length - 1 && (
            <div
              className={`w-16 sm:w-24 h-1 rounded-full mx-2 mb-6 transition-all duration-500 ${
                i < stepIndex
                  ? "bg-gradient-to-r from-green-400 to-emerald-400"
                  : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // ── SETUP STEP ──
  if (step === "setup") {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-50 via-white to-cyan-50 py-8 sm:py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-violet-200 mb-5">
              <BrainCircuit className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              AI Interview <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Setup</span>
            </h1>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto text-sm leading-relaxed">
              Personalize your mock interview. Upload your resume and the AI will craft questions tailored to your skills.
            </p>
          </div>

          <ProgressBar />

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-6 animate-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />
              <span className="flex-1 text-sm">{error}</span>
              <button onClick={() => setError(null)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-6">
            {/* ─── Qualification ─── */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-sm shadow-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Qualification</h2>
                  <p className="text-xs text-gray-400">Select your highest degree</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {QUALIFICATIONS.map((q) => {
                  const isSelected = qualification === q.label;
                  return (
                    <button
                      key={q.label}
                      onClick={() => {
                        setQualification(q.label);
                        setRole("");
                        setRoleSearch("");
                      }}
                      className={`group relative px-3 py-3.5 rounded-xl text-left transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-400 shadow-md shadow-violet-100"
                          : "bg-white border-2 border-gray-100 hover:border-violet-200 hover:shadow-md hover:shadow-violet-50"
                      }`}
                    >
                      <span className="text-xl block mb-1.5">{q.icon}</span>
                      <span
                        className={`text-[11px] font-semibold leading-tight block ${
                          isSelected ? "text-violet-800" : "text-gray-600"
                        }`}
                      >
                        {q.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── Role ─── */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-sm shadow-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Target Role <span className="text-red-500">*</span>
                  </h2>
                  <p className="text-xs text-gray-400">What position are you preparing for?</p>
                </div>
              </div>

              {qualification ? (
                <>
                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all bg-gray-50/50 focus:bg-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredRoles.map((r) => {
                      const isSelected = role === r;
                      return (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all duration-200 ${
                            isSelected
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-lg shadow-amber-200/50 scale-[1.03]"
                              : "bg-white text-gray-600 border-gray-100 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/50 hover:shadow-sm"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 inline mr-1.5" />}
                          {r}
                        </button>
                      );
                    })}
                    {filteredRoles.length === 0 && (
                      <p className="text-xs text-gray-400 py-4 text-center w-full">No roles match your search.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-2 border-dashed border-amber-200 rounded-xl px-4 py-8 text-center">
                  <Briefcase className="w-8 h-8 text-amber-300" />
                  <span className="text-sm text-gray-400 font-medium">Pick a qualification above to see roles</span>
                </div>
              )}
            </div>

            {/* ─── Resume Upload ─── */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-sm shadow-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">Resume</h2>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">AI reads your resume to ask relevant, personalized questions</p>
                </div>
              </div>

              {resumePreview ? (
                /* ─── Resume Analyzed Preview ─── */
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-emerald-800">Resume Analyzed</span>
                          <p className="text-[10px] text-emerald-600">{fileName}</p>
                        </div>
                      </div>
                      <button
                        onClick={removeResume}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Name & Domain */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {resumePreview.name && (
                        <div className="bg-white/60 rounded-xl p-3 border border-emerald-100">
                          <div className="flex items-center gap-1.5 mb-1">
                            <User className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] text-emerald-600 uppercase tracking-widest font-bold">Name</span>
                          </div>
                          <p className="font-bold text-gray-800 text-sm">{resumePreview.name}</p>
                        </div>
                      )}
                      <div className="bg-white/60 rounded-xl p-3 border border-emerald-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Layers className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] text-emerald-600 uppercase tracking-widest font-bold">Domain</span>
                        </div>
                        <p className="font-bold text-gray-800 capitalize text-sm">{resumePreview.domain || "General"}</p>
                      </div>
                    </div>

                    {/* Education */}
                    {resumePreview.education && (
                      <div className="bg-white/60 rounded-xl p-3 border border-emerald-100 mb-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <BookOpen className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] text-emerald-600 uppercase tracking-widest font-bold">Education</span>
                        </div>
                        <p className="text-sm text-gray-700">{resumePreview.education}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {resumePreview.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <Zap className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] text-emerald-600 uppercase tracking-widest font-bold">Skills Detected</span>
                          <span className="text-[10px] text-emerald-500 bg-emerald-100 px-1.5 py-0.5 rounded-full font-bold ml-1">
                            {resumePreview.skills.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {resumePreview.skills.map((s) => (
                            <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-200 text-xs text-emerald-700 rounded-lg font-semibold shadow-sm">
                              <Star className="w-2.5 h-2.5 text-emerald-400" />
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {resumePreview.experience.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <Briefcase className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] text-emerald-600 uppercase tracking-widest font-bold">Experience</span>
                        </div>
                        <div className="space-y-2">
                          {resumePreview.experience.map((exp, i) => (
                            <div key={i} className="bg-white/60 rounded-lg px-3 py-2 border border-emerald-100 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-gray-800">{exp.role}</p>
                                <p className="text-[11px] text-gray-500">{exp.company}</p>
                              </div>
                              <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">{exp.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {resumePreview.projects.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <Code2 className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] text-emerald-600 uppercase tracking-widest font-bold">
                            Projects ({resumePreview.projects.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {resumePreview.projects.slice(0, 3).map((proj, i) => (
                            <div key={i} className="bg-white/60 rounded-lg px-3 py-2 border border-emerald-100">
                              <p className="text-xs font-bold text-gray-800">{proj.name}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{proj.description}</p>
                              {proj.tech.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {proj.tech.map((t) => (
                                    <span key={t} className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium">{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl p-3">
                    <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
                    <p className="text-xs text-violet-700 font-medium">
                      AI will use these details to ask questions about your actual projects, skills, and experience.
                    </p>
                  </div>
                </div>
              ) : (
                /* ─── Upload Area ─── */
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group ${
                    isDragOver
                      ? "border-emerald-400 bg-emerald-50 scale-[1.01]"
                      : isParsing
                      ? "border-emerald-300 bg-emerald-50/50"
                      : "border-gray-200 hover:border-emerald-300 hover:bg-gradient-to-br hover:from-emerald-50/30 hover:to-teal-50/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  {isParsing ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                      <div>
                        <p className="text-sm text-emerald-700 font-bold">Analyzing your resume...</p>
                        <p className="text-xs text-emerald-500 mt-1">Extracting skills, experience & projects</p>
                      </div>
                      <div className="w-48 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-pulse" style={{ width: "70%" }} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 group-hover:from-emerald-100 group-hover:to-teal-50 flex items-center justify-center transition-all duration-300 border-2 border-gray-200 group-hover:border-emerald-200">
                        <Upload className="w-7 h-7 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700">
                          Drop your resume here or{" "}
                          <span className="text-emerald-600 underline underline-offset-2 decoration-emerald-300">browse</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1.5">PDF, DOCX, or TXT — max 5MB</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                        <Sparkles className="w-3 h-3" />
                        AI will extract and analyze your skills automatically
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Continue Button ─── */}
            <button
              onClick={handleProceedToTerms}
              disabled={!canProceed}
              className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-violet-200 hover:shadow-2xl hover:shadow-violet-300 hover:-translate-y-0.5 active:translate-y-0 text-base group"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Continue to Terms
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-[11px] text-center text-gray-400 leading-relaxed pb-6">
              AI-powered questions tailored to your role & resume. Evaluated with detailed scoring.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── TERMS & CONDITIONS STEP ──
  if (step === "terms") {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-50 via-white to-cyan-50 py-8 sm:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl shadow-amber-200 mb-5">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Test Rules
            </h1>
            <p className="text-gray-500 mt-2 text-sm">Read carefully before proceeding</p>
          </div>

          <ProgressBar />

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-sm shadow-gray-100 p-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3.5 mb-6">
              <Shield className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                This is a proctored test. Your activity, camera, and microphone will be monitored.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { icon: MonitorOff, title: "No Tab Switching", desc: "Leaving this window triggers a violation", color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
                { icon: ClipboardX, title: "No Copy & Paste", desc: "Disabled except in code editor", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
                { icon: Camera, title: "Camera Monitoring", desc: "Webcam active for proctoring", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
                { icon: Eye, title: "Fullscreen Required", desc: "Exiting fullscreen = warning", color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100" },
                { icon: Shield, title: "Warning System", desc: "Violations logged for reviewers", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-100" },
                { icon: Ban, title: "No External Help", desc: "No AI tools or other websites", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" },
              ].map((rule) => (
                <div key={rule.title} className={`flex items-start gap-3 p-4 rounded-xl border ${rule.bg} ${rule.border}`}>
                  <rule.icon className={`w-5 h-5 mt-0.5 shrink-0 ${rule.color}`} />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{rule.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{rule.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <label className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-all group">
              <div
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                  termsAccepted ? "bg-gradient-to-br from-violet-500 to-purple-600 border-violet-600" : "border-gray-300 group-hover:border-violet-400"
                }`}
              >
                {termsAccepted && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="sr-only"
              />
              <div>
                <p className="text-sm font-bold text-gray-900">I accept the terms and conditions</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  I understand my activity will be monitored and violations recorded.
                </p>
              </div>
            </label>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setStep("setup"); setTermsAccepted(false); }}
                className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleAcceptTerms}
                disabled={!termsAccepted}
                className="flex-[2] bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-violet-200 hover:shadow-xl hover:-translate-y-0.5"
              >
                Accept & Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PERMISSIONS STEP ──
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-50 via-white to-cyan-50 py-8 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-xl shadow-cyan-200 mb-5">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Camera & Microphone
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Grant access to begin the proctored test</p>
        </div>

        <ProgressBar />

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-sm shadow-gray-100 p-6">
          {/* Camera preview */}
          <div className="mb-6">
            <div className="aspect-video max-w-sm mx-auto bg-gray-900 rounded-2xl overflow-hidden relative shadow-2xl shadow-gray-300">
              {mediaStream ? (
                <>
                  <video
                    ref={camPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center">
                    <span className="text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      Looking good! You&apos;re all set.
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-3">
                    <Camera className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Camera preview</p>
                  <p className="text-xs text-gray-600 mt-1">Click below to enable</p>
                </div>
              )}
            </div>
          </div>

          {/* Permission status */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              cameraGranted ? "bg-green-50 border-green-300 shadow-sm shadow-green-100" : "bg-gray-50 border-gray-200"
            }`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                cameraGranted ? "bg-gradient-to-br from-green-400 to-emerald-500 shadow-sm" : "bg-gray-200"
              }`}>
                <Camera className={`w-4 h-4 ${cameraGranted ? "text-white" : "text-gray-400"}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Camera</p>
                <p className={`text-[11px] font-semibold ${cameraGranted ? "text-green-600" : "text-gray-400"}`}>
                  {cameraGranted ? "Ready" : "Pending"}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              micGranted ? "bg-green-50 border-green-300 shadow-sm shadow-green-100" : "bg-gray-50 border-gray-200"
            }`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                micGranted ? "bg-gradient-to-br from-green-400 to-emerald-500 shadow-sm" : "bg-gray-200"
              }`}>
                <Mic className={`w-4 h-4 ${micGranted ? "text-white" : "text-gray-400"}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Microphone</p>
                <p className={`text-[11px] font-semibold ${micGranted ? "text-green-600" : "text-gray-400"}`}>
                  {micGranted ? "Ready" : "Pending"}
                </p>
              </div>
            </div>
          </div>

          {permissionError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-700 mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{permissionError}</span>
            </div>
          )}

          {!cameraGranted || !micGranted ? (
            <button
              onClick={requestPermissions}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-cyan-200 hover:shadow-xl hover:-translate-y-0.5"
            >
              <Camera className="w-5 h-5" />
              <Mic className="w-5 h-5" />
              Allow Camera & Microphone
            </button>
          ) : (
            <button
              onClick={handleStartInterview}
              disabled={isStarting}
              className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-green-200 hover:shadow-2xl hover:shadow-green-300 hover:-translate-y-0.5 active:translate-y-0 text-base"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Launching Test...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Start Proctored Test
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}

          <button
            onClick={() => {
              setStep("terms");
              if (mediaStream) {
                mediaStream.getTracks().forEach((t) => t.stop());
                setMediaStream(null);
                setCameraGranted(false);
                setMicGranted(false);
              }
            }}
            className="w-full mt-3 py-2.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Terms
          </button>
        </div>
      </div>
    </div>
  );
}
