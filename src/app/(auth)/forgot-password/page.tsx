"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { forgotPassword } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AlertCircle, Clock, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const forgotPasswordSchema = z.object({
  email: z.string().email("Por favor ingresa un correo electrónico válido."),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

const emailErrorId = "email-error"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [errorType, setErrorType] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setLoading(true)
    setErrorMsg(null)
    setErrorType(null)

    const result = await forgotPassword(values.email)

    setLoading(false)

    if (result?.error) {
      setErrorMsg(result.error)
      setErrorType((result as { errorType?: string }).errorType || null)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
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
                Revisa tu correo
              </h1>
              <p className="text-sm text-n-8 text-center">
                Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-n-8">
                <Link
                  href="/login"
                  className="text-b-8 font-medium hover:underline"
                >
                  ← Volver a iniciar sesión
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
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-sm text-n-8 text-center">
              Ingresa tu correo para recibir el enlace de recuperación
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
                  {errorType === "rate_limit" ? "Demasiadas solicitudes" : "Error"}
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

            <Button
              type="submit"
              className="w-full bg-b-8 hover:bg-b-9 text-white font-semibold h-11 rounded-md transition-all duration-200 active:scale-[0.98]"
              disabled={loading || !form.formState.isValid}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar enlace de recuperación"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-sm text-n-8">
              ¿Recordaste tu contraseña?{' '}
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