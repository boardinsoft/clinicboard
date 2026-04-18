"use client"

import * as React from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { signInWithEmail } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AlertCircle, Clock, Eye, EyeOff, Loader2, LockIcon, MailIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().email("Por favor ingresa un correo electrónico válido."),
  password: z.string().min(1, "La contraseña es requerida."),
})

type LoginFormValues = z.infer<typeof loginSchema>

const emailErrorId = "email-error"
const passwordErrorId = "password-error"

import Link from 'next/link';

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [errorType, setErrorType] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

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
    <div className="flex min-h-svh font-sans">
      {/* LEFT PANEL — visible solo en desktop */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative p-12 bg-gradient-to-br from-brand-7 to-brand-10"
      >
        {/* TODO: reemplazar con <Image fill className="object-cover"> + overlay bg-black/40 cuando llegue la foto */}
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
          {/* Logo mark + heading */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <Image
              src="/brand/logo-mark.svg"
              alt="ClinicBoard mark"
              width={40}
              height={40}
              priority
            />
            <h1 className="text-2xl font-bold tracking-tight">
              Bienvenido de vuelta
            </h1>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
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
                <AlertTitle className="text-xs font-bold tracking-wider">
                  {errorType === "rate_limit" ? "Demasiados intentos" : "Acceso denegado"}
                </AlertTitle>
                <AlertDescription className="text-sm opacity-90">
                  {errorMsg}
                </AlertDescription>
              </Alert>
            )}

            <Field className="space-y-2">
              <FieldLabel
                htmlFor="email"
                className="text-xs font-semibold tracking-wider text-muted-foreground/80"
              >
                Correo electrónico
              </FieldLabel>
              <InputGroup
                className={cn(
                  "bg-muted/30 border-border/20 focus-within:border-primary/50 transition-colors",
                  form.formState.errors.email && "border-destructive/50"
                )}
              >
                <InputGroupAddon>
                  <InputGroupText>
                    <MailIcon className="size-4 text-muted-foreground/50" />
                  </InputGroupText>
                </InputGroupAddon>
                <Input
                  {...form.register("email")}
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  aria-describedby={form.formState.errors.email ? emailErrorId : undefined}
                  className="flex-1 rounded-none border-0 bg-transparent shadow-none"
                />
              </InputGroup>
              {form.formState.errors.email && (
                <FieldError id={emailErrorId} className="text-[11px] font-medium text-destructive">
                  {form.formState.errors.email.message}
                </FieldError>
              )}
            </Field>

            <Field className="space-y-2">
              <FieldLabel
                htmlFor="password"
                className="text-xs font-semibold tracking-wider text-muted-foreground/80"
              >
                Contraseña
              </FieldLabel>
              <InputGroup
                className={cn(
                  "bg-muted/30 border-border/20 focus-within:border-primary/50 transition-colors",
                  form.formState.errors.password && "border-destructive/50"
                )}
              >
                <InputGroupAddon>
                  <InputGroupText>
                    <LockIcon className="size-4 text-muted-foreground/50" />
                  </InputGroupText>
                </InputGroupAddon>
                <Input
                  {...form.register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-describedby={form.formState.errors.password ? passwordErrorId : undefined}
                  className="flex-1 rounded-none border-0 bg-transparent shadow-none"
                />
                <InputGroupAddon>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="px-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </InputGroupAddon>
              </InputGroup>
              {form.formState.errors.password && (
                <FieldError id={passwordErrorId} className="text-[11px] font-medium text-destructive">
                  {form.formState.errors.password.message}
                </FieldError>
              )}
            </Field>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300 active:scale-[0.98] h-11"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Ingresar al Panel"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿No estás registrado?{" "}
            <Link
              href="/#contacto"
              className="text-primary underline-offset-4 hover:underline font-medium"
            >
              Contacta con ventas
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground/40 pt-4">
            © 2026 ClinicBoard
          </p>
        </div>
      </div>
    </div>
  )
}
