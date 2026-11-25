// src/components/features/ai/floating-chat/MarkdownContent.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./CodeBlock";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

type Block =
  | { type: "code"; language: string; content: string }
  | { type: "heading"; level: 1 | 2 | 3 | 4; content: string }
  | { type: "blockquote"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; start: number; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "paragraph"; content: string };

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  const cells = trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c));
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function parseMarkdownBlocks(raw: string): Block[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      i += 1;
      continue;
    }

    // Fenced code block (supports unclosed block while streaming)
    const fenceMatch = trimmed.match(/^```([A-Za-z0-9_+-]*)\s*$/);
    if (fenceMatch) {
      const language = fenceMatch[1] || "";
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length && lines[i].trim().startsWith("```")) {
        i += 1;
      }
      blocks.push({ type: "code", language, content: codeLines.join("\n") });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    // Headings (# .. ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3 | 4,
        content: headingMatch[2],
      });
      i += 1;
      continue;
    }

    // Table (header row + separator row)
    if (
      trimmed.includes("|") &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      i += 2;
      while (
        i < lines.length &&
        lines[i].trim().includes("|") &&
        lines[i].trim().length > 0
      ) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "blockquote", lines: quoteLines });
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    const olFirst = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olFirst) {
      const start = parseInt(olFirst[1], 10) || 1;
      const items: string[] = [];
      while (i < lines.length) {
        const match = lines[i].match(/^\s*\d+\.\s+(.*)$/);
        if (!match) break;
        items.push(match[1]);
        i += 1;
      }
      blocks.push({ type: "ol", start, items });
      continue;
    }

    // Paragraph (gather contiguous non-special lines)
    const paraLines: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const nextTrimmed = lines[i].trim();
      if (
        !nextTrimmed ||
        nextTrimmed.startsWith("```") ||
        /^#{1,4}\s+/.test(nextTrimmed) ||
        nextTrimmed.startsWith(">") ||
        /^[-*+]\s+/.test(nextTrimmed) ||
        /^\d+\.\s+/.test(nextTrimmed) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(nextTrimmed) ||
        (nextTrimmed.includes("|") &&
          i + 1 < lines.length &&
          isTableSeparator(lines[i + 1]))
      ) {
        break;
      }
      paraLines.push(nextTrimmed);
      i += 1;
    }
    blocks.push({ type: "paragraph", content: paraLines.join("\n") });
  }

  return blocks;
}

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("/")
  );
}

const INLINE_REGEX =
  /(`[^`\n]+`|\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\n]+\*|_[^_\n]+_|\[[^\]]+\]\([^)\s]+\))/g;

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;

  for (const match of text.matchAll(INLINE_REGEX)) {
    const idx = match.index ?? 0;
    if (idx > lastIdx) {
      parts.push(text.slice(lastIdx, idx));
    }

    const token = match[0];

    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={idx}
          className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground border border-border/60"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("***") && token.endsWith("***")) {
      parts.push(
        <strong key={idx} className="font-semibold italic text-foreground">
          {renderInline(token.slice(3, -3))}
        </strong>
      );
    } else if (
      (token.startsWith("**") && token.endsWith("**")) ||
      (token.startsWith("__") && token.endsWith("__"))
    ) {
      parts.push(
        <strong key={idx} className="font-semibold text-foreground">
          {renderInline(token.slice(2, -2))}
        </strong>
      );
    } else if (token.startsWith("~~") && token.endsWith("~~")) {
      parts.push(
        <del key={idx} className="line-through text-muted-foreground">
          {renderInline(token.slice(2, -2))}
        </del>
      );
    } else if (
      (token.startsWith("*") && token.endsWith("*")) ||
      (token.startsWith("_") && token.endsWith("_"))
    ) {
      parts.push(
        <em key={idx} className="italic">
          {renderInline(token.slice(1, -1))}
        </em>
      );
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (linkMatch && isSafeUrl(linkMatch[2])) {
        parts.push(
          <a
            key={idx}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    } else {
      parts.push(token);
    }

    lastIdx = idx + token.length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const blocks = React.useMemo(() => parseMarkdownBlocks(content), [content]);

  return (
    <div className={cn("space-y-2.5 text-[13px] leading-relaxed break-words min-w-0", className)}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "code":
            return (
              <CodeBlock
                key={idx}
                language={block.language}
                code={block.content}
              />
            );

          case "heading": {
            const headingClasses = {
              1: "text-base font-bold text-foreground pt-1",
              2: "text-[15px] font-bold text-foreground pt-1",
              3: "text-sm font-semibold text-foreground pt-0.5",
              4: "text-[13px] font-semibold text-foreground",
            }[block.level];
            const Tag = `h${block.level}` as "h1" | "h2" | "h3" | "h4";
            return (
              <Tag key={idx} className={headingClasses}>
                {renderInline(block.content)}
              </Tag>
            );
          }

          case "blockquote":
            return (
              <blockquote
                key={idx}
                className="border-l-2 border-primary/60 bg-muted/40 pl-3 pr-2 py-1.5 rounded-r-lg text-muted-foreground italic space-y-1"
              >
                {block.lines.map((line, lIdx) => (
                  <p key={lIdx}>{renderInline(line)}</p>
                ))}
              </blockquote>
            );

          case "ul":
            return (
              <ul
                key={idx}
                className="list-disc pl-5 space-y-1 text-foreground/95 marker:text-muted-foreground"
              >
                {block.items.map((item, iIdx) => (
                  <li key={iIdx} className="leading-relaxed">
                    {renderInline(item)}
                  </li>
                ))}
              </ul>
            );

          case "ol":
            return (
              <ol
                key={idx}
                start={block.start}
                className="list-decimal pl-5 space-y-1 text-foreground/95 marker:text-muted-foreground marker:font-medium"
              >
                {block.items.map((item, iIdx) => (
                  <li key={iIdx} className="leading-relaxed">
                    {renderInline(item)}
                  </li>
                ))}
              </ol>
            );

          case "table":
            return (
              <div
                key={idx}
                className="my-2 overflow-x-auto rounded-xl border border-border bg-background/60"
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/70 text-foreground font-semibold">
                    <tr>
                      {block.headers.map((th, hIdx) => (
                        <th
                          key={hIdx}
                          className="border-b border-border px-3 py-2 whitespace-nowrap"
                        >
                          {renderInline(th)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((tr, rIdx) => (
                      <tr
                        key={rIdx}
                        className="border-b border-border/50 last:border-b-0 even:bg-muted/20"
                      >
                        {block.headers.map((_, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-3 py-2 text-foreground/90 align-top"
                          >
                            {renderInline(tr[cIdx] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "hr":
            return <hr key={idx} className="my-3 border-border" />;

          case "paragraph":
          default:
            return (
              <p key={idx} className="whitespace-pre-wrap text-foreground/95">
                {renderInline(block.content)}
              </p>
            );
        }
      })}
    </div>
  );
}
