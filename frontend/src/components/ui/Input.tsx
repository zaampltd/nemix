import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, style, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium px-1" style={{ color: "var(--md-on-surface-var)" }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn("flex h-12 w-full rounded-xl px-4 py-2 text-sm transition-all", className)}
          style={{
            background: "var(--md-surface-2)",
            border: `1px solid ${error ? "var(--md-error)" : "var(--md-outline)"}`,
            color: "var(--md-on-surface)",
            outline: "none",
            ...style,
          }}
          {...props}
        />
        {error && (
          <p className="text-xs px-1" style={{ color: "var(--md-error)" }}>{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
