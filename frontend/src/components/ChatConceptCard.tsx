"use client";

import { useState } from "react";
import type { VideoSegment } from "@/types";
import type { SolveStep, SolveResponse } from "@/lib/api";
import { solveQuestion } from "@/lib/api";

interface Props {
  concept: string;
  segment: VideoSegment | null;
  steps: SolveStep[];
  finalAnswer: string;
  loading: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function StepList({ steps, finalAnswer }: { steps: SolveStep[]; finalAnswer: string }) {
  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div key={step.step_number} className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center mt-0.5">
            {step.step_number}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface mb-1">{step.title}</p>
            <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{step.content}</p>
          </div>
        </div>
      ))}
      {finalAnswer && (
        <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Final Answer</p>
          <p className="text-sm font-semibold text-on-surface">{finalAnswer}</p>
        </div>
      )}
    </div>
  );
}

export default function ChatConceptCard({ concept, segment, steps, finalAnswer, loading }: Props) {
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [askResults, setAskResults] = useState<SolveResponse[]>([]);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  async function handleAsk() {
    if (!followUp.trim()) return;
    setAskLoading(true);
    setAskError(null);
    try {
      const result = await solveQuestion(followUp.trim());
      setAskResults((prev) => [...prev, result]);
      setFollowUp("");
      setAskOpen(false);
    } catch (err) {
      setAskError(err instanceof Error ? err.message : "Request failed. Try again.");
    } finally {
      setAskLoading(false);
    }
  }

  return (
    <div className="bg-surface-container-low rounded-3xl border border-outline-variant/10 p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-secondary-fixed/20 text-on-secondary-fixed flex-shrink-0 mt-0.5">
          Method
        </span>
        <h2 className="text-base font-extrabold text-primary leading-snug">{concept}</h2>
      </div>

      {/* Video link */}
      <div>
        {loading && !segment ? (
          <div className="h-10 w-full skeleton-shimmer rounded-xl" />
        ) : segment ? (
          <a
            href={`https://www.youtube.com/watch?v=${segment.video_id}&t=${segment.start_time}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors group"
          >
            <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">play_circle</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                {segment.title}
              </p>
              <p className="text-xs text-on-surface-variant">
                {formatTime(segment.start_time)} – {formatTime(segment.end_time)}
              </p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-base flex-shrink-0">open_in_new</span>
          </a>
        ) : (
          <p className="text-sm text-on-surface-variant italic">No video found for this concept.</p>
        )}
      </div>

      {/* Accordion — step-by-step solution */}
      <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
        <button
          onClick={() => setAccordionOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">lightbulb</span>
            Step-by-step solution
          </span>
          <span className="material-symbols-outlined text-base text-on-surface-variant">
            {accordionOpen ? "expand_less" : "expand_more"}
          </span>
        </button>
        {accordionOpen && (
          <div className="px-4 pb-4 pt-2 border-t border-outline-variant/20">
            {loading || steps.length === 0 ? (
              <div className="space-y-3">
                <div className="h-4 w-full skeleton-shimmer rounded-full" />
                <div className="h-4 w-3/4 skeleton-shimmer rounded-full" />
                <div className="h-4 w-5/6 skeleton-shimmer rounded-full" />
              </div>
            ) : (
              <StepList steps={steps} finalAnswer={finalAnswer} />
            )}
          </div>
        )}
      </div>

      {/* Follow-up ask results */}
      {askResults.map((result, i) => (
        <div key={i} className="border border-outline-variant/20 rounded-xl px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Follow-up answer</p>
          <StepList steps={result.steps} finalAnswer={result.final_answer} />
        </div>
      ))}

      {/* Ask button */}
      <div>
        {askOpen ? (
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container p-3 text-sm text-on-surface resize-none focus:outline-none focus:border-primary transition-colors"
              rows={2}
              placeholder="Ask a follow-up question..."
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              autoFocus
            />
            {askError && <p className="text-xs text-error">{askError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleAsk}
                disabled={askLoading || !followUp.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold disabled:opacity-50 transition-opacity"
              >
                {askLoading && <span className="w-3 h-3 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />}
                Send
              </button>
              <button
                onClick={() => { setAskOpen(false); setAskError(null); }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAskOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-base">help</span>
            Ask a follow-up
          </button>
        )}
      </div>
    </div>
  );
}
