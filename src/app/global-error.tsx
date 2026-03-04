'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="es">
            <body>
                <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
                    <div className="max-w-md w-full p-8 bg-card border border-border shadow-lg rounded-xl text-center">
                        <div className="flex justify-center mb-4">
                            <AlertTriangle className="h-16 w-16 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold mb-4">Error Crítico de Aplicación</h1>
                        <p className="text-muted-foreground text-sm mb-8">
                            Clinicboard ha experimentado un fallo general inesperado.
                            Por favor, intente recargar la aplicación para continuar.
                        </p>

                        <button
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium transition-colors"
                            onClick={() => reset()}
                        >
                            Reiniciar Aplicación
                        </button>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-8 text-left text-xs p-4 bg-muted border border-border rounded-md overflow-auto max-h-40">
                                <p className="text-destructive font-semibold mb-2">Debug (SÓLO DESARROLLO):</p>
                                <pre className="m-0 whitespace-pre-wrap font-mono text-muted-foreground">
                                    {error.message}
                                </pre>
                                {error.digest && (
                                    <p className="mt-2 opacity-70">Digest: {error.digest}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </body>
        </html>
    );
}
