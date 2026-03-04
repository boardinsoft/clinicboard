import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center bg-background text-foreground p-4">
            {/* Brand Logo/Name */}
            <div className="mb-12 flex items-center justify-center">
                <span className="text-3xl font-bold tracking-tight">clinic</span>
                <span className="text-3xl tracking-tight text-primary font-light">board</span>
            </div>

            {/* Error Code */}
            <h1 className="text-9xl font-light leading-none m-0 text-primary mb-2">
                404
            </h1>

            {/* Message */}
            <h2 className="text-2xl font-normal mb-8 text-muted-foreground">
                Página no encontrada
            </h2>

            <p className="max-w-md mb-12 text-sm leading-relaxed text-muted-foreground/80">
                Lo sentimos, la ruta que intentas acceder no existe o ha sido movida permanentemente.
            </p>

            {/* Action */}
            <Button variant="outline" className="px-8" asChild>
                <Link href="/">Volver al inicio</Link>
            </Button>
        </div>
    );
}
