"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { StudySnapInput, StudySnapResults } from "@/types";
import { analyzeQuestion, searchVideos, rankSegments } from "@/lib/api";

const STEPS = [
  { label: "Analyzing problem...", sub: "Step 1 of 3: Deep OCR Scanning", toast: "Analyzing your question..." },
  { label: "Finding relevant videos...", sub: "Step 2 of 3: YouTube Search", toast: "Searching YouTube..." },
  { label: "Identifying key moments...", sub: "Step 3 of 3: Ranking Segments", toast: "Ranking video segments..." },
] as const;

export default function Processing() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function run() {
      const raw = localStorage.getItem("studysnap_input");
      if (!raw) {
        router.replace("/");
        return;
      }

      const input: StudySnapInput = JSON.parse(raw);

      try {
        setStep(0);
        const analysis = await analyzeQuestion(
          input.imageBase64,
          input.imageMimeType,
          input.text,
        );

        setStep(1);
        const searchResult = await searchVideos(analysis.concepts);

        setStep(2);
        const rankResult = await rankSegments(analysis.concepts, searchResult.videos);

        const results: StudySnapResults = {
          question: analysis.question,
          concepts: analysis.concepts,
          segments: rankResult.segments,
          videos: searchResult.videos,
        };
        localStorage.setItem("studysnap_results", JSON.stringify(results));
        router.push("/results");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    }

    run();
  }, [router]);

  const current = STEPS[step] ?? STEPS[0];

  return (
    <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full">
      {/* Loading Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="space-y-4 max-w-xl">
          <div className="h-4 w-32 skeleton-shimmer rounded-full"></div>
          <div className="h-12 w-full md:w-[480px] skeleton-shimmer rounded-xl"></div>
          <div className="h-4 w-64 skeleton-shimmer rounded-full opacity-60"></div>
        </div>

        {/* Main Status Loader */}
        <div className="flex items-center gap-4 bg-surface-container-low p-6 rounded-2xl shadow-sm w-full md:w-auto">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-surface-container rounded-full"></div>
            <div className="absolute inset-0 border-4 loading-ring rounded-full animate-spin-slow"></div>
          </div>
          <div>
            <p className="text-sm font-bold text-primary tracking-wide animate-pulse">{current.label}</p>
            <p className="text-xs text-on-surface-variant">{current.sub}</p>
          </div>
        </div>
      </div>

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 row-span-2 bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10">
          <div className="flex justify-between items-center mb-8">
            <div className="h-6 w-48 skeleton-shimmer rounded-full"></div>
            <div className="flex gap-2">
              <div className="h-8 w-8 skeleton-shimmer rounded-lg"></div>
              <div className="h-8 w-8 skeleton-shimmer rounded-lg"></div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-32 w-full skeleton-shimmer rounded-2xl"></div>
            <div className="space-y-3">
              <div className="h-4 w-full skeleton-shimmer rounded-full"></div>
              <div className="h-4 w-[90%] skeleton-shimmer rounded-full"></div>
              <div className="h-4 w-[95%] skeleton-shimmer rounded-full"></div>
              <div className="h-4 w-[85%] skeleton-shimmer rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="h-24 skeleton-shimmer rounded-2xl"></div>
              <div className="h-24 skeleton-shimmer rounded-2xl"></div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-secondary-fixed rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-on-secondary-fixed animate-pulse">auto_awesome</span>
            </div>
            <div className="h-4 w-32 skeleton-shimmer rounded-full"></div>
          </div>
          <div className="space-y-4">
            <div className="h-12 w-full skeleton-shimmer rounded-xl opacity-80"></div>
            <div className="h-12 w-full skeleton-shimmer rounded-xl opacity-60"></div>
            <div className="h-12 w-full skeleton-shimmer rounded-xl opacity-40"></div>
          </div>
        </div>

        <div className="bg-primary/5 rounded-3xl p-6 border border-primary/5">
          <div className="h-5 w-40 skeleton-shimmer rounded-full mb-6"></div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 skeleton-shimmer rounded-xl flex-shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 w-full skeleton-shimmer rounded-full"></div>
                <div className="h-2 w-24 skeleton-shimmer rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 skeleton-shimmer rounded-xl flex-shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 w-full skeleton-shimmer rounded-full"></div>
                <div className="h-2 w-24 skeleton-shimmer rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section Skeleton */}
      <div className="mt-12 mb-20">
        <div className="h-6 w-56 skeleton-shimmer rounded-full mb-8"></div>
        <div className="flex flex-nowrap gap-6 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-72 h-40 bg-surface-container-low rounded-2xl flex-shrink-0 p-6 flex flex-col justify-between">
              <div className="h-4 w-3/4 skeleton-shimmer rounded-full"></div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 skeleton-shimmer rounded-full"></div>
                <div className="h-3 w-24 skeleton-shimmer rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Toast */}
      {error ? (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 md:translate-x-0 md:bottom-8 md:right-8 bg-error text-on-error px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-[60] max-w-sm">
          <span className="material-symbols-outlined flex-shrink-0">error</span>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-bold tracking-tight">Something went wrong</span>
            <span className="text-[10px] opacity-80 truncate">{error}</span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-xs font-bold underline flex-shrink-0"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 md:translate-x-0 md:bottom-8 md:right-8 bg-primary text-on-primary px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-[60]">
          <div className="w-5 h-5 border-2 border-on-primary/30 border-t-secondary-fixed rounded-full animate-spin flex-shrink-0"></div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">{current.toast}</span>
            <span className="text-[10px] text-on-primary-container font-medium opacity-80 uppercase tracking-widest">Knowledge Engine Active</span>
          </div>
        </div>
      )}
    </div>
  );
}
