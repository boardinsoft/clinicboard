"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { signInWithEmail } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AlertCircle, Clock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().email("Por favor ingresa un correo electrónico válido."),
  password: z.string().min(1, "La contraseña es requerida."),
})

type LoginFormValues = z.infer<typeof loginSchema>

const emailErrorId = "email-error"
const passwordErrorId = "password-error"

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [errorType, setErrorType] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  React.useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (name === 'email') {
        form.setValue('password', '', { shouldValidate: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(values: LoginFormValues) {
    setLoading(true)
    setErrorMsg(null)
    setErrorType(null)

    const formData = new FormData()
    formData.append("email", values.email)
    formData.append("password", values.password)

    const result = await signInWithEmail(formData)

    if (result?.error) {
      setErrorMsg(result.error)
      setErrorType((result as any).errorType || null)
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
              Iniciar sesión
            </h1>
            <p className="text-sm text-n-8 text-center">
              Ingresa tus credenciales para acceder al sistema
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
                  {errorType === "rate_limit" ? "Demasiados intentos" : "Acceso denegado"}
                </AlertTitle>
                <AlertDescription className="text-sm opacity-90">
                  {errorMsg}
                </AlertDescription>
              </Alert>
            )}

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
                  placeholder="••••••••"
                  autoComplete="current-password"
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
            </Field>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-n-8 cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Recuérdame
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-b-8 hover:text-b-9 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-b-8 hover:bg-b-9 text-white font-semibold h-11 rounded-md transition-all duration-200 active:scale-[0.98]"
              disabled={loading || !form.formState.isValid}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-sm text-n-8">
              ¿No tienes cuenta?{' '}
              <Link
                href="/register"
                className="text-b-8 font-medium hover:underline"
              >
                Crea tu clínica
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
