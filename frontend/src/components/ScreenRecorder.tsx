"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GoogleGenAI, Modality, type Session, type LiveServerMessage } from "@google/genai";
import { getScanInterval } from "@/components/ScanIntervalSetting";

const SYSTEM_INSTRUCTION = `You are a homework problem detector. You receive frames from a student's screen.

Your ONLY job:
- If you can clearly see a homework question, math problem, or exam question being displayed, respond with EXACTLY:
  PROBLEM_DETECTED: [copy the question text here]
- If there is no clear homework problem visible, respond with EXACTLY:
  NO_PROBLEM
- Never add any other text, explanation, or commentary.`;

const MODEL = "gemini-3.1-flash-live-preview";

export default function ScreenRecorder() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ question: string; imageBase64: string } | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false);
  const latestBase64Ref = useRef<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTextRef = useRef("");

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (_) {}
      sessionRef.current = null;
    }

    setIsRecording(false);
    setToast(null);
    latestBase64Ref.current = null;
    pendingTextRef.current = "";
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
  }, []);

  const sendFrame = useCallback(() => {
    if (!sessionRef.current) return;
    const base64 = captureFrame();
    if (!base64) return;
    latestBase64Ref.current = base64;
    pendingTextRef.current = "";
    console.log("[ScreenRecorder] Sending frame");

    sessionRef.current.sendRealtimeInput({
      video: { data: base64, mimeType: "image/jpeg" },
      text: "Analyze this screen.",
    });
  }, [captureFrame]);

  const startRecording = useCallback(async () => {
    setConnectionError(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    } catch {
      // User cancelled the dialog — stay idle silently
      return;
    }

    // Show recording UI immediately (don't wait for WS handshake)
    streamRef.current = stream;
    setIsRecording(true);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }

    stream.getVideoTracks()[0].onended = () => {
      if (isRecordingRef.current) stopRecording();
    };

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";

    try {
      const genAI = new GoogleGenAI({ apiKey });

      const session = await genAI.live.connect({
        model: MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onopen: () => {
            console.log("[ScreenRecorder] Live API connection opened");
            intervalRef.current = setInterval(sendFrame, getScanInterval());
            setTimeout(sendFrame, 500);
          },
          onmessage: (message: LiveServerMessage) => {
            const content = message.serverContent;
            if (!content) return;

            // Audio mode: text arrives via outputTranscription, not modelTurn.parts
            if (content.outputTranscription?.text) {
              pendingTextRef.current += content.outputTranscription.text;
            }

            if (content.turnComplete && latestBase64Ref.current) {
              const fullText = pendingTextRef.current.trim();
              pendingTextRef.current = "";
              if (fullText.startsWith("PROBLEM_DETECTED:")) {
                const question = fullText.replace("PROBLEM_DETECTED:", "").trim();
                setToast({ question, imageBase64: latestBase64Ref.current });
              }
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error("Live API error:", e.message);
            setConnectionError("Live API error — check console for details");
          },
          onclose: (e: CloseEvent) => {
            const reason = e.reason ? `${e.code}: ${e.reason}` : `code ${e.code}`;
            console.warn("Live API WS closed:", reason);
            if (isRecordingRef.current) {
              setConnectionError(`Connection closed unexpectedly (${reason})`);
              stopRecording();
            }
          },
        },
      });

      sessionRef.current = session;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Live API connect failed:", msg);
      setConnectionError(`Connection failed: ${msg}`);
      // Clean up the stream we already started
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setIsRecording(false);
    }
  }, [stopRecording, sendFrame]);

  // Shift+S manual scan
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "S" && e.shiftKey && isRecordingRef.current) sendFrame();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sendFrame]);

  // Auto-dismiss toast after 10s
  useEffect(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toast) {
      toastTimerRef.current = setTimeout(() => setToast(null), 10000);
    }
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, [toast]);

  useEffect(() => { return () => { stopRecording(); }; }, [stopRecording]);

  const handleFindVideos = useCallback(() => {
    if (!toast) return;
    stopRecording();
    localStorage.setItem("studysnap_input", JSON.stringify({
      imageBase64: toast.imageBase64,
      imageMimeType: "image/jpeg",
      text: null,
    }));
    router.push("/processing");
  }, [toast, stopRecording, router]);

  return (
    <>
      <video ref={videoRef} autoPlay muted playsInline style={{ display: "none" }} />

      {/* Floating record button — bottom-left */}
      <div style={{ position: "fixed", bottom: "24px", left: "24px", zIndex: 50 }}>
        {isRecording ? (
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(186,26,26,0.3)",
              animation: "ss-ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
            }} />
            <button
              onClick={stopRecording}
              title="Stop screen monitor"
              style={{
                position: "relative", width: "44px", height: "44px",
                borderRadius: "50%", background: "#ba1a1a", color: "white",
                border: "none", cursor: "pointer", fontSize: "16px",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(186,26,26,0.4)",
              }}
            >■</button>
          </div>
        ) : (
          <button
            onClick={startRecording}
            title="Start Screen Monitor — detect homework problems automatically"
            style={{
              width: "44px", height: "44px", borderRadius: "50%",
              background: "#00236f", color: "white", border: "none",
              cursor: "pointer", fontSize: "18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,35,111,0.4)",
            }}
          >🔴</button>
        )}
      </div>

      {/* Connection error toast */}
      {connectionError && !isRecording && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 70,
          background: "#ba1a1a", color: "white", borderRadius: "14px",
          padding: "14px 18px", maxWidth: "300px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠</span>
          <div>
            <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "2px" }}>Screen Monitor Error</p>
            <p style={{ fontSize: "11px", opacity: 0.85 }}>{connectionError}</p>
          </div>
          <button onClick={() => setConnectionError(null)} style={{
            background: "none", border: "none", color: "white",
            cursor: "pointer", fontSize: "16px", flexShrink: 0, opacity: 0.7,
          }}>✕</button>
        </div>
      )}

      {/* Problem detected toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 70,
          background: "#00236f", color: "white", borderRadius: "16px",
          padding: "16px", width: "280px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div style={{ width: "8px", height: "8px", background: "#e9c349", borderRadius: "50%", flexShrink: 0 }} />
            <span style={{ fontSize: "11px", fontWeight: "bold", letterSpacing: "0.06em", textTransform: "uppercase", color: "#e9c349" }}>
              Problem Detected
            </span>
          </div>
          <p style={{
            fontSize: "13px", color: "#dce1ff", marginBottom: "14px", lineHeight: "1.5",
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {toast.question}
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleFindVideos} style={{
              flex: 1, background: "#e9c349", color: "#00236f", border: "none",
              borderRadius: "10px", padding: "8px", fontSize: "12px",
              fontWeight: "bold", cursor: "pointer",
            }}>Find Videos →</button>
            <button onClick={() => setToast(null)} style={{
              border: "1px solid rgba(255,255,255,0.2)", color: "#aaa",
              background: "transparent", borderRadius: "10px",
              padding: "8px 14px", fontSize: "12px", cursor: "pointer",
            }}>Dismiss</button>
          </div>
        </div>
      )}

      <style>{`@keyframes ss-ping { 75%,100%{transform:scale(2);opacity:0} }`}</style>
    </>
  );
}
