"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { StudySnapInput, VideoSegment } from "@/types";
import { analyzeQuestion, searchVideos, rankSegments, solveQuestion, type SolveResponse } from "@/lib/api";
import { getSolveMode } from "@/components/SolveModeSetting";
import ChatConceptCard from "@/components/ChatConceptCard";

type Phase = "idle" | "analyzing" | "loading" | "done";

export default function ChatPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const ran = useRef(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [concepts, setConcepts] = useState<string[]>([]);
  const [conceptSegments, setConceptSegments] = useState<Record<string, VideoSegment | null>>({});
  const [solveResult, setSolveResult] = useState<SolveResponse | null>(null);

  useEffect(() => {
    if (ran.current) return;
    if (session === undefined) return;
    ran.current = true;

    async function run() {
      const raw = localStorage.getItem("studysnap_input");
      if (!raw) {
        router.replace("/");
        return;
      }

      const input: StudySnapInput = JSON.parse(raw);
      const mode = getSolveMode();

      try {
        setPhase("analyzing");
        const analysis = await analyzeQuestion(
          input.imageBase64,
          input.imageMimeType,
          input.text,
          mode,
        );
        setQuestion(analysis.question);
        setConcepts(analysis.concepts);

        // Pre-populate segments with null (shows loading state per card)
        const initial: Record<string, VideoSegment | null> = {};
        for (const c of analysis.concepts) initial[c] = null;
        setConceptSegments(initial);

        setPhase("loading");

        // Parallel: solve + per-concept video search/rank
        await Promise.all([
          solveQuestion(analysis.question, input.imageBase64, input.imageMimeType, mode as "accurate" | "fast")
            .then((r) => setSolveResult(r))
            .catch(() => setSolveResult(null)),

          ...analysis.concepts.map((concept) =>
            searchVideos([concept])
              .then((r) => rankSegments([concept], r.videos))
              .then((r) => {
                setConceptSegments((prev) => ({
                  ...prev,
                  [concept]: r.segments[0] ?? null,
                }));
              })
              .catch(() => {
                setConceptSegments((prev) => ({ ...prev, [concept]: null }));
              })
          ),
        ]);

        setPhase("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        setPhase("done");
      }
    }

    run();
  }, [router, session]);

  return (
    <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full">
      {/* Question header */}
      <div className="mb-8">
        {phase === "analyzing" || !question ? (
          <div className="space-y-3">
            <div className="h-8 w-2/3 skeleton-shimmer rounded-xl" />
            <div className="h-4 w-32 skeleton-shimmer rounded-full opacity-60" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-on-surface leading-snug">{question}</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {concepts.length} method{concepts.length !== 1 ? "s" : ""} identified
            </p>
          </>
        )}
      </div>

      {/* Phase status */}
      {phase !== "done" && (
        <div className="flex items-center gap-3 mb-8 bg-surface-container-low px-5 py-4 rounded-2xl w-fit">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
          <span className="text-sm font-semibold text-on-surface">
            {phase === "analyzing" ? "Analyzing problem..." : "Finding videos & generating solution..."}
          </span>
        </div>
      )}

      {/* Concept cards grid */}
      {concepts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {concepts.map((concept) => (
            <ChatConceptCard
              key={concept}
              concept={concept}
              segment={conceptSegments[concept] ?? null}
              steps={solveResult?.steps ?? []}
              finalAnswer={solveResult?.final_answer ?? ""}
              loading={phase !== "done" || !solveResult}
            />
          ))}
        </div>
      )}

      {/* Error toast */}
      {error && (
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
      )}
    </div>
  );
}
