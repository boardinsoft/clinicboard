'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="p-12 min-h-[calc(100vh-48px)] flex flex-col items-center justify-center bg-background text-foreground transition-colors">
            <div className="max-w-2xl w-full">
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Algo salió mal</AlertTitle>
                    <AlertDescription>
                        El dashboard tuvo un problema al cargar esta sección. Por favor, intenta de nuevo.
                    </AlertDescription>
                </Alert>
                <div className="flex justify-center mb-8">
                    <Button variant="secondary" onClick={() => reset()}>
                        Reintentar carga
                    </Button>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-6 border border-border bg-muted rounded-md text-sm text-left">
                        <p className="font-semibold mb-2 text-destructive">Debug Info (Development Only):</p>
                        {error.digest && (
                            <p className="font-mono text-xs text-muted-foreground mb-2">
                                Digest: {error.digest}
                            </p>
                        )}
                        <pre className="text-xs whitespace-pre-wrap text-muted-foreground font-mono m-0 overflow-auto max-h-64">
                            {error.message}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
