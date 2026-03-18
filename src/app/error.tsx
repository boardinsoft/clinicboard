'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Settings } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error for tracking
        console.error('Global Application Error:', error);
    }, [error]);

    const isConfigError = error.message?.includes('Supabase configuration error');

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-destructive/10">
                        {isConfigError ? (
                            <Settings className="h-12 w-12 text-destructive" />
                        ) : (
                            <AlertCircle className="h-12 w-12 text-destructive" />
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {isConfigError ? 'Error de Configuración' : 'Algo salió mal'}
                    </h1>
                    <p className="text-muted-foreground leading-relaxed">
                        {isConfigError 
                            ? 'Faltan variables de entorno críticas (Supabase) para que este despliegue funcione correctamente.'
                            : 'Ocurrió un error inesperado en el servidor. Estamos trabajando para solucionarlo.'}
                    </p>
                    
                    {error.message && (
                        <div className="p-4 bg-muted/50 rounded-lg text-left overflow-x-auto">
                            <code className="text-xs text-destructive break-all uppercase font-bold">
                                {error.message}
                            </code>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button
                        onClick={() => reset()}
                        variant="default"
                        className="group"
                    >
                        <RefreshCw className="mr-2 h-4 w-4 transition-transform group-hover:rotate-180" />
                        Reintentar
                    </Button>
                    <Button
                        onClick={() => window.location.href = '/'}
                        variant="outline"
                    >
                        Ir al inicio
                    </Button>
                </div>

                <p className="text-[10px] text-muted-foreground pt-8 uppercase tracking-widest font-mono">
                    ID de Error: {error.digest || 'no-digest'}
                </p>
            </div>
        </div>
    );
}
