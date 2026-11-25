// src/components/features/ai/floating-chat/CodeBlock.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  code: string;
}

type TokenType =
  | "plain"
  | "comment"
  | "string"
  | "keyword"
  | "number"
  | "builtin"
  | "punctuation";

interface Token {
  type: TokenType;
  value: string;
}

const KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "default",
  "try",
  "catch",
  "finally",
  "throw",
  "new",
  "class",
  "extends",
  "implements",
  "interface",
  "type",
  "enum",
  "import",
  "from",
  "export",
  "async",
  "await",
  "yield",
  "typeof",
  "instanceof",
  "in",
  "of",
  "def",
  "elif",
  "pass",
  "lambda",
  "with",
  "as",
  "raise",
  "select",
  "insert",
  "update",
  "delete",
  "where",
  "join",
  "inner",
  "left",
  "right",
  "group",
  "order",
  "by",
  "limit",
  "create",
  "table",
  "alter",
  "drop",
  "into",
  "values",
  "and",
  "or",
  "not",
  "null",
  "true",
  "false",
  "undefined",
  "None",
  "True",
  "False",
  "pub",
  "fn",
  "struct",
  "impl",
  "match",
  "mut",
  "use",
  "package",
  "func",
  "go",
  "defer",
]);

const BUILTINS = new Set([
  "console",
  "window",
  "document",
  "Math",
  "JSON",
  "Promise",
  "Array",
  "Object",
  "String",
  "Number",
  "Boolean",
  "Map",
  "Set",
  "Date",
  "Error",
  "React",
  "print",
  "len",
  "range",
  "str",
  "int",
  "float",
  "list",
  "dict",
  "fetch",
]);

const TOKEN_REGEX =
  /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|[{}()[\].,:;+\-*/%=<>!&|?]+)/g;

function tokenizeCode(code: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of code.matchAll(TOKEN_REGEX)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      tokens.push({ type: "plain", value: code.slice(lastIndex, idx) });
    }

    const raw = match[0];
    let type: TokenType = "plain";

    if (raw.startsWith("//") || raw.startsWith("#") || raw.startsWith("/*")) {
      type = "comment";
    } else if (raw.startsWith('"') || raw.startsWith("'") || raw.startsWith("`")) {
      type = "string";
    } else if (/^\d/.test(raw)) {
      type = "number";
    } else if (KEYWORDS.has(raw)) {
      type = "keyword";
    } else if (BUILTINS.has(raw)) {
      type = "builtin";
    } else if (/^[{}()[\].,:;+\-*/%=<>!&|?]+$/.test(raw)) {
      type = "punctuation";
    }

    tokens.push({ type, value: raw });
    lastIndex = idx + raw.length;
  }

  if (lastIndex < code.length) {
    tokens.push({ type: "plain", value: code.slice(lastIndex) });
  }

  return tokens;
}

const TOKEN_CLASS: Record<TokenType, string> = {
  plain: "text-zinc-100",
  comment: "text-zinc-500 italic",
  string: "text-emerald-400",
  keyword: "text-violet-400 font-medium",
  number: "text-amber-300",
  builtin: "text-sky-300",
  punctuation: "text-zinc-400",
};

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const tokens = useMemo(() => tokenizeCode(code), [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures in restricted contexts
    }
  };

  return (
    <div className="my-2.5 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xs">
      <div className="flex items-center justify-between border-b border-zinc-800/90 bg-zinc-900/90 px-3 py-1.5">
        <span className="font-mono text-[11px] font-medium lowercase text-zinc-400">
          {language?.trim() || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Sao chép mã"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>Đã chép</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Sao chép</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-3">
        <pre className="m-0 font-mono text-[12px] leading-relaxed whitespace-pre">
          <code>
            {tokens.map((tok, idx) => (
              <span key={idx} className={TOKEN_CLASS[tok.type]}>
                {tok.value}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
