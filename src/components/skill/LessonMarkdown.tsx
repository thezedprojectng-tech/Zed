"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LessonMarkdownProps {
  content: string;
}

export function LessonMarkdown({ content }: LessonMarkdownProps) {
  return (
    <div className="max-w-prose font-sans text-sm text-foreground/90 leading-relaxed selection:bg-primary/20">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3 className="type-h3 text-foreground font-semibold mt-4 mb-2 tracking-tight">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4 className="type-h4 text-foreground font-semibold mt-4 mb-2 tracking-tight">
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h4 className="text-base font-semibold text-foreground mt-4 mb-2 tracking-tight">
              {children}
            </h4>
          ),
          h4: ({ children }) => (
            <h5 className="text-sm font-semibold text-foreground mt-3 mb-1.5">
              {children}
            </h5>
          ),
          h5: ({ children }) => (
            <h6 className="text-xs font-semibold text-muted-foreground mt-2 mb-1">
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p className="text-muted-foreground leading-relaxed my-2.5">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/95">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 space-y-1.5 my-3 text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 space-y-1.5 my-3 text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),
          code: ({ children, className }) => {
            return (
              <code
                className={`rounded px-1.5 py-0.5 font-mono text-[12px] bg-secondary text-foreground border border-border/70 ${className || ""}`}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg bg-secondary/60 p-3.5 border border-border my-3 font-mono text-xs text-foreground">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/50 pl-3.5 italic text-muted-foreground my-3">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-border my-4" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
