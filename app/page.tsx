import Link from "next/link";
import Image from "next/image";
import {
  Brain,
  FileText,
  Mic,
  Star,
  Users,
  ChevronRight,
  CheckCircle,
  BarChart3,
  Target,
  Award,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Briefcase,
  Lightbulb,
  ClipboardList,
  User,
  ShoppingCart,
  LogOut,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Realistic Mock Interviews",
    description:
      "AI-powered interviews that feel just like sitting across a real interviewer. Practice technical, HR, and behavioral rounds.",
    color: "bg-cyan-50 text-cyan-600 border border-cyan-100",
  },
  {
    icon: BarChart3,
    title: "Detailed Assessments",
    description:
      "Get a comprehensive performance report with scores across Confidence, Knowledge, Fluency, Body Language, and Skill Relevance.",
    color: "bg-blue-50 text-blue-600 border border-blue-100",
  },
  {
    icon: Lightbulb,
    title: "Actionable Feedback",
    description:
      "Personalized insights to improve your skills. Know exactly what to work on with specific improvement tips after every session.",
    color: "bg-amber-50 text-amber-600 border border-amber-100",
  },
  {
    icon: FileText,
    title: "ATS Resume Analysis",
    description:
      "Upload your resume and get AI-parsed insights. Interview questions are personalized based on YOUR projects and experience.",
    color: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  },
  {
    icon: MessageSquare,
    title: "Cross-Question Follow-Ups",
    description:
      "AI probes deeper into weak answers and challenges strong ones — just like a real senior interviewer would.",
    color: "bg-purple-50 text-purple-600 border border-purple-100",
  },
  {
    icon: Brain,
    title: "Multi-Domain Intelligence",
    description:
      "One AI engine with different grading personalities — Technical, HR, Behavioral, Coding, and Communication.",
    color: "bg-rose-50 text-rose-600 border border-rose-100",
  },
];

const stats = [
  { label: "Mock Interviews", value: "10K+", icon: Users },
  { label: "Performance", value: "74%+", icon: TrendingUp },
  { label: "AI-Powered", value: "100%", icon: Brain },
  { label: "Score Dimensions", value: "6", icon: Award },
];

