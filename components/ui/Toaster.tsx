'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'hsl(222 47% 8%)',
          border: '1px solid hsl(222 47% 14%)',
          color: 'hsl(210 40% 98%)',
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
