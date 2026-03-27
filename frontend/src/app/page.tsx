"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { StudySnapInput } from "@/types";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = (file !== null || text.trim().length > 0) && !isSubmitting;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith("image/")) {
      setFile(dropped);
      setPreviewUrl(URL.createObjectURL(dropped));
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      let imageBase64: string | null = null;
      let imageMimeType: string | null = null;

      if (file) {
        imageBase64 = await fileToBase64(file);
        imageMimeType = file.type;
      }

      const input: StudySnapInput = {
        imageBase64,
        imageMimeType,
        text: text.trim() || null,
      };

      localStorage.setItem("studysnap_input", JSON.stringify(input));
      router.push("/processing");
    } catch {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-6 py-12 md:px-12 lg:px-24">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10"></div>

      <header className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-primary mb-4 leading-tight">
          Your Academic Ally
        </h1>
        <p className="text-on-surface-variant text-lg md:text-xl font-medium max-w-2xl mx-auto">
          Transform complex study materials into clear, actionable insights in seconds. Upload, paste, and master your subjects.
        </p>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Submit Button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`gold-gradient text-primary px-10 py-4 rounded-xl font-extrabold text-lg shadow-xl shadow-secondary/30 flex items-center gap-3 transition-all ${
              canSubmit
                ? "hover:scale-105 active:scale-95"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Loading..." : "Help Me Understand"}
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isSubmitting ? "hourglass_top" : "auto_awesome"}
            </span>
          </button>
        </div>

        {/* Upload Box */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div
            className={`relative bg-surface-container-lowest border-2 border-dashed rounded-2xl p-12 md:p-20 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging
                ? "border-primary/70 bg-primary/5"
                : "border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container-low"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div className="flex flex-col items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Uploaded problem"
                  className="max-h-48 rounded-xl object-contain shadow-md"
                />
                <p className="text-sm text-on-surface-variant font-medium">{file?.name}</p>
                <button
                  className="text-xs text-primary underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 gold-gradient rounded-full flex items-center justify-center text-primary mb-6 shadow-lg shadow-secondary/20 animate-pulse">
                  <span className="material-symbols-outlined !text-4xl">cloud_upload</span>
                </div>
                <h3 className="text-2xl font-bold text-on-surface mb-2">Drop your files here</h3>
                <p className="text-on-surface-variant mb-8">PNG, JPG, WEBP (Max 10MB)</p>
                <button
                  className="px-8 py-3 academic-gradient text-white rounded-lg font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Select Files
                </button>
              </>
            )}
          </div>
        </div>

        {/* Text Input Area */}
        <div className="relative">
          <div className="bg-surface-container-low rounded-xl p-6 shadow-sm border border-outline-variant/10">
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
              Or paste your question here...
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-lg text-on-surface placeholder:text-outline-variant resize-none h-32"
              placeholder="Type or paste text, links, or specific academic questions..."
            />
          </div>
        </div>

        {/* Feature Grid (Decorative) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <div className="md:col-span-2 bg-primary text-on-primary rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined !text-9xl">menu_book</span>
            </div>
            <div className="relative z-10">
              <span className="bg-secondary text-on-secondary-fixed px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4 inline-block">Video Clips</span>
              <h4 className="text-2xl font-bold mb-2">Instant Concept Discovery</h4>
              <p className="text-primary-fixed-dim text-sm max-w-md">Get curated YouTube video segments that explain the exact concepts in your problem.</p>
            </div>
          </div>
          <div className="bg-surface-container-highest rounded-2xl p-8 border border-outline-variant/20 hover:shadow-[0_0_15px_rgba(0,35,111,0.5)] transition-all">
            <div className="text-primary mb-4">
              <span className="material-symbols-outlined !text-3xl">history_edu</span>
            </div>
            <h4 className="text-lg font-bold text-primary mb-1">Learn, Don&apos;t Cheat</h4>
            <p className="text-on-surface-variant text-sm">Understand the concepts first, then unlock the answer.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