const scoreDimensions = [
  { name: "Confidence", stars: 3, max: 5 },
  { name: "Body Language", stars: 3, max: 5 },
  { name: "Knowledge", stars: 4, max: 5 },
  { name: "Fluency", stars: 2, max: 5 },
  { name: "Skill Relevance", stars: 5, max: 5 },
  { name: "Communication", stars: 4, max: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/image/VULCAN Logo_transparent.png"
                alt="Vulcan Prep"
                width={72}
                height={72}
              />
            </div>

            {/* Center Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-cyan-600 border-b-2 border-cyan-500 pb-0.5">
                Home
              </Link>
              <Link href="/student/interview" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Vulcans Interview
              </Link>
              <a href="#about" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                About Us
              </a>
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Contact Us
              </a>
              <Link href="/student/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Reports
              </Link>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/student/interview"
                className="hidden sm:inline-flex items-center gap-2 border-2 border-cyan-500 text-cyan-600 font-semibold text-sm px-4 py-2 rounded-full hover:bg-cyan-50 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Take Interview
              </Link>
              <Link href="/sign-in" className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <User className="w-5 h-5" />
              </Link>
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <ShoppingCart className="w-5 h-5" />
              </button>
              <Link href="/sign-in" className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-cyan-50 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-100 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-cyan-700 text-xs font-semibold tracking-wide">
                  Interview Preparation Platform
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6">
                Vulcan Prep 360{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                  Master interviews
                </span>{" "}
                with ease
              </h1>

              <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-xl">
                Ace your next interview with expert-guided practice sessions,
                mock interviews, and real-time feedback. Vulcan Prep 360 is your
                comprehensive platform to prepare confidently for your next
                career opportunity.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: CheckCircle, text: "Realistic Mock Interviews" },
                  { icon: CheckCircle, text: "Detailed Assessments" },
                  { icon: CheckCircle, text: "Actionable Feedback" },
                  { icon: CheckCircle, text: "ATS Based Resume Analysis" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3.5 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 text-base"
                >
                  Start Practicing
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 px-8 rounded-xl border border-gray-200 transition-all duration-200 text-base"
                >
                  <Mic className="w-5 h-5 text-cyan-500" />
                  Try Interview Mode
                </Link>
              </div>
            </div>

            {/* Right side - Performance Report Card */}
            <div className="relative lg:pl-8">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-w-md mx-auto">
                {/* Report Header */}
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-white" />
                      <span className="text-white font-semibold text-sm">Vulcan Interview Master</span>
                    </div>
                    <span className="bg-white/20 text-white text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Complete
                    </span>
                  </div>
                </div>

                {/* Report Content */}
                <div className="p-6">
                  <div className="text-center mb-5">
                    <h3 className="text-lg font-bold text-gray-900">Your Interview</h3>
                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 font-extrabold text-xl">
                      Performance Report
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Comprehensive insights and personalized recommendations
                    </p>
                  </div>

                  {/* Score Cards */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">186</div>
                      <div className="text-[10px] text-gray-400 font-medium">/250</div>
                      <div className="text-[10px] text-gray-500 mt-1">Total Score</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-600">74.4%</div>
                      <div className="text-[10px] text-gray-500 mt-1">Performance</div>
                    </div>
                    <div className="bg-cyan-50 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-cyan-600">Good</div>
                      <div className="text-[10px] text-gray-500 mt-1">Grade</div>
                    </div>
                  </div>

                  {/* Dimension Stars */}
                  <div className="space-y-2.5">
                    {scoreDimensions.map((dim) => (
                      <div key={dim.name} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium w-28">{dim.name}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: dim.max }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < dim.stars
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400 w-8 text-right">{dim.stars}/{dim.max}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
                <div className="text-3xl font-extrabold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-400 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-100 text-cyan-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Target className="w-3.5 h-3.5" />
              Why Vulcan Prep 360?
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Everything you need to ace your interview
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Practice with an AI that feels just like a real interviewer, without the pressure.
              Sharpen your communication, boost your confidence, and get actionable feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From setup to detailed AI feedback in under 2 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Resume & Choose Role",
                desc: "Upload your resume for personalized questions. Select your target role and interview mode — Technical, HR, or Mixed.",
                icon: FileText,
                color: "bg-cyan-500",
              },
              {
                step: "02",
                title: "Practice with AI Interviewer",
                desc: "Answer questions naturally by typing or speaking. The AI adapts follow-ups based on your responses — just like a real interviewer.",
                icon: Mic,
                color: "bg-blue-500",
              },
              {
                step: "03",
                title: "Get Your Performance Report",
                desc: "Receive a detailed AIRS score across 6 dimensions with specific improvement tips and actionable recommendations.",
                icon: BarChart3,
                color: "bg-indigo-500",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-white rounded-2xl border border-gray-100 p-8 h-full hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center shadow-sm`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-4xl font-black text-gray-100">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance / Interview Modes Section */}
      <section id="performance" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
                <Award className="w-3.5 h-3.5" />
                Interview Modes
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                Practice for any interview scenario
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                Whether it&apos;s a technical deep-dive, an HR behavioral round, or a comprehensive
                mixed interview — Vulcan Prep 360 adapts its AI interviewer to match the real thing.
              </p>
              <div className="space-y-4">
                {[
                  "Resume-personalized questions about YOUR projects",
                  "Voice input in multiple languages (Hindi, Kannada, English)",
                  "Real-time follow-ups that probe deeper understanding",
                  "Comprehensive AIRS score across 6 performance dimensions",
                  "Detailed improvement tips after every session",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">{point}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3.5 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/25 text-base"
                >
                  Start Free Practice
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Interview Mode Cards */}
            <div className="space-y-4">
              {[
                {
                  icon: Brain,
                  title: "Technical Interview",
                  desc: "Deep dive into algorithms, system design, and technical problem-solving tailored to your resume.",
                  color: "border-cyan-200 bg-cyan-50",
                  iconColor: "text-cyan-600",
                },
                {
                  icon: Briefcase,
                  title: "HR / Behavioral",
                  desc: "Behavioral questions, culture fit, communication skills, and STAR method evaluation.",
                  color: "border-blue-200 bg-blue-50",
                  iconColor: "text-blue-600",
                },
                {
                  icon: Sparkles,
                  title: "Mixed Interview",
                  desc: "Best of both worlds — technical + behavioral + resume-based questions in one session.",
                  color: "border-indigo-200 bg-indigo-50",
                  iconColor: "text-indigo-600",
                },
              ].map((mode) => (
                <div
                  key={mode.title}
                  className={`${mode.color} border-2 rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-all duration-200`}
                >
                  <div className="flex-shrink-0">
                    <mode.icon className={`w-7 h-7 ${mode.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{mode.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{mode.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 ml-auto flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="about" className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
            </div>
            <div className="relative">
              <h2 className="text-4xl font-extrabold text-white mb-4">
                Ready to ace your next interview?
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of learners preparing confidently with AI-powered mock interviews.
                Get your first performance report in under 5 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center gap-2 bg-white text-cyan-600 font-bold py-4 px-8 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg text-lg"
                >
                  Create Free Account
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 text-lg"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a3a4a] text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <Image
                src="/image/VULCAN Logo_transparent.png"
                alt="Vulcan Prep"
                width={80}
                height={80}
                className="mb-4 brightness-0 invert"
              />
              <p className="text-gray-300 text-sm leading-relaxed">
                Vulcan Academy empowers students with cutting-edge knowledge and skills, transforming ambition into achievement.
              </p>
            </div>

            {/* Pages */}
            <div>
              <h3 className="text-cyan-400 font-bold text-base mb-4">Pages</h3>
              <ul className="space-y-3">
                <li><Link href="/" className="text-gray-300 hover:text-white text-sm transition-colors">Home</Link></li>
                <li><Link href="/student/interview" className="text-gray-300 hover:text-white text-sm transition-colors">Vulcan Prep 360</Link></li>
                <li><a href="#about" className="text-gray-300 hover:text-white text-sm transition-colors">About Us</a></li>
                <li><a href="#features" className="text-gray-300 hover:text-white text-sm transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-cyan-400 font-bold text-base mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Terms and Conditions</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Payment and Refund Policy</a></li>
              </ul>
            </div>

            {/* Customer Care */}
            <div>
              <h3 className="text-cyan-400 font-bold text-base mb-4">Customer Care</h3>
              <p className="text-gray-300 text-sm">+91 6362 014 532</p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-600 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">&copy; 2026 Vulcan. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {/* LinkedIn */}
              <a href="#" className="w-10 h-10 border border-gray-500 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              {/* Instagram */}
              <a href="#" className="w-10 h-10 border border-gray-500 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
