// src/lib/ai/errors.ts
/**
 * Typed error classes for AI operations.
 * UI layers can catch specific subclasses to display appropriate messages.
 */
export class AIResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIResponseError";
  }
}

export class AIValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIValidationError";
  }
}

export class AIAbortError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIAbortError";
  }
}

export class AINetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AINetworkError";
  }
}
