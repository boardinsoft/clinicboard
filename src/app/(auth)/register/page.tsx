"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { registerUser } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AlertCircle, Clock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"

const passwordSchema = z
    .string()
    .min(1, "La contraseña es requerida")
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Al menos una mayúscula")
    .regex(/[a-z]/, "Al menos una minúscula")
    .regex(/[0-9]/, "Al menos un número")
    .regex(/[^A-Za-z0-9]/, "Al menos un carácter especial")

const registerSchema = z.object({
    username: z.string().min(3, "Mínimo 3 caracteres").max(20, "Máximo 20 caracteres"),
    email: z.string().email("Por favor ingresa un correo electrónico válido"),
    password: passwordSchema,
    confirmPassword: z.string(),
    privacyAccepted: z.boolean().refine((val) => val === true, {
        message: "Debes aceptar la política de privacidad",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

const emailErrorId = "email-error"
const passwordErrorId = "password-error"
const usernameErrorId = "username-error"

export default function RegisterPage() {
    const [loading, setLoading] = React.useState(false)
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
    const [errorType, setErrorType] = React.useState<string | null>(null)
    const [successMsg, setSuccessMsg] = React.useState<string | null>(null)
    const [showPassword, setShowPassword] = React.useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
    const [rememberMe, setRememberMe] = React.useState(false)

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            privacyAccepted: false,
        },
    })

    React.useEffect(() => {
        const subscription = form.watch((_, { name }) => {
            if (name === "email") {
                form.setValue("password", "", { shouldValidate: false })
                form.setValue("confirmPassword", "", { shouldValidate: false })
            }
        })
        return () => subscription.unsubscribe()
    }, [form])

    async function onSubmit(values: RegisterFormValues) {
        setLoading(true)
        setErrorMsg(null)
        setErrorType(null)
        setSuccessMsg(null)

        const result = await registerUser(values.email, values.password)

        if (result?.error) {
            setErrorMsg(result.error)
            setErrorType((result as any).errorType || null)
            setLoading(false)
            return
        }

        if (result?.success) {
            setSuccessMsg(result.message || "Revisa tu correo para confirmar tu cuenta")
            form.reset()
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="card-clinic p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col items-center gap-3 mb-8">
                        <Image
                            src="/brand/logo-mark.svg"
                            alt="ClinicBoard"
                            width={48}
                            height={48}
                            className="text-b-8"
                        />
                        <h1 className="text-2xl font-bold tracking-tight text-n-11">
                            Crea tu cuenta
                        </h1>
                        <p className="text-sm text-n-8 text-center">
                            Registra tu clínica y conecta con la comunidad médica
                        </p>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        {errorMsg && (
                            <Alert
                                variant="destructive"
                                className="bg-destructive/5 border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-1"
                            >
                                {errorType === "rate_limit" ? (
                                    <Clock className="h-4 w-4" />
                                ) : (
                                    <AlertCircle className="h-4 w-4" />
                                )}
                                <AlertTitle className="text-xs font-bold tracking-wider uppercase">
                                    {errorType === "rate_limit" ? "Demasiados intentos" : "Error de registro"}
                                </AlertTitle>
                                <AlertDescription className="text-sm opacity-90">
                                    {errorMsg}
                                </AlertDescription>
                            </Alert>
                        )}

                        {successMsg && (
                            <Alert className="bg-success/5 border-success/20 text-success animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="text-xs font-bold tracking-wider uppercase">
                                    Cuenta creada
                                </AlertTitle>
                                <AlertDescription className="text-sm opacity-90">
                                    {successMsg}
                                </AlertDescription>
                            </Alert>
                        )}

                        <Field className="gap-2">
                            <FieldLabel
                                htmlFor="username"
                                className="text-xs font-semibold tracking-wider text-n-8"
                            >
                                Nombre de usuario
                            </FieldLabel>
                            <Input
                                {...form.register("username")}
                                id="username"
                                type="text"
                                placeholder="dr.garcia_clinica"
                                autoComplete="username"
                                aria-describedby={form.formState.errors.username ? usernameErrorId : undefined}
                                className="h-11 rounded-md border-border bg-background"
                            />
                            {form.formState.errors.username && (
                                <FieldError id={usernameErrorId} className="text-[11px] font-medium text-destructive">
                                    {form.formState.errors.username.message}
                                </FieldError>
                            )}
                        </Field>

                        <Field className="gap-2">
                            <FieldLabel
                                htmlFor="email"
                                className="text-xs font-semibold tracking-wider text-n-8"
                            >
                                Correo electrónico
                            </FieldLabel>
                            <Input
                                {...form.register("email")}
                                id="email"
                                type="email"
                                placeholder="tu@correo.com"
                                autoComplete="email"
                                aria-describedby={form.formState.errors.email ? emailErrorId : undefined}
                                className="h-11 rounded-md border-border bg-background"
                            />
                            {form.formState.errors.email && (
                                <FieldError id={emailErrorId} className="text-[11px] font-medium text-destructive">
                                    {form.formState.errors.email.message}
                                </FieldError>
                            )}
                        </Field>

                        <Field className="gap-2">
                            <FieldLabel
                                htmlFor="password"
                                className="text-xs font-semibold tracking-wider text-n-8"
                            >
                                Contraseña
                            </FieldLabel>
                            <div className="relative">
                                <Input
                                    {...form.register("password")}
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mínimo 8 caracteres"
                                    autoComplete="new-password"
                                    aria-describedby={form.formState.errors.password ? passwordErrorId : undefined}
                                    className="h-11 rounded-md border-border bg-background pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 -translate-x-0.5 text-n-8 hover:text-b-8 transition-colors"
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {form.formState.errors.password && (
                                <FieldError id={passwordErrorId} className="text-[11px] font-medium text-destructive">
                                    {form.formState.errors.password.message}
                                </FieldError>
                            )}
                            <PasswordStrengthIndicator
                                password={form.watch("password") || ""}
                                className="mt-3"
                            />
                        </Field>

                        <Field className="gap-2">
                            <FieldLabel
                                htmlFor="confirmPassword"
                                className="text-xs font-semibold tracking-wider text-n-8"
                            >
                                Confirmar contraseña
                            </FieldLabel>
                            <div className="relative">
                                <Input
                                    {...form.register("confirmPassword")}
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Repite la contraseña"
                                    autoComplete="new-password"
                                    className="h-11 rounded-md border-border bg-background pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 -translate-x-0.5 text-n-8 hover:text-b-8 transition-colors"
                                    aria-label={showConfirmPassword ? "Ocultar" : "Mostrar"}
                                >
                                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {form.formState.errors.confirmPassword && (
                                <FieldError className="text-[11px] font-medium text-destructive">
                                    {form.formState.errors.confirmPassword.message}
                                </FieldError>
                            )}
                        </Field>

                        <div className="flex items-start gap-2.5 pt-1">
                            <Checkbox
                                id="privacy"
                                checked={form.watch("privacyAccepted")}
                                onCheckedChange={(val) => {
                                    form.setValue("privacyAccepted", !!val, { shouldValidate: true })
                                }}
                                className="mt-0.5"
                            />
                            <label
                                htmlFor="privacy"
                                className="text-sm text-n-8 leading-relaxed cursor-pointer"
                            >
                                Acepto la{" "}
                                <Link
                                    href="#"
                                    className="text-b-8 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    política de privacidad
                                </Link>
                            </label>
                        </div>
                        {form.formState.errors.privacyAccepted && (
                            <FieldError className="text-[11px] font-medium text-destructive -mt-2">
                                {form.formState.errors.privacyAccepted.message}
                            </FieldError>
                        )}

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="remember"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked === true)}
                            />
                            <label
                                htmlFor="remember"
                                className="text-sm text-n-8 cursor-pointer"
                            >
                                Recuérdame
                            </label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-b-8 hover:bg-b-9 text-white font-semibold h-11 rounded-md transition-all duration-200 active:scale-[0.98]"
                            disabled={loading || !form.formState.isValid}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Creando cuenta...
                                </>
                            ) : (
                                "Crear cuenta"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-border">
                        <p className="text-center text-sm text-n-8">
                            ¿Ya tienes cuenta?{" "}
                            <Link
                                href="/login"
                                className="text-b-8 font-medium hover:underline"
                            >
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-n-8/50 mt-6">
                    © 2026 ClinicBoard
                </p>
            </div>
        </div>
    )
}