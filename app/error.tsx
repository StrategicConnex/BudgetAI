'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Algo salio mal
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Ocurrio un error inesperado. Podes intentar recargar la pagina.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-xs text-destructive/80 bg-destructive/5 border border-destructive/10 rounded-lg p-3 mb-6 text-left overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <Button variant="ghost" size="sm" onClick={() => reset()} icon={<RefreshCw className="w-4 h-4" />}>
            Reintentar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            Recargar pagina
          </Button>
        </div>
      </div>
    </div>
  );
}
