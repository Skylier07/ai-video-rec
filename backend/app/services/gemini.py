import os
import json
import re

import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

model_analyze = genai.GenerativeModel("gemini-2.5-pro")
model_rank = genai.GenerativeModel("gemini-2.5-flash")

ANALYZE_PROMPT = """Analyze this problem carefully and return a JSON object with exactly these fields:
    - "question": the exact question being asked, as clean readable text (no LaTeX unless necessary)
    - "concepts": a list of 2-4 highly specific, search-engine-optimized phrases designed to be used directly as YouTube search queries. These queries must yield tutorial videos that provide the exact theoretical principles and mathematical steps required to solve this specific problem. Avoid broad topics; use precise, targeted descriptions that describe the exact scenario (e.g., instead of 'Ampere's Law', use 'Deriving the magnetic field inside and outside a thick uniformly current-carrying cylindrical shell').

    Return ONLY valid JSON. No markdown code blocks, no extra text."""


def _parse_json(text: str) -> dict | list:
    """Strip markdown fences and parse JSON."""
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
    return json.loads(cleaned.strip())


def analyze_question(
    image_base64: str | None,
    image_mime_type: str | None,
    text: str | None,
) -> dict:
    """Extract question and concepts using Gemini 2.5-pro."""
    parts: list = []

    if image_base64:
        parts.append({
            "inline_data": {
                "mime_type": image_mime_type,
                "data": image_base64,
            }
        })

    if text:
        parts.append(f"Problem text: {text}\n\n")

    parts.append(ANALYZE_PROMPT)

    response = model_analyze.generate_content(parts)
    return _parse_json(response.text)


def rank_segments(
    concepts: list[str],
    video_id: str,
    title: str,
    transcript: list[dict],
) -> list[dict]:
    """Find the 1-2 most relevant segments in a transcript using Gemini 2.0-flash."""
    transcript_text = "\n".join(
        f"[{int(item['start'])}s] {item['text']}"
        for item in transcript[:300]  # cap at 300 lines to stay within token limit
    )

    prompt = f"""You are helping a student understand concepts by finding relevant video segments.

Concepts to explain: {concepts}

Video title: {title}
Video ID: {video_id}

Transcript (format: [timestamp in seconds] text):
{transcript_text}

Find 1-2 segments (each 30-120 seconds long) most relevant to the concepts above.
Pick the first moment where the concepts become central in the explanation.
For start_time, use an exact timestamp that appears in the transcript labels above.
Do not invent timestamps that are not present in transcript labels.
Return a JSON array:
[
  {{
    "video_id": "{video_id}",
    "title": "{title}",
    "start_time": <integer seconds>,
    "end_time": <integer seconds>,
    "explanation": "1-2 sentences explaining why this segment helps understand the concepts"
  }}
]
Return ONLY valid JSON. No markdown, no extra text."""

    response = model_rank.generate_content(prompt)
    result = _parse_json(response.text)
    return result if isinstance(result, list) else []


model_solve = genai.GenerativeModel("gemini-3.1-pro-preview")

SOLVE_PROMPT = """You are an expert tutor. A student has the following question:

"{question}"

Provide a clear, step-by-step solution. Structure your response as a JSON object:
{{
  "steps": [
    {{
      "step_number": 1,
      "title": "Short title for this step",
      "content": "Detailed explanation of what to do in this step. Use clear math notation where needed."
    }}
  ],
  "final_answer": "The final answer, stated concisely."
}}

Be thorough but concise. Each step should be a single logical action.  
If the problem involves math, show all work.  
Return ONLY valid JSON. No markdown code blocks, no extra text."""


def solve_question(
    question: str,
    image_base64: str | None = None,
    image_mime_type: str | None = None,
) -> dict:
    """Generate a step-by-step solution using Gemini 3.1 Pro Preview."""
    parts: list = []

    if image_base64:
        parts.append({
            "inline_data": {
                "mime_type": image_mime_type,
                "data": image_base64,
            }
        })

    parts.append(SOLVE_PROMPT.format(question=question))

    response = model_solve.generate_content(parts)
    return _parse_json(response.text)
