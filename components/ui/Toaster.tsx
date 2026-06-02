'use client';

import { Toaster as Sonner } from 'sonner';
import { useTheme } from 'next-themes';

export function Toaster() {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as any}
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
          fontSize: '14px',
          borderRadius: '12px',
        },
        classNames: {
          toast: 'border border-white/5',
          success: '!border-emerald-500/30',
          error: '!border-red-500/30',
        },
      }}
    />
  );
}
