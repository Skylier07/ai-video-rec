# Math & Markdown Rendering — Design Spec

**Date:** 2026-03-28
**Feature:** Render solution steps, final answer, and extracted question with proper LaTeX math and markdown formatting
**Status:** Approved

---

## Problem

The `/solve` endpoint returns step-by-step solution text that contains mathematical notation (e.g. Taylor series, derivatives, fractions). Currently this renders as raw plain text (`whitespace-pre-wrap`), producing unreadable output like:

```
f(c) + f'(c)(x - c) + [f''(c) / 2!](x - c)^2 + ...
```

The extracted question from `/analyze` has the same problem.

---

## Goals

- Render LaTeX math expressions as properly typeset equations (inline and block)
- Render standard markdown formatting (bold, lists, inline code) in solution content
- Apply to: extracted question, step content, final answer
- Zero changes to API contract or response shapes

---

## Architecture

### Backend — `backend/app/services/gemini.py`

Update `SOLVE_PROMPT` to add explicit formatting instructions inside the existing prompt. The JSON structure (`steps[]`, `final_answer`) is unchanged. Only the content strings inside `steps[].content` and `final_answer` will change format.

New instructions added to prompt:
```
Format ALL mathematical expressions using LaTeX:
  - Inline math (flows with text): $f(x) = x^2$
  - Display/block equations (centered, own line): $$\frac{d}{dx}f(x) = 2x$$
Format text using standard Markdown:
  - **bold** for key terms or important results
  - Bullet lists for sub-parts within a step
  - `inline code` for variable names or constants
```

### Frontend — New Component

**`frontend/src/components/MathMarkdown.tsx`** — client component, single responsibility: render a markdown+LaTeX string.

```
Props:
  content: string       — the markdown+LaTeX string to render
  className?: string    — applied to wrapper div (caller controls text size/color)

Libraries:
  react-markdown        — markdown AST renderer
  remark-math           — parses $...$ and $$...$$ into math nodes
  rehype-katex          — renders math nodes via KaTeX
  katex                 — KaTeX engine (peer dep of rehype-katex)

Internal component overrides (inherits design system colors):
  ul / ol               — margin + list-style
  li                    — spacing
  code (inline)         — monospace, subtle background
  strong                — font-bold (already default)
```

No hardcoded colors. All text styling comes from `className` at the call site.

### Frontend — KaTeX CSS

Import KaTeX stylesheet in `frontend/src/app/globals.css`:
```css
@import 'katex/dist/katex.min.css';
```

This is the only global side-effect. KaTeX's CSS is self-contained and won't conflict with Tailwind.

### Frontend — Integration Points (`results/page.tsx`)

| Location | Current element | Change |
|----------|----------------|--------|
| Extracted question | `<h3 className="text-2xl font-bold ...">` wrapping text | Replace text node with `<MathMarkdown content={results.question} className="text-2xl font-bold text-on-surface leading-snug" />` |
| Step content | `<p className="text-sm ... whitespace-pre-wrap">` | Replace with `<MathMarkdown content={step.content} className="text-sm text-on-surface-variant leading-relaxed" />` (remove `whitespace-pre-wrap`) |
| Final answer | `<p className="text-lg font-bold text-on-surface ...">` | Replace with `<MathMarkdown content={solution.final_answer} className="text-lg font-bold text-on-surface leading-relaxed" />` |
| Step title (`<h5>`) | Plain text | **Unchanged** — short labels, no math expected |

---

## Packages to Install

```bash
cd frontend
npm install react-markdown remark-math rehype-katex katex
```

Approximate bundle addition: ~280KB (KaTeX fonts + JS). Acceptable for this project.

---

## What Does NOT Change

- `/solve` response shape (`steps[]`, `final_answer`) — identical
- `/analyze` response shape — identical
- All TypeScript types in `lib/api.ts` and `types/`
- Any other page or component
- Gemini's notes in `frontend/gemini.md` — Gemini's `handleReveal` / solution state untouched

---

## Minor Decisions (pre-resolved)

- **KaTeX CSS**: `@import` in `globals.css`, not `layout.tsx`
- **`whitespace-pre-wrap`**: Removed from step content — react-markdown handles newlines
- **SSR**: `"use client"` on `MathMarkdown` — KaTeX requires the DOM
- **KaTeX parse errors**: No error boundary — KaTeX silently falls back to raw text on malformed delimiters
- **Step titles**: Plain `<h5>`, no markdown rendering needed

---

## Files Changed

1. `backend/app/services/gemini.py` — prompt update only
2. `frontend/src/components/MathMarkdown.tsx` — new file
3. `frontend/src/app/(dashboard)/results/page.tsx` — 3 element swaps
4. `frontend/src/app/globals.css` — 1 import line
