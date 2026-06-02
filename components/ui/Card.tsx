'use client';

import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  style?: React.CSSProperties;
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
};

export function Card({
  children,
  className,
  hover = false,
  padding = 'lg',
  style,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl border border-white/5 bg-card/80 backdrop-blur-sm',
        paddingStyles[padding],
        hover && 'hover:border-primary/20 transition-all duration-150 cursor-pointer',
        className
      )}
      style={{
        background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.7) 100%)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-center gap-2 mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={clsx('text-sm font-semibold text-foreground', className)}>
      {children}
    </h3>
  );
}
