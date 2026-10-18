import { findTemplateVariable } from "./template-variables";

export interface TemplateValidationResult {
  isValid: boolean;
  variables: string[];
  unknownVariables: string[];
  errors: string[];
}

export interface RenderTemplateOptions {
  /**
   * Whether to escape HTML special characters in variable values (default true).
   */
  escapeHtml?: boolean;
  /**
   * Whether to allow fallback to default empty or default text if a variable is missing (default false).
   * In strict mode (false), if a variable is missing, it is recorded in missingVariables.
   */
  allowMissingFallback?: boolean;
}

export interface RenderResult {
  title: string;
  body: string;
  actionUrl: string | null;
  missingVariables: string[];
  resolvedVariables: Record<string, string | number>;
  success: boolean;
}

// Regex to match {variable_name} placeholders
const VARIABLE_REGEX = /\{([a-zA-Z0-9_]+)\}/g;

/**
 * Escapes characters that could lead to HTML injection.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Extracts all variable names used in a text (e.g. ['name', 'streak'])
 */
export function extractVariables(text: string): string[] {
  if (!text) return [];
  const matches = new Set<string>();
  let match: RegExpExecArray | null;
  // Reset regex state
  VARIABLE_REGEX.lastIndex = 0;
  while ((match = VARIABLE_REGEX.exec(text)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
}

/**
 * Validates a template's title and body against the registered variable schema.
 */
export function validateTemplate(template: {
  title: string;
  body: string;
}): TemplateValidationResult {
  const errors: string[] = [];

  if (!template.title || template.title.trim().length === 0) {
    errors.push("Tiêu đề thông báo không được để trống.");
  }
  if (!template.body || template.body.trim().length === 0) {
    errors.push("Nội dung thông báo không được để trống.");
  }

  const titleVars = extractVariables(template.title);
  const bodyVars = extractVariables(template.body);
  const allVars = Array.from(new Set([...titleVars, ...bodyVars]));

  const unknownVariables: string[] = [];
  for (const v of allVars) {
    if (!findTemplateVariable(v)) {
      unknownVariables.push(v);
      errors.push(`Biến '{${v}}' không nằm trong thư viện biến được hỗ trợ.`);
    }
  }

  return {
    isValid: errors.length === 0,
    variables: allVars,
    unknownVariables,
    errors,
  };
}

/**
 * Formats a value safely for insertion into a template.
 */
export function formatValue(value: unknown, escape = false): string {
  if (value === null || value === undefined) {
    return "";
  }
  let strValue: string;
  if (typeof value === "number") {
    strValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  } else if (typeof value === "string") {
    strValue = value;
  } else if (value instanceof Date) {
    strValue = value.toLocaleDateString("vi-VN");
  } else {
    strValue = String(value);
  }

  return escape ? escapeHtml(strValue) : strValue;
}

/**
 * Centralized Template Rendering Engine.
 * Safely substitutes {variable} placeholders with validated user context data.
 */
export function renderTemplate(
  template: {
    title: string;
    body: string;
    action_url?: string | null;
  },
  context: Record<string, unknown>,
  options: RenderTemplateOptions = {}
): RenderResult {
  const escape = options.escapeHtml ?? false;
  const missingVariables: string[] = [];
  const resolvedVariables: Record<string, string | number> = {};

  const substitute = (text: string): string => {
    return text.replace(VARIABLE_REGEX, (match, varName) => {
      const val = context[varName];

      if (val === undefined || val === null) {
        missingVariables.push(varName);
        if (options.allowMissingFallback) {
          return "";
        }
        return match; // Keep {varName} so caller knows it wasn't resolved
      }

      const formatted = formatValue(val, escape);
      resolvedVariables[varName] = typeof val === "number" ? val : formatted;
      return formatted;
    });
  };

  const renderedTitle = substitute(template.title);
  const renderedBody = substitute(template.body);

  // Also substitute variables in action_url if any (e.g. /review?set={setId})
  let renderedActionUrl = template.action_url ?? null;
  if (renderedActionUrl) {
    renderedActionUrl = substitute(renderedActionUrl);
  }

  const success = missingVariables.length === 0;

  return {
    title: renderedTitle,
    body: renderedBody,
    actionUrl: renderedActionUrl,
    missingVariables: Array.from(new Set(missingVariables)),
    resolvedVariables,
    success,
  };
}
