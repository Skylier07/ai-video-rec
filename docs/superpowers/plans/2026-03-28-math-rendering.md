# Math & Markdown Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render LaTeX math and Markdown formatting in solution steps, the final answer, and the extracted question on the results page.

**Architecture:** Update the backend `SOLVE_PROMPT` to instruct Gemini to output LaTeX (`$...$` inline, `$$...$$` display) and Markdown. Create a single reusable `MathMarkdown` client component using `react-markdown` + `remark-math` + `rehype-katex`. Swap plain text elements in `results/page.tsx` for this component.

**Tech Stack:** react-markdown, remark-math, rehype-katex, katex (KaTeX), Next.js App Router (client component)

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `backend/app/services/gemini.py` | Update `SOLVE_PROMPT` to request LaTeX + Markdown output |
| Create | `backend/tests/test_solve_prompt.py` | Verify prompt contains LaTeX instructions |
| Install | `frontend/package.json` | Add react-markdown, remark-math, rehype-katex, katex |
| Modify | `frontend/src/app/globals.css` | Add KaTeX stylesheet import |
| Create | `frontend/src/components/MathMarkdown.tsx` | Reusable markdown+math renderer component |
| Modify | `frontend/src/app/(dashboard)/results/page.tsx` | Swap 3 plain-text elements for MathMarkdown |

---

## Task 1: Install Frontend Packages

**Files:**
- Modify: `frontend/package.json` (via npm)

- [ ] **Step 1: Install the four packages**

```bash
cd frontend
npm install react-markdown remark-math rehype-katex katex
```

Expected output includes lines like:
```
added 4 packages
```

- [ ] **Step 2: Verify packages appear in package.json**

```bash
grep -E "react-markdown|remark-math|rehype-katex|katex" package.json
```

Expected — all four lines present:
```
"katex": "^0.16.x",
"react-markdown": "^9.x.x",
"rehype-katex": "^7.x.x",
"remark-math": "^6.x.x",
```

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/package.json frontend/package-lock.json
git commit -m "deps: install react-markdown + remark-math + rehype-katex + katex"
```

---

## Task 2: Add KaTeX CSS Import

**Files:**
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Add the import on line 2 of globals.css**

The file currently starts with:
```css
@import "tailwindcss";
```

Add the KaTeX import immediately after:
```css
@import "tailwindcss";
@import "katex/dist/katex.min.css";
```

- [ ] **Step 2: Verify the file compiles — start the dev server**

```bash
cd frontend
npm run dev
```

Expected: server starts without CSS errors. If you see `Cannot find module 'katex'`, Task 1 packages aren't installed — run Task 1 first.

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/src/app/globals.css
git commit -m "style: import KaTeX CSS for math rendering"
```

---

## Task 3: Update Backend SOLVE_PROMPT (TDD)

**Files:**
- Create: `backend/tests/test_solve_prompt.py`
- Modify: `backend/app/services/gemini.py`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_solve_prompt.py`:

```python
from app.services.gemini import SOLVE_PROMPT


def test_solve_prompt_instructs_inline_latex():
    """Prompt must tell Gemini to use $...$ for inline math."""
    assert "$" in SOLVE_PROMPT, "Prompt must contain $ for inline LaTeX"


def test_solve_prompt_instructs_display_latex():
    """Prompt must tell Gemini to use $$...$$ for display math."""
    assert "$$" in SOLVE_PROMPT, "Prompt must contain $$ for display LaTeX"


def test_solve_prompt_mentions_latex():
    """Prompt must explicitly name LaTeX so Gemini uses proper notation."""
    assert "LaTeX" in SOLVE_PROMPT, "Prompt must mention 'LaTeX'"


def test_solve_prompt_instructs_markdown():
    """Prompt must instruct Markdown text formatting."""
    assert "Markdown" in SOLVE_PROMPT or "**bold**" in SOLVE_PROMPT, \
        "Prompt must mention Markdown formatting"
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
cd backend
source .venv/Scripts/activate  # Windows; use: source .venv/bin/activate on Mac/Linux
pytest tests/test_solve_prompt.py -v
```

Expected: all 4 tests FAIL with `AssertionError` (the current prompt has none of these).

- [ ] **Step 3: Update SOLVE_PROMPT in gemini.py**

In `backend/app/services/gemini.py`, replace the `SOLVE_PROMPT` constant (lines 96–114) with:

```python
SOLVE_PROMPT = """You are an expert tutor. A student has the following question:

"{question}"

Provide a clear, step-by-step solution. Structure your response as a JSON object:
{{
  "steps": [
    {{
      "step_number": 1,
      "title": "Short title for this step",
      "content": "Detailed explanation of what to do in this step."
    }}
  ],
  "final_answer": "The final answer, stated concisely."
}}

Be thorough but concise. Each step should be a single logical action.
If the problem involves math, show all work.

Format ALL mathematical expressions using LaTeX delimiters:
- Inline math (flows with surrounding text): $expression$  e.g. $x^2$, $f'(x) = 2x$
- Display math (centered on its own line): $$expression$$  e.g. $$E = mc^2$$

Format explanatory text using Markdown:
- **bold** for key terms or important results
- Bullet lists for sub-parts within a step
- `inline code` for variable names or constants

Return ONLY valid JSON. No markdown code blocks, no extra text."""
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
pytest tests/test_solve_prompt.py -v
```

Expected:
```
PASSED tests/test_solve_prompt.py::test_solve_prompt_instructs_inline_latex
PASSED tests/test_solve_prompt.py::test_solve_prompt_instructs_display_latex
PASSED tests/test_solve_prompt.py::test_solve_prompt_mentions_latex
PASSED tests/test_solve_prompt.py::test_solve_prompt_instructs_markdown
4 passed
```

- [ ] **Step 5: Run the full backend test suite — verify nothing broke**

```bash
pytest -v
```

Expected: all existing tests still pass (8 tests + 4 new = 12 total).

- [ ] **Step 6: Commit**

```bash
cd ..
git add backend/app/services/gemini.py backend/tests/test_solve_prompt.py
git commit -m "feat: update SOLVE_PROMPT to request LaTeX math + Markdown formatting"
```

---

## Task 4: Create MathMarkdown Component

**Files:**
- Create: `frontend/src/components/MathMarkdown.tsx`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/MathMarkdown.tsx`:

```tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Components } from "react-markdown";

const components: Components = {
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }) => (
    <code className="font-mono text-[0.9em] bg-surface-container px-1 py-0.5 rounded">
      {children}
    </code>
  ),
};

interface Props {
  content: string;
  className?: string;
}

export default function MathMarkdown({ content, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors. If you see `Cannot find module 'react-markdown'`, Task 1 wasn't completed.

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/src/components/MathMarkdown.tsx
git commit -m "feat: add MathMarkdown component (react-markdown + KaTeX)"
```

---

## Task 5: Wire MathMarkdown into Results Page

**Files:**
- Modify: `frontend/src/app/(dashboard)/results/page.tsx`

- [ ] **Step 1: Add the import**

At the top of `results/page.tsx`, after the existing imports, add:

```tsx
import MathMarkdown from "@/components/MathMarkdown";
```

The import block should now look like:
```tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { StudySnapResults, VideoSegment, VideoMeta } from "@/types";
import { solveQuestion, type SolveResponse } from "@/lib/api";
import MathMarkdown from "@/components/MathMarkdown";
```

- [ ] **Step 2: Replace the extracted question element**

Find this block (around line 258–262):
```tsx
              <h3 className="text-2xl font-bold text-on-surface mb-8 leading-snug">
                {results.question}
              </h3>
```

Replace with:
```tsx
              <MathMarkdown
                content={results.question}
                className="text-2xl font-bold text-on-surface mb-8 leading-snug"
              />
```

- [ ] **Step 3: Replace the step content element**

Find this block (inside the step map, around line 340):
```tsx
                        <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{step.content}</p>
```

Replace with:
```tsx
                        <MathMarkdown content={step.content} className="text-sm text-on-surface-variant leading-relaxed" />
```

- [ ] **Step 4: Replace the final answer element**

Find this block (around line 352):
```tsx
                      <p className="text-lg font-bold text-on-surface leading-relaxed">{solution.final_answer}</p>
```

Replace with:
```tsx
                      <MathMarkdown content={solution.final_answer} className="text-lg font-bold text-on-surface leading-relaxed" />
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Visual verification — start both servers**

Terminal 1 (backend):
```bash
cd backend
source .venv/Scripts/activate
uvicorn app.main:app --reload --port 8000
```

Terminal 2 (frontend):
```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:3000`, upload a math-heavy question (e.g. a Taylor series or calculus problem), and click through to results. Verify:

- [ ] Extracted question renders with typeset math (not raw `$...$` strings)
- [ ] Solution steps render equations centered/inline correctly
- [ ] Bold text, bullet lists render properly
- [ ] Final answer renders typeset math

- [ ] **Step 7: Commit**

```bash
cd ..
git add frontend/src/app/\(dashboard\)/results/page.tsx
git commit -m "feat: render solution steps and question with MathMarkdown (LaTeX + Markdown)"
```

---

## Task 6: Log in CLAUDE.md and Push

- [ ] **Step 1: Add change log entry to CLAUDE.md**

In the Change Log table in `CLAUDE.md`, add:
```
| 2026-03-28 | Claude | ✅ **MATH RENDERING** — Installed react-markdown + rehype-katex + remark-math. Created `MathMarkdown` component. Updated `SOLVE_PROMPT` to request LaTeX + Markdown output. Results page now renders typeset math in question, solution steps, and final answer. |
```

- [ ] **Step 2: Push to remote**

```bash
git add CLAUDE.md
git commit -m "docs: log math rendering completion in CLAUDE.md"
git push origin feat/backend-current-task
```

Expected:
```
To https://github.com/Skylier07/ai-video-rec.git
   ...  feat/backend-current-task -> feat/backend-current-task
```
