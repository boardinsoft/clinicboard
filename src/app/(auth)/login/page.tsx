"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { signInWithEmail } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AlertCircle, Clock, LockIcon, MailIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group"

const loginSchema = z.object({
  email: z.string().email("Por favor ingresa un correo electrónico válido."),
  password: z.string().min(1, "La contraseña es requerida."),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [errorType, setErrorType] = React.useState<string | null>(null)

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
    <div className="flex items-center justify-center min-h-screen bg-background font-sans p-4">
      <Card className="w-full max-w-[400px] border-border/10 shadow-2xl bg-card/30 backdrop-blur-xl">
        <CardHeader className="space-y-1 pb-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-0.5 text-2xl font-bold tracking-tighter">
              <span className="text-foreground">clinic</span>
              <span className="text-primary font-light italic">board</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Bienvenido
          </CardTitle>
          <CardDescription className="text-muted-foreground/70">
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {errorMsg && (
              <Alert
                variant="destructive"
                className="bg-destructive/5 border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-1"
              >
                {errorType === 'rate_limit' ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="text-xs font-bold uppercase tracking-wider">
                  {errorType === 'rate_limit' ? 'Demasiados Intentos' : 'Acceso Denegado'}
                </AlertTitle>
                <AlertDescription className="text-sm opacity-90">
                  {errorMsg}
                </AlertDescription>
              </Alert>
            )}

            <Field className="space-y-2">
              <FieldLabel
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80"
              >
                Correo Electrónico
              </FieldLabel>
              <InputGroup className="bg-background/20 border-border/20 focus-within:border-primary/50 transition-colors">
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
                  className="flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
              </InputGroup>
              {form.formState.errors.email && (
                <FieldError className="text-[11px] font-medium text-destructive">
                  {form.formState.errors.email.message}
                </FieldError>
              )}
            </Field>

            <Field className="space-y-2">
              <FieldLabel
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80"
              >
                Contraseña
              </FieldLabel>
              <InputGroup className="bg-background/20 border-border/20 focus-within:border-primary/50 transition-colors">
                <InputGroupAddon>
                  <InputGroupText>
                    <LockIcon className="size-4 text-muted-foreground/50" />
                  </InputGroupText>
                </InputGroupAddon>
                <Input
                  {...form.register("password")}
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
              </InputGroup>
              {form.formState.errors.password && (
                <FieldError className="text-[11px] font-medium text-destructive">
                  {form.formState.errors.password.message}
                </FieldError>
              )}
            </Field>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300 active:scale-[0.98] h-11"
              disabled={loading}
            >
              {loading ? "Cargando..." : "Ingresar al Panel"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

