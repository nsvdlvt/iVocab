"use client";

/**
 * Shared Enter key handler for text‑input study components.
 * It enforces the lifecycle:
 *   - If the answer hasn't been submitted, pressing Enter triggers submission.
 *   - If the answer is already submitted, pressing Enter triggers continuation to the next question.
 * The handler returns a React KeyboardEvent handler that can be attached to the input.
 */
export function createEnterKeyHandler(
  isSubmitted: boolean,
  inputValue: string,
  onSubmit: () => void,
  onContinue: () => void,
) {
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (!isSubmitted && inputValue.trim()) {
      onSubmit();
    } else if (isSubmitted) {
      onContinue();
    }
  };
}
