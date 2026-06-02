'use client';

import { clsx } from 'clsx';

type BadgeVariant = 'premium' | 'primary' | 'success' | 'warning' | 'error' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  premium:
    'bg-gradient-to-r from-[hsl(239_84%_67%/0.2)] to-[hsl(262_80%_65%/0.2)] border-[hsl(239_84%_67%/0.3)] text-[hsl(239_84%_67%)]',
  primary:
    'bg-primary/10 border-primary/20 text-primary',
  success:
    'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  warning:
    'bg-amber-500/10 border-amber-500/20 text-amber-400',
  error:
    'bg-red-500/10 border-red-500/20 text-red-400',
  default:
    'bg-muted border-border text-muted-foreground',
};

export function Badge({ children, variant = 'default', icon, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
