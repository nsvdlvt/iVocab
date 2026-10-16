"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  hasError = false,
  autoFocus = true,
  className,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        // Clear current digit
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      } else if (index > 0) {
        // Move to previous digit and clear it
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      return;
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const inputValue = e.target.value;

    // Filter out non-numeric characters
    const numericChar = inputValue.replace(/\D/g, "");
    if (!numericChar) {
      const newDigits = [...digits];
      newDigits[index] = "";
      onChange(newDigits.join(""));
      return;
    }

    // Single character input
    const char = numericChar.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    const newOtp = newDigits.join("");
    onChange(newOtp);

    // Auto advance to next box
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "");
    if (!pastedData) return;

    const truncated = pastedData.slice(0, length);
    onChange(truncated);

    // Focus box after last pasted digit
    const nextIndex = Math.min(truncated.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="group"
      aria-label="Nhập mã xác thực 6 chữ số"
      className={cn("flex items-center justify-center gap-2 sm:gap-3", className)}
    >
      {Array.from({ length }).map((_, index) => {
        const isCurrentActive =
          index === (value.length < length ? value.length : length - 1);

        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            value={digits[index]}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            aria-label={`Chữ số thứ ${index + 1}`}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onChange={(e) => handleChange(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={cn(
              "h-12 w-10 sm:h-14 sm:w-12 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border border-border/80 bg-background text-foreground transition-all duration-150 outline-none select-none shadow-2xs",
              "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary",
              hasError && "border-destructive text-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive",
              disabled && "opacity-50 cursor-not-allowed bg-muted/40",
              isCurrentActive && !digits[index] && !hasError && "border-primary/60"
            )}
          />
        );
      })}
    </div>
  );
}
