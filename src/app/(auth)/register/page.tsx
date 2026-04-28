'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, MailIcon, LockIcon, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { registerUser } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator';

const passwordSchema = z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Al menos una mayúscula')
    .regex(/[a-z]/, 'Al menos una minúscula')
    .regex(/[0-9]/, 'Al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Al menos un carácter especial');

const registerSchema = z.object({
    email: z.string().email('Por favor ingresa un correo electrónico válido'),
    password: passwordSchema,
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
    const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    React.useEffect(() => {
        const subscription = form.watch((_, { name }) => {
            if (name === 'email') {
                form.setValue('password', '', { shouldValidate: false });
                form.setValue('confirmPassword', '', { shouldValidate: false });
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    async function onSubmit(values: RegisterFormValues) {
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        const result = await registerUser(values.email, values.password);

        if (result?.error) {
            setErrorMsg(result.error);
            setLoading(false);
            return;
        }

        if (result?.success) {
            setSuccessMsg(result.message || 'Revisa tu correo para confirmar tu cuenta');
            form.reset();
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-svh font-sans">
            {/* LEFT PANEL */}
            <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative p-12 bg-gradient-to-br from-brand-7 to-brand-10">
                <Image
                    src="/brand/logo-full-dark.svg"
                    alt="ClinicBoard"
                    width={180}
                    height={48}
                    priority
                />
                <p className="absolute bottom-10 left-12 text-sm text-white/80">
                    El expediente que acompaña tu consulta.
                </p>
            </div>

            {/* RIGHT PANEL */}
            <div className="flex flex-1 lg:w-1/2 flex-col items-center justify-center bg-background p-8">
                <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Logo + Heading */}
                    <div className="flex flex-col items-center gap-2 mb-8">
                        <Image
                            src="/brand/logo-mark.svg"
                            alt="ClinicBoard mark"
                            width={40}
                            height={40}
                            priority
                        />
                        <h1 className="text-2xl font-bold tracking-tight">
                            Crea tu cuenta
                        </h1>
                        <p className="text-sm text-muted-foreground text-center">
                            Registra tu clínica y comienza a gestionar<br />tu consultorio médico
                        </p>
                    </div>

                    {/* Success Message */}
                    {successMsg && (
                        <Alert className="bg-success/5 border-success/20 text-success animate-in fade-in slide-in-from-top-1">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle className="text-xs font-bold tracking-wider">CUENTA CREADA</AlertTitle>
                            <AlertDescription className="text-sm opacity-90">
                                {successMsg}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Error Message */}
                    {errorMsg && (
                        <Alert
                            variant="destructive"
                            className="bg-destructive/5 border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-1"
                        >
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="text-xs font-bold tracking-wider">ERROR</AlertTitle>
                            <AlertDescription className="text-sm opacity-90">
                                {errorMsg}
                            </AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                        {/* Email Field */}
                        <Field className="space-y-2">
                            <FieldLabel
                                htmlFor="email"
                                className="text-xs font-semibold tracking-wider text-neutral-8 uppercase"
                            >
                                Correo electrónico
                            </FieldLabel>
                            <InputGroup>
                                <Input
                                    {...form.register('email')}
                                    id="email"
                                    type="email"
                                    placeholder="tu@correo.com"
                                    autoComplete="email"
                                    className="flex-1"
                                />
                            </InputGroup>
                            {form.formState.errors.email && (
                                <FieldError className="text-[11px] font-medium text-destructive">
                                    {form.formState.errors.email.message}
                                </FieldError>
                            )}
                        </Field>

                        {/* Password Field */}
                        <Field className="space-y-2">
                            <FieldLabel
                                htmlFor="password"
                                className="text-xs font-semibold tracking-wider text-neutral-8 uppercase"
                            >
                                Contraseña
                            </FieldLabel>
                            <InputGroup>
                                <Input
                                    {...form.register('password')}
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Mínimo 8 caracteres"
                                    autoComplete="new-password"
                                    className="flex-1"
                                />
                                <InputGroupAddon align="inline-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="px-3 text-neutral-8 hover:text-foreground transition-colors"
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </InputGroupAddon>
                            </InputGroup>
                            {form.formState.errors.password && (
                                <FieldError className="text-[11px] font-medium text-destructive">
                                    {form.formState.errors.password.message}
                                </FieldError>
                            )}
                            <PasswordStrengthIndicator
                                password={form.watch('password') || ''}
                                className="mt-3"
                            />
                        </Field>

                        {/* Confirm Password Field */}
                        <Field className="space-y-2">
                            <FieldLabel
                                htmlFor="confirmPassword"
                                className="text-xs font-semibold tracking-wider text-neutral-8 uppercase"
                            >
                                Confirmar contraseña
                            </FieldLabel>
                            <InputGroup>
                                <Input
                                    {...form.register('confirmPassword')}
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Repite la contraseña"
                                    autoComplete="new-password"
                                    className="flex-1"
                                />
                                <InputGroupAddon align="inline-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        className="px-3 text-neutral-8 hover:text-foreground transition-colors"
                                        aria-label={showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                                    >
                                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </InputGroupAddon>
                            </InputGroup>
                            {form.formState.errors.confirmPassword && (
                                <FieldError className="text-[11px] font-medium text-destructive">
                                    {form.formState.errors.confirmPassword.message}
                                </FieldError>
                            )}
                        </Field>

                        <Button
                            type="submit"
                            className="w-full bg-b-8 hover:bg-b-9 text-white font-semibold transition-all duration-300 active:scale-[0.98] h-11"
                            disabled={loading || !form.formState.isValid}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Creando cuenta...
                                </>
                            ) : (
                                'Crear cuenta'
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        ¿Ya tienes cuenta?{' '}
                        <Link
                            href="/login"
                            className="text-b-8 underline-offset-4 hover:underline font-medium"
                        >
                            Inicia sesión
                        </Link>
                    </p>

                    <p className="text-center text-xs text-muted-foreground/40 pt-4">
                        © 2026 ClinicBoard
                    </p>
                </div>
            </div>
        </div>
    );
}