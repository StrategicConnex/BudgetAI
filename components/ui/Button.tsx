'use client';

import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'gradient';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:opacity-90 shadow-[0_4px_20px_hsl(239_84%_67%/0.3)]',
  secondary:
    'border border-border bg-secondary hover:bg-secondary/80 text-foreground',
  ghost:
    'text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 border border-border',
  destructive:
    'bg-destructive text-destructive-foreground hover:opacity-90',
  gradient:
    'text-white font-semibold',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, style, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          variantStyles[variant],
          sizeStyles[size],
          variant === 'gradient' && 'bg-gradient-to-r from-[hsl(239_84%_67%)] to-[hsl(262_80%_65%)]',
          className
        )}
        style={
          variant === 'gradient' && !style?.background
            ? { boxShadow: '0 8px 32px hsl(239 84% 67% / 0.35)', ...style }
            : style
        }
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
