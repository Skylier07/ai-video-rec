"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GoogleGenAI, Modality } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a homework problem detector. You receive frames from a student's screen.

Your ONLY job:
- If you can clearly see a homework question, math problem, or exam question being displayed, respond with EXACTLY:
  PROBLEM_DETECTED: [copy the question text here]
- If there is no clear homework problem visible, respond with EXACTLY:
  NO_PROBLEM
- Never add any other text, explanation, or commentary.`;

const CAPTURE_INTERVAL_MS = 5000;

type LiveSession = {
  sendRealtimeInput: (input: unknown) => void;
  close: () => void;
};

export default function ScreenRecorder() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [toast, setToast] = useState<{ question: string; imageBase64: string } | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionRef = useRef<LiveSession | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false);
  const latestBase64Ref = useRef<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    return dataUrl.split(",")[1];
  }, []);

  const sendFrame = useCallback(() => {
    if (!sessionRef.current) return;
    const base64 = captureFrame();
    if (!base64) return;
    latestBase64Ref.current = base64;

    sessionRef.current.sendRealtimeInput({
      media_chunks: [{ data: base64, mime_type: "image/jpeg" }],
    });
  }, [captureFrame]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      stream.getVideoTracks()[0].onended = () => {
        if (isRecordingRef.current) stopRecording();
      };

      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";
      const genAI = new GoogleGenAI({ apiKey });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = await (genAI.live as any).connect({
        model: "gemini-2.0-flash-live-001",
        config: {
          responseModalities: [Modality.TEXT],
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        },
        callbacks: {
          onopen: () => setIsRecording(true),
          onmessage: (message: { serverContent?: { modelTurn?: { parts?: Array<{ text?: string }> } } }) => {
            const text = message.serverContent?.modelTurn?.parts?.[0]?.text ?? "";
            if (text.startsWith("PROBLEM_DETECTED:") && latestBase64Ref.current) {
              const question = text.replace("PROBLEM_DETECTED:", "").trim();
              setToast({ question, imageBase64: latestBase64Ref.current });
            }
          },
          onerror: (err: unknown) => console.error("Live API error:", err),
          onclose: () => { if (isRecordingRef.current) stopRecording(); },
        },
      });

      sessionRef.current = session as LiveSession;
      intervalRef.current = setInterval(sendFrame, CAPTURE_INTERVAL_MS);
      setTimeout(sendFrame, 500);
    } catch (err) {
      console.warn("Screen capture not started:", err);
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

  // Cleanup on unmount
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
            title="Start Screen Monitor — watch for homework problems (Shift+S to scan manually)"
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

      {/* Toast — bottom-right */}
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
