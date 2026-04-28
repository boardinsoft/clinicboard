'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, ArrowRight, Building2, MapPin, User, CheckCircle2, Mail, AlertCircle } from 'lucide-react';
import { createClinicAsAdmin, checkSlugAvailability } from '@/actions/onboarding';
import { OnboardingStepper, defaultOnboardingSteps } from '@/components/onboarding/OnboardingStepper';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { profileStepSchema, clinicStepSchema, locationStepSchema, generateSlug, saveOnboardingState, loadOnboardingState, clearOnboardingState, type ProfileStepData, type ClinicStepData, type LocationStepData } from '@/lib/schemas/onboarding';
import type { OnboardingState } from '@/lib/schemas/onboarding';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SPECIALTIES = [
    'Medicina General',
    'Medicina Interna',
    'Pediatría',
    'Cirugía General',
    'Ginecología y Obstetricia',
    'Cardiología',
    'Dermatología',
    'Neurología',
    'Ortopedia',
    'Oftalmología',
    'Otorrinolaringología',
    'Psiquiatría',
    'Endocrinología',
    'Gastroenterología',
    'Neumología',
    'Oncología',
    'Urología',
    'Nefrología',
    'Reumatología',
    'Medicina Familiar',
    'Administración de Clínicas',
    'Otra',
];

