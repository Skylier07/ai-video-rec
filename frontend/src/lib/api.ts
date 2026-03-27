import type { VideoMeta, VideoSegment } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function analyzeQuestion(
  imageBase64: string | null,
  imageMimeType: string | null,
  text: string | null,
): Promise<{ question: string; concepts: string[] }> {
  return post("/analyze", {
    image_base64: imageBase64,
    image_mime_type: imageMimeType,
    text,
  });
}

export async function searchVideos(
  concepts: string[],
): Promise<{ videos: VideoMeta[] }> {
  return post("/search", { concepts, max_results: 5 });
}

export async function rankSegments(
  concepts: string[],
  videos: VideoMeta[],
): Promise<{ segments: VideoSegment[] }> {
  return post("/rank", { concepts, videos });
}
