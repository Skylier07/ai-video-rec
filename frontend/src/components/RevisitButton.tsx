"use client";

import { useRouter } from "next/navigation";
import type { StudySnapResults } from "@/types";

interface HistoryEntry {
  extracted_question: string;
  concepts: string[];
  video_segments: { segments: any[]; videos: any[] };
}

export default function RevisitButton({ entry }: { entry: HistoryEntry }) {
  const router = useRouter();

  function handleRevisit() {
    const results: StudySnapResults = {
      question: entry.extracted_question,
      concepts: entry.concepts,
      segments: entry.video_segments.segments ?? [],
      videos: entry.video_segments.videos ?? [],
    };
    localStorage.setItem("studysnap_results", JSON.stringify(results));
    router.push("/results");
  }

  return (
    <button
      onClick={handleRevisit}
      className="text-primary font-bold text-sm flex items-center gap-1 group/btn hover:text-primary-container"
    >
      Revisit
      <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">
        arrow_forward
      </span>
    </button>
  );
}
