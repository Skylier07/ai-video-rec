"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearHistory } from "@/lib/api";

export default function ClearHistoryButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await clearHistory(userId);
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-on-surface-variant font-medium">Are you sure?</span>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-error text-on-error font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-sm">delete_forever</span>
          )}
          Yes, clear all
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-2 rounded-lg bg-surface-container text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-low text-error font-medium text-sm hover:bg-error/10 transition-colors"
    >
      <span className="material-symbols-outlined text-sm">delete_sweep</span>
      Clear History
    </button>
  );
}
