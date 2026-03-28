"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const components: Components = {
  ul: ({ children }: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
  ),
  ol: ({ children }: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
  ),
  li: ({ children }: React.ComponentPropsWithoutRef<"li">) => (
    <li className="leading-relaxed">{children}</li>
  ),
  code: ({ children, className: langClass }: React.ComponentPropsWithoutRef<"code">) => {
    const isBlock = Boolean(langClass);
    if (isBlock) {
      return (
        <pre className="bg-surface-container rounded-lg p-4 overflow-x-auto my-3">
          <code className={`font-mono text-sm ${langClass ?? ""}`}>{children}</code>
        </pre>
      );
    }
    return (
      <code className="font-mono text-[0.9em] bg-surface-container px-1 py-0.5 rounded">
        {children}
      </code>
    );
  },
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
