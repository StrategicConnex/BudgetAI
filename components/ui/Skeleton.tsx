'use client';

import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-muted',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/5 bg-card/80 backdrop-blur-sm p-5 space-y-4"
        >
          <Skeleton variant="rectangular" className="w-10 h-10" />
          <Skeleton className="w-24 h-8" />
          <Skeleton className="w-32 h-4" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/5 bg-card/80 backdrop-blur-sm p-5"
        >
          <div className="flex items-center gap-4">
            <Skeleton variant="rectangular" className="w-10 h-10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-48 h-4" />
              <Skeleton className="w-32 h-3" />
            </div>
            <Skeleton className="w-20 h-6" />
          </div>
        </div>
      ))}
    </div>
  );
}
