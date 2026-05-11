import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="flex min-h-svh items-center justify-center bg-background p-4">
            <div className="card-clinic p-8 w-full max-w-md flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                    <Image
                        src="/brand/logo-mark.svg"
                        alt="ClinicBoard"
                        width={196}
                        height={196}
                        className="text-b-8"
                    />
                </div>

                <h1 className="text-8xl font-light leading-none text-primary mb-3">
                    404
                </h1>

                <h2 className="text-xl font-medium text-n-11 mb-4">
                    Página no encontrada
                </h2>

                <p className="text-sm text-n-8 leading-relaxed mb-8 max-w-sm">
                    Lo sentimos, la ruta que intentas acceder no existe o ha sido movida permanentemente.
                </p>

                <Button variant="outline" className="px-8 font-semibold h-11 rounded-md transition-all duration-200 active:scale-[0.98]" asChild>
                    <Link href="/">Volver al inicio</Link>
                </Button>
            </div>

            <p className="fixed bottom-6 left-0 right-0 text-center text-xs text-n-8/50">
                © 2026 ClinicBoard
            </p>
        </div>
    );
}