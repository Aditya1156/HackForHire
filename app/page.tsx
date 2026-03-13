import Link from "next/link";
import {
  Brain,
  Code2,
  FileText,
  Mic,
  Star,
  Users,
  Zap,
  ChevronRight,
  CheckCircle,
  BarChart3,
  Target,
  Award,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Rubric-Switching AI",
    description:
      "One Claude API engine with different grading personalities per domain — English, Math, Aptitude, Coding, and HR.",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: Mic,
    title: "Voice + Multilingual",
    description:
      "Students speak in Hindi or Kannada and get evaluated in English. Native Web Speech API — zero extra cost.",
    color: "bg-pink-100 text-pink-600",
  },
  {
    icon: Code2,
    title: "Live Code Execution",
    description:
      "Monaco Editor + Judge0 API runs your code against real test cases with O(n) complexity analysis.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: FileText,
    title: "Resume-Personalized Interviews",
    description:
      "Upload your resume and Claude reads it to ask about YOUR projects, YOUR experience, YOUR skills.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Zap,
    title: "Cross-Question Follow-Ups",
    description:
      "AI probes deeper into weak answers and challenges strong ones — just like a real senior interviewer.",
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    icon: BarChart3,
    title: "AIRS Score",
    description:
      "Adaptive Interview Rating Score — a branded composite score measuring 6 dimensions of interview performance.",
    color: "bg-blue-100 text-blue-600",
  },
];

const domains = [
  { name: "English", badge: "badge-english", desc: "Letters, emails, formal writing" },
  { name: "Mathematics", badge: "badge-math", desc: "Algebra, geometry, word problems" },
  { name: "Aptitude", badge: "badge-aptitude", desc: "Logic, reasoning, patterns" },
  { name: "Coding", badge: "badge-coding", desc: "DSA, algorithms, system design" },
  { name: "HR & Behavioral", badge: "badge-hr", desc: "STAR method, tone analysis" },
];

const stats = [
  { label: "Target Learners", value: "100K+", icon: Users },
  { label: "Domains Covered", value: "5", icon: Globe },
  { label: "AI-Powered", value: "100%", icon: Brain },
  { label: "AIRS Dimensions", value: "6", icon: Award },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VE</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">Versatile Evaluator</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#domains" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Domains
              </a>
              <a href="#about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                About
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="btn-primary btn-sm text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-navy pt-20 pb-32">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-800/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Hackathon badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-white/90 text-xs font-medium">
              Anvesana Hack for Hire — Vulcan Learning Collective LLP
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            AI That Actually{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-accent-light">
              Understands
            </span>
            <br />
            Your Answers
          </h1>

          <p className="max-w-3xl mx-auto text-xl text-white/70 mb-10 leading-relaxed">
            Not just MCQs. Versatile Evaluator grades open-ended answers — letters, math
            proofs, code, and HR responses — with rubric-based AI that gives partial credit,
            tone analysis, and detailed explanations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/auth/register"
              className="group inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-accent/30 text-lg"
            >
              Start a Test
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/auth/register"
              className="group inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 text-lg"
            >
              <Mic className="w-5 h-5" />
              Try Interview Mode
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center"
              >
                <stat.icon className="w-5 h-5 text-primary-300 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Zap className="w-3.5 h-3.5" />
              Platform Capabilities
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Why Versatile Evaluator?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every differentiator built to solve the real problem: automated testing is stuck in
              MCQs. We're changing that.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card-hover p-6 group"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Domains Section */}
      <section id="domains" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                <Target className="w-3.5 h-3.5" />
                5 Domains, One Platform
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                Evaluate Any Kind of Answer
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our rubric-switching engine adapts its grading personality for each domain.
                Math gets strict numerical evaluation. English gets structure + tone analysis.
                HR gets STAR method scoring. Coding gets complexity analysis.
              </p>
              <div className="space-y-4">
                {[
                  "Partial credit — get rewarded for what you know",
                  "Cross-question follow-ups probe deeper understanding",
                  "Instant feedback with specific improvement tips",
                  "Teacher override panel for manual review",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{point}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex gap-4">
                <Link href="/auth/register" className="btn-primary btn-lg">
                  Start Free
                </Link>
                <Link href="/auth/login" className="btn-secondary btn-lg">
                  Sign In
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {domains.map((domain, index) => (
                <div
                  key={domain.name}
                  className="card-hover p-5 flex items-center gap-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-shrink-0">
                    <span className={`badge ${domain.badge} text-sm px-3 py-1`}>
                      {domain.name}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{domain.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-br from-primary-950 to-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-white/60 mb-16 max-w-2xl mx-auto">
            From question to detailed AI feedback in under 10 seconds
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Choose a Domain",
                desc: "Select from English, Math, Aptitude, Coding, or HR. Upload your resume for personalized interview questions.",
                icon: Target,
              },
              {
                step: "02",
                title: "Answer Naturally",
                desc: "Type, speak, or code your answer. Voice input works in Hindi and Kannada. Monaco editor for code.",
                icon: Mic,
              },
              {
                step: "03",
                title: "Get AI Feedback",
                desc: "Instant rubric-based evaluation with partial credit, tone analysis, follow-up questions, and your AIRS score.",
                icon: BarChart3,
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 h-full">
                  <div className="text-5xl font-black text-white/10 mb-4">{item.step}</div>
                  <div className="w-12 h-12 bg-primary-600/30 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <item.icon className="w-6 h-6 text-primary-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-primary-600 to-accent rounded-3xl p-12 shadow-2xl">
            <h2 className="text-4xl font-extrabold text-white mb-4">
              Ready to Evaluate Smarter?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join the platform built for 100,000+ learners. No MCQs. No keyword matching.
              Real AI understanding.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-bold py-4 px-8 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg text-lg"
              >
                Create Free Account
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">VE</span>
              </div>
              <span className="font-semibold">Versatile Evaluator</span>
            </div>
            <p className="text-gray-400 text-sm">
              Built for Anvesana Hack for Hire — Vulcan Learning Collective LLP
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/auth/login" className="hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" className="hover:text-white transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
