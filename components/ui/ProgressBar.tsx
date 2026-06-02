'use client';

import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  variant?: 'gradient' | 'primary' | 'success';
  className?: string;
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2',
};

const variantStyles = {
  gradient: 'bg-gradient-to-r from-[hsl(239_84%_67%)] to-[hsl(262_80%_65%)]',
  primary: 'bg-primary',
  success: 'bg-emerald-400',
};

export function ProgressBar({
  value,
  label,
  showLabel = false,
  size = 'md',
  variant = 'gradient',
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={clsx('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{label}</span>
          <span>{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-secondary rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-700 ease-out', variantStyles[variant])}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

// Small dot-step indicator for pipeline stages
interface StepIndicatorProps {
  steps: Array<{ key: string; label: string }>;
  currentStep: string;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  const currentIdx = steps.findIndex(s => s.key === currentStep);

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {steps.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isActive = step.key === currentStep;

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={clsx(
                'w-1.5 h-1.5 rounded-full transition-colors',
                isDone && 'bg-emerald-400',
                isActive && 'bg-primary animate-pulse',
                !isDone && !isActive && 'bg-muted-foreground/30'
              )}
            />
            {idx < steps.length - 1 && (
              <div
                className={clsx(
                  'w-6 h-px',
                  isDone ? 'bg-emerald-400/50' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
