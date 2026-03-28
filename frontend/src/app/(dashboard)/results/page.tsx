"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { StudySnapResults, VideoSegment, VideoMeta } from "@/types";
import { solveQuestion, type SolveResponse } from "@/lib/api";
import MathMarkdown from "@/components/MathMarkdown";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SegmentCard({
  segment,
  isPlaying,
  onPlay,
}: {
  segment: VideoSegment;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const embedUrl = `https://www.youtube.com/embed/${segment.video_id}?start=${segment.start_time}&end=${segment.end_time}&autoplay=1&rel=0`;
  const watchUrl = `https://www.youtube.com/watch?v=${segment.video_id}&t=${segment.start_time}s`;
  const thumbnailUrl = `https://img.youtube.com/vi/${segment.video_id}/mqdefault.jpg`;
  const startStr = formatTime(segment.start_time);
  const endStr = formatTime(segment.end_time);

  return (
    <div className="group relative bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-gold border border-outline-variant/10">
      <div className="aspect-video relative overflow-hidden bg-slate-900">
        {isPlaying ? (
          <iframe
            src={embedUrl}
            title={segment.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt={segment.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
              <span className="bg-primary-container text-on-primary-container text-[10px] font-black px-2 py-1 rounded">
                {startStr} - {endStr}
              </span>
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={onPlay}
            >
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-on-secondary-fixed text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-bold text-on-surface text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
          {segment.title}
        </h4>
        <p className="text-xs text-on-surface-variant line-clamp-2">{segment.explanation}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="text-[10px] font-black text-outline uppercase tracking-widest">Relevant Segment</span>
          </div>
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-secondary transition-colors"
          >
            Open @ {startStr}
          </a>
        </div>
      </div>
    </div>
  );
}

function VideoCard({
  video,
  isPlaying,
  onPlay,
}: {
  video: VideoMeta;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const embedUrl = `https://www.youtube.com/embed/${video.video_id}?autoplay=1&rel=0`;
  const thumbnailUrl = `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`;

  return (
    <div className="group relative bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-gold border border-outline-variant/10">
      <div className="aspect-video relative overflow-hidden bg-slate-900">
        {isPlaying ? (
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={onPlay}
            >
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-on-secondary-fixed text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-bold text-on-surface text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
          {video.title}
        </h4>
        <div className="mt-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-fixed-dim"></span>
          <span className="text-[10px] font-black text-outline uppercase tracking-widest">Related Video</span>
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  const router = useRouter();
  const [results] = useState<StudySnapResults | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("studysnap_results");
    if (!raw) return null;
    return JSON.parse(raw) as StudySnapResults;
  });
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [watchedCount, setWatchedCount] = useState(0);
  const [solution, setSolution] = useState<SolveResponse | null>(null);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [solutionError, setSolutionError] = useState<string | null>(null);
  const [revealedSteps, setRevealedSteps] = useState(0);
  // true when user clicked Reveal while the background fetch was still in-flight
  const [pendingReveal, setPendingReveal] = useState(false);

  useEffect(() => {
    if (!results) {
      router.replace("/");
    }
  }, [results, router]);

  // Pre-fetch solution as soon as results are shown — display is still gated by the button
  useEffect(() => {
    if (!results) return;
    const input =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("studysnap_input") || "{}")
        : {};
    setSolutionLoading(true);
    solveQuestion(
      results.question,
      input.imageBase64 ?? null,
      input.imageMimeType ?? null,
    )
      .then((res) => {
        setSolution(res);
        // If the user already clicked Reveal while we were loading, auto-show first step
        setPendingReveal((wasPending) => {
          if (wasPending) setRevealedSteps(1);
          return false;
        });
      })
      .catch((e: any) => {
        setSolutionError(e.message || "Failed to generate solution");
      })
      .finally(() => {
        setSolutionLoading(false);
      });
  }, [results]); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePlay(id: string) {
    if (playingId !== id) {
      setPlayingId(id);
      setWatchedCount((c) => c + 1);
    }
  }

  function handleReveal() {
    if (!results || watchedCount === 0) return;
    if (solution) {
      // Solution already ready — reveal next step instantly
      setRevealedSteps((prev) => Math.min(prev + 1, solution.steps.length + 1));
      return;
    }
    if (solutionLoading) {
      // Background fetch still in-flight — queue the reveal so it fires the moment it lands
      setPendingReveal(true);
      return;
    }
  }

  if (!results) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="w-8 h-8 border-4 loading-ring rounded-full animate-spin"></div>
      </div>
    );
  }

  const useSegments = results.segments.length > 0;
  const segmentCount = useSegments ? results.segments.length : results.videos.length;
  const firstConcept = results.concepts[0] ?? "Results";
  const restConcepts = results.concepts.slice(1).join(", ");

  return (
    <div className="mt-8 px-6 max-w-7xl mx-auto pb-24">
      {/* Hero Stats / Title Section */}
      <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div>
          <span className="label-md text-on-secondary-fixed-variant bg-secondary-fixed px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-3 inline-block">
            Analysis Complete
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary leading-tight">
            {firstConcept}
            {restConcepts && (
              <>
                <br />
                <span className="text-secondary">{restConcepts}</span>
              </>
            )}
          </h2>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10 min-w-[120px] text-center">
            <p className="text-[10px] font-bold text-outline uppercase tracking-tighter mb-1">Segments</p>
            <p className="text-2xl font-black text-primary">{segmentCount}</p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10 min-w-[120px] text-center">
            <p className="text-[10px] font-bold text-outline uppercase tracking-tighter mb-1">Concepts</p>
            <p className="text-2xl font-black text-primary">{results.concepts.length}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Question and Concepts */}
        <div className="lg:col-span-7 space-y-8">
          {/* Main Question Card */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm relative group border border-outline-variant/10">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary-fixed px-3 py-1 rounded">
                  Extracted Question
                </span>
              </div>
              <MathMarkdown
                content={results.question}
                className="text-2xl font-bold text-on-surface mb-8 leading-snug"
              />

              {/* Concept Pills */}
              <div className="flex flex-wrap gap-2 mb-10">
                {results.concepts.map((concept) => (
                  <span
                    key={concept}
                    className="px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg text-xs font-bold border border-secondary/10 hover:shadow-glow-gold transition-all cursor-default flex items-center"
                  >
                    <span className="material-symbols-outlined text-[14px] mr-1">bolt</span>
                    {concept}
                  </span>
                ))}
              </div>

              {/* Reveal Answer Button */}
              <button
                disabled={watchedCount === 0}
                onClick={handleReveal}
                className={`flex items-center justify-center gap-3 w-full py-4 font-bold rounded-lg transition-all ${
                  watchedCount > 0
                    ? "bg-secondary text-on-secondary-fixed hover:scale-[1.02] active:scale-[0.98] shadow-md"
                    : "bg-surface-container text-outline cursor-not-allowed opacity-60 border border-outline-variant/20"
                }`}
              >
                {pendingReveal ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Loading Solution…
                  </>
                ) : solution ? (
                  <>
                    <span className="material-symbols-outlined">arrow_downward</span>
                    {revealedSteps >= solution.steps.length + 1
                      ? "Full Solution Revealed"
                      : `Reveal Step ${revealedSteps + 1}`}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">{watchedCount > 0 ? "auto_awesome" : "lock"}</span>
                    Reveal Answer
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-outline mt-3 font-semibold uppercase tracking-widest">
                {pendingReveal
                  ? "Almost ready — loading solution…"
                  : solution
                    ? revealedSteps >= solution.steps.length + 1
                      ? "Complete solution shown below"
                      : "Click again to reveal the next step"
                    : watchedCount > 0
                      ? "AI-powered step-by-step solution"
                      : "Watch a video segment to unlock"}
              </p>

              {/* Error state */}
              {solutionError && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{solutionError}</p>
                </div>
              )}

              {/* Step-by-step solution display */}
              {solution && revealedSteps > 0 && (
                <div className="mt-8 space-y-4">
                  <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">school</span>
                    Step-by-Step Solution
                  </h4>
                  {solution.steps.slice(0, revealedSteps).map((step, i) => (
                    <div
                      key={step.step_number}
                      className="relative pl-8 pb-4 border-l-2 border-secondary/30 last:border-l-0 animate-fadeIn"
                    >
                      <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-secondary text-on-secondary-fixed flex items-center justify-center text-xs font-black shadow">
                        {step.step_number}
                      </div>
                      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 shadow-sm">
                        <h5 className="text-sm font-bold text-on-surface mb-2">{step.title}</h5>
                        <MathMarkdown content={step.content} className="text-sm text-on-surface-variant leading-relaxed" />
                      </div>
                    </div>
                  ))}

                  {/* Final answer — only show after all steps are revealed */}
                  {revealedSteps >= solution.steps.length + 1 && (
                    <div className="mt-2 p-5 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl border border-secondary/20 animate-fadeIn">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                        <span className="text-xs font-black text-secondary uppercase tracking-widest">Final Answer</span>
                      </div>
                      <MathMarkdown content={solution.final_answer} className="text-lg font-bold text-on-surface leading-relaxed" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Insights from first segment */}
          {results.segments[0] && (
            <div className="bg-surface-container-low rounded-xl p-6">
              <h4 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">forum</span>
                AI Insights
              </h4>
              <div className="space-y-4">
                <div className="bg-surface-container-lowest p-4 rounded-lg border-l-2 border-primary-fixed-dim">
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {results.segments[0].explanation}
                  </p>
                </div>
                {results.segments[1] && (
                  <div className="bg-surface-container-lowest p-4 rounded-lg border-l-2 border-primary-fixed-dim">
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {results.segments[1].explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Video Snippets */}
        <div className="lg:col-span-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-primary tracking-tight">Relevant Snips</h3>
            <span className="text-xs font-bold text-secondary uppercase tracking-widest">
              {useSegments ? `${segmentCount} clips` : `${segmentCount} videos`}
            </span>
          </div>

          <div className="space-y-6">
            {useSegments
              ? results.segments.map((seg) => (
                  <SegmentCard
                    key={`${seg.video_id}-${seg.start_time}`}
                    segment={seg}
                    isPlaying={playingId === `${seg.video_id}-${seg.start_time}`}
                    onPlay={() => handlePlay(`${seg.video_id}-${seg.start_time}`)}
                  />
                ))
              : results.videos.map((video) => (
                  <VideoCard
                    key={video.video_id}
                    video={video}
                    isPlaying={playingId === video.video_id}
                    onPlay={() => handlePlay(video.video_id)}
                  />
                ))}
          </div>

          {segmentCount === 0 && (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-3 block">video_off</span>
              <p className="text-sm font-medium">No video segments found.</p>
              <p className="text-xs mt-1">Try rephrasing your question.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => router.push("/")}
        className="fixed bottom-24 lg:bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group z-50"
        title="New question"
      >
        <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">add</span>
      </button>
    </div>
  );
}
