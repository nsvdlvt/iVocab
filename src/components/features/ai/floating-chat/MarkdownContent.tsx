// src/components/features/ai/floating-chat/MarkdownContent.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  // Parse lines for tables, bullet points, headers, etc.
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (key: number) => {
    if (tableHeader.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={`table-${key}`} className="my-2 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs border-collapse">
            {tableHeader.length > 0 && (
              <thead className="bg-muted/70 text-foreground font-semibold">
                <tr>
                  {tableHeader.map((th, idx) => (
                    <th key={idx} className="border-b border-border px-3 py-2">
                      {renderInline(th.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((tr, rIdx) => (
                <tr
                  key={rIdx}
                  className={cn(
                    "border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors",
                    rIdx % 2 === 1 && "bg-muted/10"
                  )}
                >
                  {tr.map((td, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-foreground/90">
                      {renderInline(td.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    inTable = false;
    tableHeader = [];
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table detection: line starts and ends with |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());

      // If it's a separator line like |---|---|
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    // Empty line
    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-1.5" />);
      continue;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-sm font-bold text-foreground mt-3 mb-1">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-sm font-extrabold text-foreground mt-3.5 mb-1.5">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="text-base font-extrabold text-foreground mt-4 mb-2">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // Bullet points
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2 text-xs leading-relaxed my-0.5">
          <span className="text-primary mt-1 select-none font-bold">•</span>
          <div className="flex-1 text-foreground/90">{renderInline(trimmed.slice(2))}</div>
        </div>
      );
      continue;
    }

    // Numbered lists (1. , 2. )
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-2 text-xs leading-relaxed my-0.5">
          <span className="text-primary font-bold min-w-[16px] text-right">
            {numberedMatch[1]}.
          </span>
          <div className="flex-1 text-foreground/90">{renderInline(numberedMatch[2])}</div>
        </div>
      );
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={i} className="text-xs leading-relaxed my-1 text-foreground/90">
        {renderInline(trimmed)}
      </p>
    );
  }

  if (inTable) {
    flushTable(lines.length);
  }

  return <div className={cn("space-y-0.5 break-words", className)}>{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Split on bold (**...**) and inline code (`...`)
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return tokens.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={idx}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}
