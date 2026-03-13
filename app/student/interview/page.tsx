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
} from "lucide-react";

interface ResumePreview {
  name: string;
  skills: string[];
  domain: string;
  experience: { role: string; company: string; duration: string }[];
  education: string;
  projectCount: number;
}

const QUALIFICATIONS = [
  { label: "B.Tech / B.E", icon: "🎓" },
  { label: "BCA / MCA / B.Sc IT", icon: "💻" },
  { label: "M.Tech / M.E", icon: "🔬" },
  { label: "MBA / BBA", icon: "📊" },
  { label: "B.Com / M.Com / CA", icon: "📈" },
  { label: "BA / MA", icon: "📝" },
  { label: "B.Sc / M.Sc", icon: "🧪" },
  { label: "Diploma / ITI", icon: "🔧" },
  { label: "Others", icon: "📚" },
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

  const availableRoles = qualification
    ? ROLES_BY_QUALIFICATION[qualification] || []
    : [];
  const filteredRoles = roleSearch
    ? availableRoles.filter((r) =>
        r.toLowerCase().includes(roleSearch.toLowerCase())
      )
    : availableRoles;

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB.");
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(
            `[PDF Resume: ${file.name}] — Please extract and summarize the candidate's skills, experience, projects, and education from this resume.`
          );
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      const res = await fetch("/api/ai/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text }),
      });
      const data = await res.json();

      if (data.success) {
        const parsed = data.data.parsed;
        setResumeText(text);
        setResumePreview({
          name: parsed.name,
          skills: parsed.skills ?? [],
          domain: parsed.domain,
          experience: parsed.experience ?? [],
          education: parsed.education,
          projectCount: (parsed.projects ?? []).length,
        });
      } else {
        setError("Could not parse PDF. Please try again.");
      }
    } catch {
      setError("Failed to read file. Please try again.");
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
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-8">
      {stepLabels.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              i < stepIndex
                ? "bg-green-500 text-white"
                : i === stepIndex
                ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30 ring-4 ring-primary-100"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          <span
            className={`text-xs font-semibold hidden sm:block ${
              i === stepIndex ? "text-primary-700" : i < stepIndex ? "text-green-600" : "text-gray-400"
            }`}
          >
            {s}
          </span>
          {i < stepLabels.length - 1 && (
            <div
              className={`w-8 sm:w-14 h-0.5 rounded-full transition-all duration-300 ${
                i < stepIndex ? "bg-green-400" : "bg-gray-200"
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6 sm:py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <Image
              src="/image/VULCAN Logo_transparent.png"
              alt="Vulcan Prep"
              width={72}
              height={72}
              className="mx-auto mb-5"
            />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Interview Setup
            </h1>
            <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm leading-relaxed">
              Personalize your test by selecting your background and target role.
            </p>
          </div>

          <ProgressBar />

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-700 mb-6 animate-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1 text-xs">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-5">
            {/* ─── Qualification ─── */}
            <div className="card p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                  <GraduationCap className="w-4.5 h-4.5 text-primary-700" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Qualification</h2>
                  <p className="text-[11px] text-gray-400">Select your highest degree</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {QUALIFICATIONS.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => {
                      setQualification(q.label);
                      setRole("");
                      setRoleSearch("");
                    }}
                    className={`group relative px-3 py-3 rounded-xl text-left border-2 transition-all duration-200 ${
                      qualification === q.label
                        ? "bg-primary-50 border-primary-400 shadow-sm shadow-primary-100"
                        : "bg-white border-gray-100 hover:border-primary-200 hover:bg-primary-50/30"
                    }`}
                  >
                    <span className="text-lg block mb-1">{q.icon}</span>
                    <span
                      className={`text-[11px] font-semibold leading-tight block ${
                        qualification === q.label ? "text-primary-800" : "text-gray-600"
                      }`}
                    >
                      {q.label}
                    </span>
                    {qualification === q.label && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Role ─── */}
            <div className="card p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Briefcase className="w-4.5 h-4.5 text-accent" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Target Role <span className="text-red-500">*</span>
                  </h2>
                  <p className="text-[11px] text-gray-400">What position are you preparing for?</p>
                </div>
              </div>

              {qualification ? (
                <>
                  <div className="relative mb-3">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition-all bg-gray-50/50 focus:bg-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredRoles.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all duration-200 ${
                          role === r
                            ? "bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]"
                            : "bg-white text-gray-600 border-gray-100 hover:border-accent/30 hover:text-accent hover:bg-accent/5"
                        }`}
                      >
                        {role === r && <Check className="w-3 h-3 inline mr-1" />}
                        {r}
                      </button>
                    ))}
                    {filteredRoles.length === 0 && (
                      <p className="text-xs text-gray-400 py-3 text-center w-full">No roles match your search.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl px-4 py-6 text-center">
                  <Briefcase className="w-6 h-6 text-gray-300" />
                  <span className="text-sm text-gray-400 font-medium">Pick a qualification above to see roles</span>
                </div>
              )}
            </div>

            {/* ─── Resume ─── */}
            <div className="card p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                  <FileText className="w-4.5 h-4.5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-gray-900">Resume</h2>
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">AI personalizes questions based on your skills</p>
                </div>
              </div>

              {resumePreview ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-bold text-green-800">Resume Analyzed</span>
                    </div>
                    <button
                      onClick={removeResume}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {resumePreview.name && (
                      <div>
                        <span className="text-[10px] text-green-600 uppercase tracking-widest font-bold">Name</span>
                        <p className="font-semibold text-gray-800 text-sm">{resumePreview.name}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-green-600 uppercase tracking-widest font-bold">Domain</span>
                      <p className="font-semibold text-gray-800 capitalize text-sm">{resumePreview.domain}</p>
                    </div>
                    {resumePreview.skills.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-green-600 uppercase tracking-widest font-bold">Skills</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {resumePreview.skills.slice(0, 8).map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-white/80 border border-green-200 text-xs text-green-700 rounded-lg font-medium">
                              {s}
                            </span>
                          ))}
                          {resumePreview.skills.length > 8 && (
                            <span className="px-2 py-0.5 text-xs text-green-500 font-medium">
                              +{resumePreview.skills.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all duration-300 group ${
                    isDragOver
                      ? "border-violet-400 bg-violet-50 scale-[1.01]"
                      : isParsing
                      ? "border-violet-300 bg-violet-50"
                      : "border-gray-200 hover:border-violet-300 hover:bg-violet-50/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  {isParsing ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                        <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
                      </div>
                      <div>
                        <p className="text-sm text-violet-700 font-semibold">Analyzing with AI...</p>
                        <p className="text-xs text-violet-400 mt-0.5">Extracting skills & experience</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center transition-colors">
                        <Upload className="w-7 h-7 text-violet-500 group-hover:text-violet-600 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          Drop your resume here or{" "}
                          <span className="text-violet-600 underline underline-offset-2">browse</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PDF format, max 5MB</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Continue ─── */}
            <button
              onClick={handleProceedToTerms}
              disabled={!canProceed}
              className="w-full bg-gradient-to-r from-primary-600 to-accent text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 active:translate-y-0 text-base"
            >
              <Sparkles className="w-5 h-5" />
              Continue to Terms
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-[11px] text-center text-gray-400 leading-relaxed pb-4">
              AI-powered questions tailored to your role. Evaluated with detailed scoring and feedback.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── TERMS & CONDITIONS STEP ──
  if (step === "terms") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6 sm:py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <Image
              src="/image/VULCAN Logo_transparent.png"
              alt="Vulcan Prep"
              width={56}
              height={56}
              className="mx-auto mb-4"
            />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Test Rules
            </h1>
            <p className="text-gray-500 mt-2 text-sm">Read carefully before proceeding</p>
          </div>

          <ProgressBar />

          <div className="card p-5 sm:p-6">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <Shield className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                This is a proctored test. Your activity, camera, and microphone will be monitored.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { icon: MonitorOff, title: "No Tab Switching", desc: "Leaving this window triggers a violation", color: "text-red-500", bg: "bg-red-50" },
                { icon: ClipboardX, title: "No Copy & Paste", desc: "Disabled except in code editor", color: "text-orange-500", bg: "bg-orange-50" },
                { icon: Camera, title: "Camera Monitoring", desc: "Webcam active for proctoring", color: "text-blue-500", bg: "bg-blue-50" },
                { icon: Eye, title: "Fullscreen Required", desc: "Exiting fullscreen = warning", color: "text-violet-500", bg: "bg-violet-50" },
                { icon: Shield, title: "Warning System", desc: "Violations logged for reviewers", color: "text-yellow-600", bg: "bg-yellow-50" },
                { icon: Ban, title: "No External Help", desc: "No AI tools or other websites", color: "text-gray-500", bg: "bg-gray-50" },
              ].map((rule) => (
                <div key={rule.title} className={`flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 ${rule.bg}`}>
                  <rule.icon className={`w-4 h-4 mt-0.5 shrink-0 ${rule.color}`} />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{rule.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{rule.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <label className="flex items-center gap-3.5 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all group">
              <div
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                  termsAccepted ? "bg-primary-600 border-primary-600" : "border-gray-300 group-hover:border-primary-400"
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

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setStep("setup"); setTermsAccepted(false); }}
                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleAcceptTerms}
                disabled={!termsAccepted}
                className="flex-[2] bg-gradient-to-r from-primary-600 to-accent text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5"
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <Image
            src="/image/VULCAN Logo_transparent.png"
            alt="Vulcan Prep"
            width={56}
            height={56}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Camera & Microphone
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Grant access to begin the proctored test</p>
        </div>

        <ProgressBar />

        <div className="card p-5 sm:p-6">
          {/* Camera preview */}
          <div className="mb-6">
            <div className="aspect-video max-w-sm mx-auto bg-gray-900 rounded-2xl overflow-hidden relative shadow-xl">
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
                    <span className="text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
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
            <div className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
              cameraGranted ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200"
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                cameraGranted ? "bg-green-500" : "bg-gray-200"
              }`}>
                <Camera className={`w-4 h-4 ${cameraGranted ? "text-white" : "text-gray-400"}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Camera</p>
                <p className={`text-[11px] font-medium ${cameraGranted ? "text-green-600" : "text-gray-400"}`}>
                  {cameraGranted ? "Ready" : "Pending"}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
              micGranted ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200"
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                micGranted ? "bg-green-500" : "bg-gray-200"
              }`}>
                <Mic className={`w-4 h-4 ${micGranted ? "text-white" : "text-gray-400"}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Microphone</p>
                <p className={`text-[11px] font-medium ${micGranted ? "text-green-600" : "text-gray-400"}`}>
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
              className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-accent/20"
            >
              <Camera className="w-5 h-5" />
              <Mic className="w-5 h-5" />
              Allow Camera & Microphone
            </button>
          ) : (
            <button
              onClick={handleStartInterview}
              disabled={isStarting}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-green-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-base"
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