const GENDERS = [
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Femenino' },
    { value: 'other', label: 'Otro' },
    { value: 'unknown', label: 'Prefiero no decir' },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = React.useState(1);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);
    const [slugAvailable, setSlugAvailable] = React.useState<boolean | null>(null);
    const [authChecked, setAuthChecked] = React.useState(false);
    const [authError, setAuthError] = React.useState<string | null>(null);

    // Form data state
    const [profileData, setProfileData] = React.useState<ProfileStepData | null>(null);
    const [clinicData, setClinicData] = React.useState<ClinicStepData | null>(null);
    const [locationData, setLocationData] = React.useState<LocationStepData | null>(null);
    const [userId, setUserId] = React.useState<string | null>(null);

    // Check auth on mount
    React.useEffect(() => {
        async function checkAuth() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setAuthError('Debes iniciar sesión para continuar.');
                    setAuthChecked(true);
                    return;
                }

                if (!user.email_confirmed_at) {
                    setAuthError('Por favor, confirma tu correo electrónico antes de continuar.');
                    setAuthChecked(true);
                    return;
                }

                setUserId(user.id);
                setAuthChecked(true);
            } catch (err) {
                console.error('Auth check error:', err);
                setAuthError('Error al verificar sesión. Intenta de nuevo.');
                setAuthChecked(true);
            }
        }
        checkAuth();
    }, []);

    // Profile form
    const profileForm = useForm<ProfileStepData>({
        resolver: zodResolver(profileStepSchema),
        defaultValues: { name_given: [''], name_family: '', specialty: '', gender: undefined },
    });

    // Clinic form
    const clinicForm = useForm<ClinicStepData>({
        resolver: zodResolver(clinicStepSchema),
        defaultValues: { name: '', slug: '' },
    });

    // Location form
    const locationForm = useForm<LocationStepData>({
        resolver: zodResolver(locationStepSchema),
        defaultValues: { address: '', phone: '' },
    });

    // Load saved state on mount
    React.useEffect(() => {
        const savedState = loadOnboardingState('current');
        if (savedState) {
            setCurrentStep(savedState.currentStep || 1);
            setProfileData(savedState.profile || null);
            setClinicData(savedState.clinic || null);
            setLocationData(savedState.location || null);
            setUserId(savedState.userId || null);

            if (savedState.profile) {
                profileForm.reset(savedState.profile);
            }
            if (savedState.clinic) {
                clinicForm.reset(savedState.clinic);
            }
            if (savedState.location) {
                locationForm.reset(savedState.location);
            }
        }
    }, []);

    // Auto-generate slug when clinic name changes
    const handleClinicNameChange = (name: string) => {
        if (!slugManuallyEdited) {
            const slug = generateSlug(name);
            clinicForm.setValue('slug', slug);
            setSlugAvailable(null);
        }
    };

    // Check slug availability
    const handleSlugChange = async (slug: string) => {
        setSlugManuallyEdited(true);
        if (slug.length >= 3) {
            const result = await checkSlugAvailability(slug);
            setSlugAvailable(result.available);
        } else {
            setSlugAvailable(null);
        }
    };

    // Save state to localStorage
    const saveState = (step: 1 | 2 | 3 | 4) => {
        const state: OnboardingState = {
            userId: userId || 'temp',
            currentStep: step,
            startedAt: new Date().toISOString(),
            profile: profileData || undefined,
            clinic: clinicData || undefined,
            location: locationData || undefined,
        };
        saveOnboardingState(state);
    };

    // Step 1: Profile validation
    const handleProfileNext = async () => {
        const isValid = await profileForm.trigger();
        if (!isValid) return;

        const data = profileForm.getValues();
        setProfileData(data);
        setCurrentStep(2);
        saveState(2);
    };

    // Step 2: Clinic validation
    const handleClinicNext = async () => {
        const isValid = await clinicForm.trigger();
        if (!isValid) return;

        if (slugAvailable === false) {
            setError('Este nombre de clínica ya está en uso. Por favor, elige otro nombre.');
            return;
        }

        const data = clinicForm.getValues();
        setClinicData(data);
        setCurrentStep(3);
        saveState(3);
    };

    // Step 3: Location (optional)
    const handleLocationNext = async () => {
        const data = locationForm.getValues();
        setLocationData(data);
        setCurrentStep(4);
        saveState(4);
    };

    // Step 4: Complete onboarding
    const handleComplete = async () => {
        if (!profileData || !clinicData) {
            setError('Falta información. Por favor, completa todos los pasos.');
            return;
        }

        setIsLoading(true);
        setError(null);

        const result = await createClinicAsAdmin({
            userId: userId || '',
            profile: profileData,
            clinic: clinicData,
            location: locationData || undefined,
        });

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
            return;
        }

        clearOnboardingState('current');
        router.push('/dashboard');
    };

    // Navigate back
    const handleBack = () => {
        if (currentStep > 1) {
            const newStep = (currentStep - 1) as 1 | 2 | 3 | 4;
            setCurrentStep(newStep);
            saveState(newStep);
        }
    };

    // Render step content
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-6">
                            <h2 className="text-[18px] font-bold text-foreground">Cuéntanos sobre ti</h2>
                            <p className="text-sm text-n-8 mt-1">Este será tu perfil profesional en ClinicBoard</p>
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-3">
                            <Field>
                                <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Nombres</FieldLabel>
                                <Input
                                    {...profileForm.register('name_given.0')}
                                    placeholder="Juan Carlos"
                                    className="mt-1"
                                />
                                {profileForm.formState.errors.name_given && (
                                    <FieldError className="text-[11px]">Ingresa al menos un nombre</FieldError>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Apellidos</FieldLabel>
                                <Input
                                    {...profileForm.register('name_family')}
                                    placeholder="Pérez Medina"
                                    className="mt-1"
                                />
                                {profileForm.formState.errors.name_family && (
                                    <FieldError className="text-[11px]">{profileForm.formState.errors.name_family.message}</FieldError>
                                )}
                            </Field>
                        </div>

                        {/* Specialty */}
                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Especialidad (opcional)</FieldLabel>
                            <select
                                {...profileForm.register('specialty')}
                                className="mt-1 w-full h-10 px-3 border border-n-5 rounded-md bg-background text-[13px] text-foreground focus:border-b-8 focus:ring-1 focus:ring-b-8/10 outline-none"
                            >
                                <option value="">Selecciona una especialidad</option>
                                {SPECIALTIES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </Field>

                        {/* Gender */}
                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Género (opcional)</FieldLabel>
                            <div className="flex gap-2 mt-1">
                                {GENDERS.map((g) => (
                                    <label
                                        key={g.value}
                                        className={cn(
                                            'flex-1 flex items-center justify-center h-10 px-3 border rounded-md cursor-pointer text-[13px] transition-colors',
                                            profileForm.watch('gender') === g.value
                                                ? 'border-b-8 bg-b-8/5 text-foreground'
                                                : 'border-n-5 hover:bg-n-2'
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            {...profileForm.register('gender')}
                                            value={g.value}
                                            className="sr-only"
                                        />
                                        {g.label}
                                    </label>
                                ))}
                            </div>
                        </Field>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-6">
                            <h2 className="text-[18px] font-bold text-foreground">Nombre tu clínica</h2>
                            <p className="text-sm text-n-8 mt-1">Elige un nombre único para identificar tu consultorio</p>
                        </div>

                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Nombre de la clínica</FieldLabel>
                            <Input
                                {...clinicForm.register('name')}
                                placeholder="ej. Clínica San Rafael"
                                className="mt-1"
                                onChange={(e) => handleClinicNameChange(e.target.value)}
                            />
                            {clinicForm.formState.errors.name && (
                                <FieldError className="text-[11px]">{clinicForm.formState.errors.name.message}</FieldError>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">URL de tu clínica</FieldLabel>
                            <div className="mt-1 flex items-center">
                                <span className="text-[13px] text-n-8 bg-n-2 px-3 h-10 flex items-center border border-r-0 border-n-5 rounded-l-md">
                                    clinicboard.app/
                                </span>
                                <Input
                                    {...clinicForm.register('slug')}
                                    placeholder="mi-clinica"
                                    className="flex-1 rounded-l-none border-l-0"
                                    onChange={(e) => {
                                        clinicForm.setValue('slug', e.target.value.toLowerCase());
                                        handleSlugChange(e.target.value.toLowerCase());
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                {slugAvailable === true && (
                                    <span className="text-[11px] text-success flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Disponible
                                    </span>
                                )}
                                {slugAvailable === false && (
                                    <span className="text-[11px] text-destructive flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> No disponible
                                    </span>
                                )}
                            </div>
                            {clinicForm.formState.errors.slug && (
                                <FieldError className="text-[11px]">{clinicForm.formState.errors.slug.message}</FieldError>
                            )}
                        </Field>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-6">
                            <h2 className="text-[18px] font-bold text-foreground">Ubicación de tu clínica</h2>
                            <p className="text-sm text-n-8 mt-1">Ayuda a tus pacientes a encontrarte (opcional)</p>
                        </div>

                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Dirección</FieldLabel>
                            <Input
                                {...locationForm.register('address')}
                                placeholder="Av. Ejemplo #123, Ciudad"
                                className="mt-1"
                            />
                        </Field>

                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Teléfono de contacto</FieldLabel>
                            <Input
                                {...locationForm.register('phone')}
                                placeholder="+1 809-555-0101"
                                className="mt-1"
                            />
                        </Field>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-b-8/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-b-8" />
                            </div>
                            <h2 className="text-[18px] font-bold text-foreground">¡Todo listo!</h2>
                            <p className="text-sm text-n-8 mt-1">
                                Tu clínica <strong className="text-foreground">{clinicData?.name}</strong> está configurada
                            </p>
                        </div>

                        <div className="bg-n-2 rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <User className="w-4 h-4 text-n-8 mt-0.5" />
                                <div>
                                    <p className="text-[13px] font-medium">{profileData?.name_given?.[0]} {profileData?.name_family}</p>
                                    <p className="text-[11px] text-n-8">{profileData?.specialty || 'Sin especialidad'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Building2 className="w-4 h-4 text-n-8 mt-0.5" />
                                <div>
                                    <p className="text-[13px] font-medium">{clinicData?.name}</p>
                                    <p className="text-[11px] text-n-8">clinicboard.app/{clinicData?.slug}</p>
                                </div>
                            </div>
                            {locationData?.address && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-n-8 mt-0.5" />
                                    <div>
                                        <p className="text-[13px] font-medium">{locationData.address}</p>
                                        {locationData.phone && (
                                            <p className="text-[11px] text-n-8">{locationData.phone}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-b-8/5 border border-b-8/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-b-8">
                                <Mail className="w-4 h-4" />
                                <span className="text-[13px] font-medium">Invita a tu equipo</span>
                            </div>
                            <p className="text-[12px] text-n-8 mt-1">
                                Después de entrar, puedes invitar doctores y recepcionistas a tu clínica.
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-svh bg-n-1 flex items-center justify-center p-4">
            {!authChecked ? (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 text-b-8 animate-spin" />
                    <p className="text-sm text-n-8">Verificando sesión...</p>
                </div>
            ) : authError ? (
                <div className="w-full max-w-md bg-background rounded-lg border shadow-xl p-6">
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-xs font-bold tracking-wider">ERROR</AlertTitle>
                        <AlertDescription className="text-sm opacity-90">{authError}</AlertDescription>
                    </Alert>
                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="w-full bg-b-8 hover:bg-b-9 text-white"
                        >
                            Ir al Dashboard
                        </Button>
                        <p className="text-xs text-n-8 text-center">
                            ¿No tienes clínica?{' '}
                            <button
                                onClick={() => {
                                    const form = document.createElement('form');
                                    form.method = 'POST';
                                    form.action = '/api/auth/signout';
                                    document.body.appendChild(form);
                                    form.submit();
                                }}
                                className="text-b-8 underline-offset-4 hover:underline font-medium"
                            >
                                Cerrar sesión
                            </button>
                            {' '}e intenta de nuevo.
                        </p>
                    </div>
                </div>
            ) : (
            <div className="w-full max-w-md bg-background rounded-lg border shadow-xl">
                {/* Header with stepper */}
                <div className="p-6 border-b">
                    <OnboardingStepper
                        steps={defaultOnboardingSteps}
                        currentStep={currentStep}
                        className="mb-6"
                    />
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-destructive/5 border border-destructive/20 rounded-md text-[13px] text-destructive">
                            {error}
                        </div>
                    )}

                    {renderStep()}
                </div>

                {/* Footer with actions */}
                <div className="p-6 border-t bg-n-2/50 rounded-b-lg">
                    <div className="flex items-center gap-3">
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Atrás
                            </Button>
                        )}

                        {currentStep < 4 ? (
                            <Button
                                type="button"
                                onClick={currentStep === 1 ? handleProfileNext : currentStep === 2 ? handleClinicNext : handleLocationNext}
                                className="flex-1 flex items-center justify-center gap-2 bg-b-8 hover:bg-b-9 text-white"
                            >
                                Continuar
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleComplete}
                                disabled={isLoading}
                                className="flex-1 flex items-center justify-center gap-2 bg-b-8 hover:bg-b-9 text-white"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Configurando...
                                    </>
                                ) : (
                                    <>
                                        Ir al Tablero Clínico
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}