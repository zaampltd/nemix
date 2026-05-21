import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary:   { background: "var(--md-primary)", color: "var(--md-on-primary)" },
  secondary: { background: "var(--md-surface-2)", color: "var(--md-on-surface)", border: "1px solid var(--md-outline)" },
  outline:   { background: "transparent", color: "var(--md-on-surface)", border: "1px solid var(--md-outline)" },
  ghost:     { background: "transparent", color: "var(--md-on-surface-var)" },
  danger:    { background: "var(--md-error-cont)", color: "var(--md-error)", border: "1px solid var(--md-outline)" },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, style, ...props }, ref) => {
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-8 py-4 text-base',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        disabled={loading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-opacity active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none hover:opacity-90',
          sizes[size],
          className
        )}
        style={{ ...VARIANT_STYLES[variant], ...style }}
        {...props}
      >
        {loading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "currentColor", borderTopColor: "transparent" }} />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
