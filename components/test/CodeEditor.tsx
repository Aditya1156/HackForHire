"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Play, Copy, Check, ChevronDown } from "lucide-react";

// Lazy-load Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export type CodeLanguage = "python" | "javascript" | "cpp" | "java";

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  time?: string;
  memory?: string;
  error?: string;
}

interface CodeEditorProps {
  value: string;
  language: CodeLanguage;
  onChange: (code: string) => void;
  onLanguageChange: (lang: CodeLanguage) => void;
  onRun?: (code: string, language: CodeLanguage) => Promise<void>;
  testResults?: { passed: number; total: number; results: TestResult[] } | null;
  isRunning?: boolean;
  readOnly?: boolean;
}

const LANGUAGES: { value: CodeLanguage; label: string; monacoId: string }[] = [
  { value: "python", label: "Python", monacoId: "python" },
  { value: "javascript", label: "JavaScript", monacoId: "javascript" },
  { value: "cpp", label: "C++", monacoId: "cpp" },
  { value: "java", label: "Java", monacoId: "java" },
];

const DEFAULT_CODE: Record<CodeLanguage, string> = {
  python: "# Write your function here\n\ndef solution(s):\n    # s is the input string from stdin\n    pass\n",
  javascript: "// Write your function here\n\nfunction solution(s) {\n  // s is the input string from stdin\n  \n}\n",
  cpp: "// Write your function here\n\nstring solution(string s) {\n    // s is the input string from stdin\n    return s;\n}\n",
  java: "// Write your function here\n\nstatic String solution(String s) {\n    // s is the input string from stdin\n    return s;\n}\n",
};

export function CodeEditor({
  value,
  language,
  onChange,
  onLanguageChange,
  onRun,
  testResults,
  isRunning = false,
  readOnly = false,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [showResults, setShowResults] = useState(true);

  const handleLanguageChange = (lang: CodeLanguage) => {
    onLanguageChange(lang);
    if (!value || value === DEFAULT_CODE[language]) {
      onChange(DEFAULT_CODE[lang]);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const monacoLang = LANGUAGES.find((l) => l.value === language)?.monacoId ?? "python";

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as CodeLanguage)}
              disabled={readOnly}
              className="appearance-none bg-gray-700 text-gray-200 text-sm font-medium px-3 py-1.5 pr-8 rounded-lg border border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer disabled:opacity-50"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy button */}
          <button
            onClick={handleCopy}
            title="Copy code"
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 text-xs px-2.5 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>

          {/* Run button */}
          {onRun && (
            <button
              onClick={() => onRun(value, language)}
              disabled={isRunning || readOnly}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Run
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div style={{ height: 300 }}>
        <MonacoEditor
          height={300}
          language={monacoLang}
          value={value || DEFAULT_CODE[language]}
          onChange={(v) => onChange(v ?? "")}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            fontFamily: "JetBrains Mono, monospace",
            lineNumbers: "on",
            readOnly,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: "on",
            theme: "vs-dark",
          }}
          theme="vs-dark"
        />
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="border-t border-gray-700 bg-gray-850">
          <button
            onClick={() => setShowResults((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              Test Results:
              <span
                className={`font-bold ${
                  testResults.passed === testResults.total
                    ? "text-green-400"
                    : testResults.passed > 0
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {testResults.passed}/{testResults.total} passed
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showResults ? "rotate-180" : ""}`}
            />
          </button>

          {showResults && (
            <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
              {testResults.results.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-3 text-xs font-mono border ${
                    r.passed
                      ? "bg-green-900/30 border-green-700/50 text-green-300"
                      : "bg-red-900/30 border-red-700/50 text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${r.passed ? "bg-green-400" : "bg-red-400"}`}
                    />
                    Case {i + 1}: {r.passed ? "PASS" : "FAIL"}
                    {r.time && r.time !== "N/A" && (
                      <span className="text-gray-400 font-normal ml-auto">{r.time}s</span>
                    )}
                  </div>
                  <div className="text-gray-400 space-y-0.5">
                    <div>
                      Input: <span className="text-gray-300">{r.input || "(empty)"}</span>
                    </div>
                    <div>
                      Expected: <span className="text-gray-300">{r.expected}</span>
                    </div>
                    {!r.passed && (
                      <div>
                        Got: <span className="text-gray-300">{r.actual || "(no output)"}</span>
                      </div>
                    )}
                    {r.error && (
                      <div className="text-red-400 mt-1">Error: {r.error.slice(0, 200)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
