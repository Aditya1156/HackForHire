"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, X } from "lucide-react";

interface VoiceControlsProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: string;
}

const LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "hi-IN", label: "Hindi" },
  { code: "kn-IN", label: "Kannada" },
];

export function VoiceControls({ onTranscript, disabled = false, language = "en-US" }: VoiceControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [selectedLang, setSelectedLang] = useState(language);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsRecording(false);
  };

  const startRecording = () => {
    setError(null);
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please type your answer.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = transcript;

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      const current = (finalTranscript + interimTranscript).trim();
      setTranscript(current);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "aborted") {
        setError(`Voice error: ${event.error}. Please type your answer.`);
      }
      stopRecording();
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);

    // Auto-stop after 60 seconds
    timeoutRef.current = setTimeout(() => {
      stopRecording();
    }, 60000);
  };

  const handleToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleClear = () => {
    stopRecording();
    setTranscript("");
    onTranscript("");
  };

  return (
    <div className="space-y-3">
      {/* Language selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Language:</span>
        <div className="flex gap-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              disabled={isRecording}
              className={`px-2.5 py-1 text-xs rounded-full font-medium transition-all
                ${selectedLang === lang.code
                  ? "bg-primary-100 text-primary-700 border border-primary-300"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                } disabled:opacity-50`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recording button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          disabled={disabled}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-all
            ${isRecording
              ? "bg-red-500 hover:bg-red-600 scale-110"
              : "bg-primary-600 hover:bg-primary-700"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          title={isRecording ? "Stop recording" : "Start voice input"}
        >
          {/* Pulsing ring when recording */}
          {isRecording && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-50" />
          )}
          {isRecording ? (
            <MicOff className="w-7 h-7 text-white relative z-10" />
          ) : (
            <Mic className="w-7 h-7 text-white" />
          )}
        </button>

        <div className="flex-1">
          {isRecording ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-600">Recording... (60s max)</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {transcript ? "Recording saved — click mic to record more" : "Click the mic to start voice input"}
            </p>
          )}
        </div>

        {transcript && (
          <button
            onClick={handleClear}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            title="Clear transcript"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Live transcript preview */}
      {transcript && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 font-medium mb-1">Voice transcript:</p>
          <p className="text-sm text-gray-800 leading-relaxed">{transcript}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
