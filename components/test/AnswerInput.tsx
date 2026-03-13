"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Square, AlertCircle } from "lucide-react";
import { CodeEditor, CodeLanguage } from "./CodeEditor";

interface AnswerInputProps {
  questionType: string;
  value: string;
  codeValue?: string;
  codeLanguage?: CodeLanguage;
  voiceTranscript?: string;
  onChange: (value: string) => void;
  onCodeChange?: (code: string) => void;
  onLanguageChange?: (lang: CodeLanguage) => void;
  onVoiceTranscript?: (transcript: string) => void;
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
  value,
  codeValue = "",
  codeLanguage = "python",
  voiceTranscript = "",
  onChange,
  onCodeChange,
  onLanguageChange,
  onVoiceTranscript,
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

  // Default: text / hr / mixed / aptitude
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
