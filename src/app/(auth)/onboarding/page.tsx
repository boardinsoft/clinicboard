'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ShieldAlert, CircleAlert } from 'lucide-react';
import { OnboardingFeed, type OnboardingStepData } from '@/components/onboarding';
import { createClinicAsAdmin, getOnboardingStatus } from '@/actions/onboarding';
import { createClient } from '@/lib/supabase/client';
import { loadOnboardingState, clearOnboardingState } from '@/lib/schemas/onboarding';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type OnboardingPageState = 'loading' | 'auth_error' | 'clinic_limit_reached' | 'already_completed' | 'ready' | 'incomplete_reason';

export default function OnboardingPage() {
    const router = useRouter();
    const [pageState, setPageState] = React.useState<OnboardingPageState>('loading');
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [userId, setUserId] = React.useState<string | null>(null);
    const [savedState, setSavedState] = React.useState<Partial<OnboardingStepData> | null>(null);

    React.useEffect(() => {
        async function checkAuthAndStatus() {
            try {
                const searchParams = new URLSearchParams(window.location.search);
                const reason = searchParams.get('reason');
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setErrorMessage('Debes iniciar sesión para continuar.');
                    setPageState('auth_error');
                    return;
                }

                if (!user.email_confirmed_at) {
                    setErrorMessage('Confirma tu correo electrónico antes de continuar.');
                    setPageState('auth_error');
                    return;
                }

                setUserId(user.id);

                const status = await getOnboardingStatus(user.id);

                if (status.error) {
                    setErrorMessage(status.error);
                    setPageState('auth_error');
                    return;
                }

                if (status.onboardingCompleted) {
                    router.replace('/dashboard');
                    return;
                }

                const clinicCount = status.clinicCount ?? 0;

                if (reason === 'incomplete') {
                    setPageState('incomplete_reason');
                    return;
                }

                if (clinicCount >= 2) {
                    setErrorMessage('Has alcanzado el límite máximo de 2 consultorios. Contacta a soporte si necesitas más.');
                    setPageState('clinic_limit_reached');
                    return;
                }

                if (clinicCount === 1) {
                    setErrorMessage('Ya tienes un consultorio. Ve al Tablero para gestionarlo.');
                    setPageState('clinic_limit_reached');
                    return;
                }

                const onboardingState = loadOnboardingState(user.id);
                if (onboardingState) {
                    setSavedState({
                        profile: onboardingState.profile || null,
                        clinic: onboardingState.clinic || null,
                        location: onboardingState.location || null,
                    });
                }

                setPageState('ready');
            } catch (err) {
                console.error('Auth check error:', err);
                setErrorMessage('Error al verificar sesión. Intenta de nuevo.');
                setPageState('auth_error');
            }
        }
        checkAuthAndStatus();
    }, [router]);

    const handleComplete = async (data: OnboardingStepData) => {
        if (!data.profile || !data.clinic || !data.userId) {
            throw new Error('Falta información. Completa todos los pasos.');
        }

        const result = await createClinicAsAdmin({
            userId: data.userId,
            profile: data.profile,
            clinic: data.clinic,
            location: data.location || undefined,
        });

        if (result.error) {
            if (result.error.includes('Sesión') || result.error.includes('límite')) {
                router.refresh();
            }
            throw new Error(result.error);
        }

        if (data.userId) {
            clearOnboardingState(data.userId);
        }
        const clinicSlug = data.clinic.slug.toLowerCase();
        router.push(`/${clinicSlug}/dashboard`);
    };

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (pageState === 'loading') {
        return (
            <div className="min-h-svh bg-n-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 text-b-8 animate-spin" />
                    <p className="text-sm text-n-8">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    if (pageState === 'auth_error') {
        return (
            <div className="min-h-svh bg-n-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-background rounded-lg border border-n-5 p-6">
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-xs font-bold tracking-wider">No se pudo continuar</AlertTitle>
                        <AlertDescription className="text-sm opacity-90">{errorMessage}</AlertDescription>
                    </Alert>
                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={() => router.push('/dashboard')}
                            variant="default"
                            className="w-full"
                        >
                            Ir al Tablero
                        </Button>
                        <p className="text-xs text-n-8 text-center">
                            ¿No tienes consultorio?{' '}
                            <button
                                onClick={handleSignOut}
                                className="text-b-8 underline-offset-4 hover:underline font-medium"
                            >
                                Cerrar sesión
                            </button>
                            {' '}e intenta de nuevo.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (pageState === 'clinic_limit_reached') {
        return (
            <div className="min-h-svh bg-n-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-background rounded-lg border border-n-5 p-6">
                    <div className="flex flex-col items-center text-center mb-4">
                        <div className="w-12 h-12 bg-n-3 rounded-full flex items-center justify-center mb-3">
                            <ShieldAlert className="h-6 w-6 text-n-8" />
                        </div>
                        <h1 className="text-lg font-semibold text-foreground">Límite de consultorios alcanzado</h1>
                        <p className="text-sm text-n-8 mt-1">
                            {errorMessage || 'Has alcanzado el máximo de 2 consultorios permitidos por cuenta.'}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={() => router.push('/dashboard')}
                            variant="default"
                            className="w-full"
                        >
                            Ir al Tablero
                        </Button>
                        <p className="text-xs text-n-8 text-center">
                            ¿Necesitas más consultorios?{' '}
                            <button
                                onClick={handleSignOut}
                                className="text-b-8 underline-offset-4 hover:underline font-medium"
                            >
                                Cambiar cuenta
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (pageState === 'incomplete_reason') {
        return (
            <div className="min-h-svh bg-n-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-6">
                    <Alert variant="warning" className="bg-warning/5 border-warning/20 p-4">
                        <CircleAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                        <div className="flex flex-1 flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <AlertTitle className="text-sm font-semibold text-foreground">
                                    Configuración incompleta
                                </AlertTitle>
                                <AlertDescription className="text-xs text-n-8 leading-relaxed">
                                    Completa los pasos para continuar.
                                </AlertDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() => setPageState('ready')}
                                    variant="default"
                                    className="h-8 text-xs px-3"
                                >
                                    Completar configuración
                                </Button>
                                <button
                                    onClick={handleSignOut}
                                    className="text-xs text-n-8 hover:text-b-8 font-medium transition-colors"
                                >
                                    Cerrar sesión
                                </button>
                            </div>
                        </div>
                    </Alert>
                </Card>
            </div>
        );
    }

    return (
        <OnboardingFeed
            userId={userId}
            initialData={savedState || undefined}
            onComplete={handleComplete}
        />
    );
}
