"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Square, AlertCircle } from "lucide-react";
import { CodeEditor, CodeLanguage } from "./CodeEditor";

interface MCQOption {
  label: string;
  text: string;
  isCorrect: boolean;
}

interface BlankDef {
  id: number;
}

interface MatchingPair {
  id: number;
  item: string;
  correctMatch?: string;
}

interface AnswerInputProps {
  questionType: string;
  answerFormat?: string;
  value: string;
  codeValue?: string;
  codeLanguage?: CodeLanguage;
  voiceTranscript?: string;
  mcqOptions?: MCQOption[];
  blanks?: BlankDef[];
  blanksAnswers?: Record<string, string>;
  matchingPairs?: MatchingPair[];
  multiSelectCorrect?: string[];
  onChange: (value: string) => void;
  onCodeChange?: (code: string) => void;
  onLanguageChange?: (lang: CodeLanguage) => void;
  onVoiceTranscript?: (transcript: string) => void;
  onBlanksChange?: (answers: Record<string, string>) => void;
  onRunCode?: (code: string, language: CodeLanguage) => Promise<void>;
  codeTestResults?: { passed: number; total: number; results: any[] } | null;
  isRunningCode?: boolean;
  disabled?: boolean;
}

// Voice recorder sub-component
function VoiceRecorder({
  onTranscript,
  transcript,
  disabled,
}: {
  onTranscript: (t: string) => void;
  transcript: string;
  disabled?: boolean;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = transcript;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      onTranscript((finalTranscript + interim).trim());
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "aborted") {
        setError(`Recording error: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setError(null);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            ${isRecording
              ? "bg-red-500 hover:bg-red-600 text-white shadow-md animate-pulse"
              : "bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
            }`}
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              {transcript ? "Continue Recording" : "Start Recording"}
            </>
          )}
        </button>

        {isRecording && (
          <div className="flex items-center gap-1.5 text-red-500 text-sm">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Recording...
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {transcript && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-600 mb-1 uppercase tracking-wide">
            Voice Transcript
          </p>
          <p className="text-sm text-blue-900 leading-relaxed">{transcript}</p>
        </div>
      )}
    </div>
  );
}

