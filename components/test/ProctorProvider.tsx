"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { AlertTriangle, Eye, EyeOff, Camera, Shield } from "lucide-react";

interface Violation {
  type: "tab_switch" | "copy" | "paste" | "right_click" | "fullscreen_exit";
  timestamp: Date;
  message: string;
}

interface ProctorContextType {
  violations: Violation[];
  warningCount: number;
  isFullscreen: boolean;
  fullscreenExitCount: number;
  cameraStream: MediaStream | null;
  finishProctoring: (testId: string) => Promise<void>;
  isUploading: boolean;
}

const ProctorContext = createContext<ProctorContextType>({
  violations: [],
  warningCount: 0,
  isFullscreen: false,
  fullscreenExitCount: 0,
  cameraStream: null,
  finishProctoring: async () => {},
  isUploading: false,
});

export const useProctor = () => useContext(ProctorContext);

const MAX_WARNINGS = 5;

export function ProctorProvider({
  children,
  cameraStream,
  enabled = true,
}: {
  children: React.ReactNode;
  cameraStream: MediaStream | null;
  enabled?: boolean;
}) {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [warningCount, setWarningCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [showCamPreview, setShowCamPreview] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const camVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const violationsRef = useRef<Violation[]>([]);

  const addViolation = useCallback(
    (type: Violation["type"], message: string) => {
      if (!enabled) return;
      const v: Violation = { type, timestamp: new Date(), message };
      setViolations((prev) => {
        const next = [...prev, v];
        violationsRef.current = next;
        return next;
      });
      setWarningCount((prev) => prev + 1);
      setActiveWarning(message);
      setTimeout(() => setActiveWarning(null), 4000);
    },
    [enabled]
  );

  // Camera preview
  useEffect(() => {
    if (camVideoRef.current && cameraStream) {
      camVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, showCamPreview]);

  // Start recording when stream is available
  useEffect(() => {
    if (!enabled || !cameraStream) return;

    try {
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

      const recorder = new MediaRecorder(cameraStream, {
        mimeType,
        videoBitsPerSecond: 500_000,
      });

      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.start(10_000); // collect chunks every 10s
      mediaRecorderRef.current = recorder;

      return () => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      };
    } catch {
      console.warn("MediaRecorder not supported, skipping recording");
    }
  }, [enabled, cameraStream]);

  // Tab switch / visibility detection
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden) {
        addViolation("tab_switch", "Tab switch detected! Stay on this page.");
      }
    };

    const handleBlur = () => {
      addViolation("tab_switch", "You left the test window! This is recorded.");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [enabled, addViolation]);

  // Copy/paste/right-click prevention
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".monaco-editor") || target.tagName === "TEXTAREA") return;
      e.preventDefault();
      addViolation("copy", "Copying is not allowed during the test!");
    };

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".monaco-editor") || target.tagName === "TEXTAREA") return;
      e.preventDefault();
      addViolation("paste", "Pasting is not allowed during the test!");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation("right_click", "Right-click is disabled during the test.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block DevTools: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key))
      ) {
        e.preventDefault();
        addViolation("tab_switch", "Developer tools are blocked during the test!");
        return;
      }

      // Block Ctrl+U (view source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        return;
      }

      // Allow copy/paste inside code editor
      const target = e.target as HTMLElement;
      if (target.closest(".monaco-editor") || target.tagName === "TEXTAREA") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        addViolation("copy", "Copying is not allowed during the test!");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        addViolation("paste", "Pasting is not allowed during the test!");
      }
    };

    // Warn before page close/refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, addViolation]);

  // Fullscreen detection
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        setFullscreenExitCount((prev) => prev + 1);
        addViolation("fullscreen_exit", "You exited fullscreen mode! Please re-enter.");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [enabled, addViolation]);

  // Fullscreen is now triggered by user click on the test page overlay
  // (browsers require a user gesture for requestFullscreen)

  // Upload recording + save violations to test
  const finishProctoring = useCallback(
    async (testId: string) => {
      if (!enabled) return;
      setIsUploading(true);

      try {
        let recordingUrl: string | undefined;

        // Stop recorder and get blob
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== "inactive") {
          await new Promise<void>((resolve) => {
            recorder.onstop = () => resolve();
            recorder.stop();
          });
        }

        // Upload recording to S3 if we have data
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });

          // Only upload if > 10KB
          if (blob.size > 10_000) {
            try {
              const presignRes = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fileName: `proctoring_${testId}.webm`,
                  fileType: "video/webm",
                  mediaType: "video",
                }),
              });
              const presignData = await presignRes.json();

              if (presignData.success) {
                await fetch(presignData.data.uploadUrl, {
                  method: "PUT",
                  headers: { "Content-Type": "video/webm" },
                  body: blob,
                });
                recordingUrl = presignData.data.fileUrl;
              }
            } catch (uploadErr) {
              console.error("Recording upload failed:", uploadErr);
            }
          }
        }

        // Save proctoring data to the test
        await fetch(`/api/tests/${testId}/proctoring`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            violations: violationsRef.current.map((v) => ({
              type: v.type,
              timestamp: v.timestamp.toISOString(),
              message: v.message,
            })),
            warningCount: violationsRef.current.length,
            recordingUrl,
          }),
        });

        // Stop camera
        if (cameraStream) {
          cameraStream.getTracks().forEach((t) => t.stop());
        }

        // Exit fullscreen
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }

        sessionStorage.removeItem("proctoring_enabled");
      } catch (err) {
        console.error("finishProctoring error:", err);
      } finally {
        setIsUploading(false);
      }
    },
    [enabled, cameraStream]
  );

  return (
    <ProctorContext.Provider
      value={{ violations, warningCount, isFullscreen, fullscreenExitCount, cameraStream, finishProctoring, isUploading }}
    >
      {/* Warning toast */}
      {activeWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]">
          <div className="flex items-center gap-3 bg-red-600 text-white px-5 py-3 rounded-xl shadow-2xl shadow-red-600/30 max-w-md">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{activeWarning}</p>
              <p className="text-xs text-red-200 mt-0.5">
                Warning {warningCount}/{MAX_WARNINGS}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning count badge */}
      {enabled && warningCount > 0 && (
        <div className="fixed top-4 right-4 z-[90]">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
              warningCount >= MAX_WARNINGS
                ? "bg-red-100 text-red-700 border border-red-200"
                : warningCount >= 3
                ? "bg-orange-100 text-orange-700 border border-orange-200"
                : "bg-yellow-100 text-yellow-700 border border-yellow-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {warningCount} warning{warningCount !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Camera preview (small floating) */}
      {cameraStream && enabled && (
        <div className="fixed bottom-4 right-4 z-[80]">
          <div className="relative">
            {showCamPreview ? (
              <div className="w-36 h-28 rounded-xl overflow-hidden border-2 border-gray-800 shadow-xl bg-black">
                <video
                  ref={camVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                <button
                  onClick={() => setShowCamPreview(false)}
                  className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                  title="Hide preview"
                >
                  <EyeOff className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  REC
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCamPreview(true)}
                className="flex items-center gap-2 bg-gray-800 text-white text-xs px-3 py-2 rounded-xl shadow-lg hover:bg-gray-700 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen re-enter prompt */}
      {enabled && !isFullscreen && warningCount > 0 && (
        <div className="fixed bottom-4 left-4 z-[80]">
          <button
            onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
            className="flex items-center gap-2 bg-orange-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:bg-orange-700 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Re-enter Fullscreen
          </button>
        </div>
      )}

      {/* Upload overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="font-bold text-gray-900">Saving proctoring data...</p>
            <p className="text-sm text-gray-500 mt-1">Uploading recording & violations</p>
          </div>
        </div>
      )}

      {children}
    </ProctorContext.Provider>
  );
}
