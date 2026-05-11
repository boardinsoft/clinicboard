'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { resendConfirmationEmail } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Clock, Mail, Loader2, ArrowLeft } from 'lucide-react';

function EmailContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') ?? '';

    const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
    const [errorType, setErrorType] = React.useState<string | null>(null);
    const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

    async function handleResend() {
        if (!email) {
            setErrorMsg('No tenemos el correo. Solicita otro enlace.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMsg(null);
        setErrorType(null);
        setSuccessMsg(null);

        const result = await resendConfirmationEmail(email);

        if (result?.error) {
            setErrorMsg(result.error);
            setErrorType('errorType' in result && result.errorType ? result.errorType : null);
            setStatus('error');
        } else {
            setStatus('success');
            setSuccessMsg('Se reenvió el enlace de confirmación. Revisa tu bandeja de entrada.');
        }
    }

    return (
        <>
            <div className="flex flex-col items-center gap-4 mb-8">
                <Image
                    src="/brand/logo-mark.svg"
                    alt="ClinicBoard"
                    width={48}
                    height={48}
                    className="text-b-8"
                />
                <div className="w-14 h-14 rounded-[8px] bg-b-8/10 flex items-center justify-center">
                    <Mail className="w-7 h-7 text-b-8" />
                </div>
                <div className="text-center">
                    <h1 className="text-xl font-semibold text-n-12 tracking-tight">
                        Verifica tu correo electrónico
                    </h1>
                    <p className="text-sm text-n-8 mt-2 leading-relaxed">
                        Se envió un enlace de activación a tu correo electrónico.{' '}
                        {email ? (
                            <span className="font-medium text-n-12">{email}</span>
                        ) : (
                            'Por favor, revisa tu bandeja de entrada.'
                        )}
                    </p>
                    <p className="text-sm text-n-8 mt-2">
                        Haz clic en el enlace para activar tu cuenta y continuar con el registro de tu consultorio.
                    </p>
                </div>
            </div>

            {status === 'error' && errorMsg && (
                <Alert
                    variant="destructive"
                    className="mb-4 bg-destructive/5 border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-1"
                >
                    {errorType === 'rate_limit' ? (
                        <Clock className="h-4 w-4" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle className="text-xs font-bold tracking-wider uppercase">
                        {errorType === 'rate_limit' ? 'Reenvío bloqueado' : 'No se pudo reenviar'}
                    </AlertTitle>
                    <AlertDescription className="text-sm opacity-90">
                        {errorMsg}
                    </AlertDescription>
                </Alert>
            )}

            {status === 'success' && successMsg && (
                <Alert className="mb-4 bg-b-8/10 border-b-8/20 text-b-8 animate-in fade-in slide-in-from-top-1">
                    <Mail className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                        {successMsg}
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-3">
                <Button
                    type="button"
                    variant="default"
                    onClick={handleResend}
                    disabled={status === 'loading' || !email}
                    className="w-full bg-b-8 hover:bg-b-9 text-white font-semibold h-11 rounded-md transition-all duration-200 active:scale-[0.98]"
                >
                    {status === 'loading' ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Reenviando enlace...
                        </>
                    ) : (
                        'Reenviar enlace de confirmación'
                    )}
                </Button>

                <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-md border border-n-5 text-n-8 hover:text-n-12 hover:bg-n-2 transition-all duration-200"
                >
                    <ArrowLeft className="size-4" />
                    Volver al inicio de sesión
                </Link>
            </div>
        </>
    );
}

function LoadingContent() {
    return (
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-7 h-7 animate-spin text-b-8" />
            <p className="text-sm text-n-8">Cargando...</p>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="flex min-h-svh items-center justify-center bg-n-1 p-4">
            <div className="w-full max-w-md">
                <div className="card-clinic p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Suspense fallback={<LoadingContent />}>
                        <EmailContent />
                    </Suspense>
                </div>

                <p className="text-center text-xs text-n-8/50 mt-6">
                    © 2026 ClinicBoard
                </p>
            </div>
        </div>
    );
}
