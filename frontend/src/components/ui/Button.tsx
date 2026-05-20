import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const variants = {
      primary: 'premium-gradient text-white shadow-[0_0_15px_-5px_#a855f7] hover:opacity-90',
      secondary: 'bg-white/10 text-white hover:bg-white/15',
      outline: 'border border-white/10 text-white hover:bg-white/5',
      ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
      danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
    };

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
          'inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
