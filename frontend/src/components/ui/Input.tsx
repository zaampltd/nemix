import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-400 px-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white ring-offset-black file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            error && "border-red-500/50 focus-visible:ring-red-500/50",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400 px-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