export function AnswerInput({
  questionType,
  answerFormat,
  value,
  codeValue = "",
  codeLanguage = "python",
  voiceTranscript = "",
  mcqOptions,
  blanks,
  blanksAnswers = {},
  matchingPairs,
  multiSelectCorrect,
  onChange,
  onCodeChange,
  onLanguageChange,
  onVoiceTranscript,
  onBlanksChange,
  onRunCode,
  codeTestResults,
  isRunningCode,
  disabled,
}: AnswerInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  // Fill-in-the-blanks mode
  if (answerFormat === "fill_in_blanks" && blanks && blanks.length > 0) {
    const filledCount = Object.values(blanksAnswers).filter((v) => v.trim()).length;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="label">Fill in the blanks</label>
          <span className="text-xs text-gray-400">
            {filledCount} / {blanks.length} answered
          </span>
        </div>
        <div className="space-y-2">
          {blanks.map((blank) => (
            <div key={blank.id} className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {blank.id}
              </span>
              <input
                type="text"
                value={blanksAnswers[String(blank.id)] || ""}
                onChange={(e) => {
                  const updated = { ...blanksAnswers, [String(blank.id)]: e.target.value };
                  onBlanksChange?.(updated);
                }}
                disabled={disabled}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium
                  focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                placeholder={`Answer for blank #${blank.id}...`}
                maxLength={100}
              />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 italic">
          Write no more than two words and/or a number for each answer.
        </p>
      </div>
    );
  }

  // Matching mode — dropdown per item
  if (answerFormat === "matching" && matchingPairs && matchingPairs.length > 0 && mcqOptions && mcqOptions.length > 0) {
    // Parse current answers from value as JSON or build from scratch
    let matchAnswers: Record<string, string> = {};
    try { matchAnswers = value ? JSON.parse(value) : {}; } catch { matchAnswers = {}; }

    const filledCount = Object.values(matchAnswers).filter((v) => v).length;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="label">Match each item to the correct option</label>
          <span className="text-xs text-gray-400">
            {filledCount} / {matchingPairs.length} matched
          </span>
        </div>
        <div className="space-y-2">
          {matchingPairs.map((pair) => (
            <div key={pair.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3">
              <span className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold shrink-0">
                {pair.id}
              </span>
              <span className="flex-1 text-sm font-medium text-gray-800">{pair.item}</span>
              <select
                value={matchAnswers[String(pair.id)] || ""}
                onChange={(e) => {
                  const updated = { ...matchAnswers, [String(pair.id)]: e.target.value };
                  onChange(JSON.stringify(updated));
                }}
                disabled={disabled}
                className="px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-sm font-medium
                  focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[140px]"
              >
                <option value="">Select...</option>
                {mcqOptions.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}. {opt.text}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Multi-select mode — checkboxes, pick multiple correct answers
  if (answerFormat === "multi_select" && mcqOptions && mcqOptions.length > 0) {
    let selected: string[] = [];
    try { selected = value ? JSON.parse(value) : []; } catch { selected = []; }

    const expectedCount = multiSelectCorrect?.length ?? 2;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="label">Select {expectedCount} answers</label>
          <span className="text-xs text-gray-400">
            {selected.length} / {expectedCount} selected
          </span>
        </div>
        <div className="space-y-2">
          {mcqOptions.map((opt) => {
            const isSelected = selected.includes(opt.label);
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  if (disabled) return;
                  let updated: string[];
                  if (isSelected) {
                    updated = selected.filter((l) => l !== opt.label);
                  } else {
                    updated = [...selected, opt.label];
                  }
                  onChange(JSON.stringify(updated));
                }}
                disabled={disabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left disabled:cursor-not-allowed
                  ${isSelected
                    ? "border-teal-500 bg-teal-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-all
                  ${isSelected
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-500"
                  }`}>
                  {isSelected ? "✓" : opt.label}
                </span>
                <span className={`text-sm ${isSelected ? "text-teal-900 font-medium" : "text-gray-700"}`}>
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 italic">
          Choose exactly {expectedCount} option{expectedCount > 1 ? "s" : ""}.
        </p>
      </div>
    );
  }

  if (questionType === "mcq" && mcqOptions && mcqOptions.length > 0) {
    return (
      <div className="space-y-2">
        <label className="label">Select your answer</label>
        <div className="space-y-2">
          {mcqOptions.map((opt) => {
            const isSelected = value === opt.label;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => !disabled && onChange(opt.label)}
                disabled={disabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left disabled:cursor-not-allowed
                  ${isSelected
                    ? "border-violet-500 bg-violet-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all
                  ${isSelected
                    ? "bg-violet-600 text-white"
                    : "bg-gray-100 text-gray-500"
                  }`}>
                  {opt.label}
                </span>
                <span className={`text-sm ${isSelected ? "text-violet-900 font-medium" : "text-gray-700"}`}>
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (questionType === "code") {
    return (
      <div className="space-y-2">
        <label className="label">Your Code Solution</label>
        <CodeEditor
          value={codeValue}
          language={codeLanguage}
          onChange={(v) => onCodeChange?.(v)}
          onLanguageChange={(l) => onLanguageChange?.(l)}
          onRun={onRunCode}
          testResults={codeTestResults}
          isRunning={isRunningCode}
          readOnly={disabled}
        />
        {/* Also allow text explanation */}
        <div className="mt-3">
          <label className="label text-gray-500 text-xs">
            Explanation (optional — describe your approach)
          </label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Briefly explain your approach and time complexity..."
            className="input-field min-h-[80px] resize-none text-sm"
            rows={3}
          />
        </div>
      </div>
    );
  }

  if (questionType === "voice") {
    return (
      <div className="space-y-4">
        <div>
          <label className="label">Voice Answer</label>
          <VoiceRecorder
            onTranscript={(t) => onVoiceTranscript?.(t)}
            transcript={voiceTranscript}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="label text-gray-500 text-xs">
            Written Answer (optional supplement)
          </label>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Type your answer here, or use the voice recorder above..."
            className="input-field min-h-[120px] resize-none"
            rows={5}
          />
        </div>
      </div>
    );
  }

  if (questionType === "letter_writing") {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="label">Your Letter / Application</label>
          <span className="text-xs text-gray-400">{value.length} chars</span>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Write your letter or application here. Follow the format specified in the instructions above..."
          className="input-field min-h-[280px] resize-none font-serif leading-relaxed"
          rows={14}
        />
      </div>
    );
  }

  // Default: text / hr / mixed / aptitude / image / audio
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="label">Your Answer</label>
        <span className="text-xs text-gray-400">{value.length} chars</span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer here..."
        className="input-field min-h-[160px] resize-none"
        rows={7}
      />
    </div>
  );
}
