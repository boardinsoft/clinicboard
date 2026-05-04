"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { UserIcon, PhoneIcon, MailIcon, MapPinIcon, CalendarIcon, IdCard, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Field, FieldError, FieldLabel, FieldGroup } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput, InputGroupTextarea } from "@/components/ui/input-group"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

const patientSchema = z.object({
    givenNames: z.string().min(1, "Los nombres son requeridos"),
    familyName: z.string().min(1, "Los apellidos son requeridos"),
    gender: z.enum(["female", "male", "other", "unknown"]),
    birthDate: z.string().optional(),
    documentId: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Correo electrónico inválido").or(z.literal("")),
    address: z.string().optional(),
})

export type PatientFormValues = z.infer<typeof patientSchema>

interface PatientFormProps {
    defaultValues?: Partial<PatientFormValues>
    onSubmit: (values: PatientFormValues) => Promise<void>
    isLoading?: boolean
    mode: "create" | "edit"
    patientId?: string
    patientName?: string
}

export function PatientForm({
    defaultValues,
    onSubmit,
    isLoading = false,
    mode,
    patientId,
    patientName,
}: PatientFormProps) {
    const router = useRouter()
    const { resolvedTheme } = useTheme()
    const [showCancelConfirm, setShowCancelConfirm] = React.useState(false)

    const form = useForm<PatientFormValues>({
        resolver: zodResolver(patientSchema),
        defaultValues: {
            givenNames: "",
            familyName: "",
            gender: "unknown",
            birthDate: "",
            documentId: "",
            phone: "",
            email: "",
            address: "",
            ...defaultValues,
        },
    })

    const handleSubmit = async (values: PatientFormValues) => {
        try {
            await onSubmit(values)
        } catch (error: unknown) {
            console.error("Error submitting patient form:", error)
            const message = error instanceof Error ? error.message : "Ocurrió un error inesperado."
            toast.error("Error", { description: message })
        }
    }

    const getBreadcrumbs = () => {
        const crumbs: { label: string; href?: string }[] = [
            { label: "Pacientes", href: "/patients" }
        ]
        if (mode === "edit" && patientName) {
            crumbs.push({ label: patientName, href: `/patients/${patientId}` })
            crumbs.push({ label: "Edición" })
        } else {
            crumbs.push({ label: mode === "create" ? "Nuevo registro" : "Edición" })
        }
        return crumbs
    }

    const breadcrumbs = getBreadcrumbs()

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col space-y-2 mb-4">
                <nav className="flex items-center space-x-2 text-xs text-muted-foreground/60 mb-4">
                    <button
                        onClick={() => router.push("/patients")}
                        className="hover:text-primary transition-colors"
                    >
                        Pacientes
                    </button>
                    <ChevronRight className="size-3 opacity-40" />
                    {mode === "edit" && patientName ? (
                        <>
                            <button
                                onClick={() => router.push(`/patients/${patientId}`)}
                                className="hover:text-primary transition-colors max-w-[150px] truncate"
                            >
                                {patientName}
                            </button>
                            <ChevronRight className="size-3 opacity-40" />
                        </>
                    ) : null}
                    <span className="text-foreground/80">
                        {mode === "create" ? "Nuevo registro" : "Edición"}
                    </span>
                </nav>
                <h1 className="text-4xl font-bold tracking-tighter text-foreground flex items-center gap-3">
                    <UserIcon className="size-8 text-primary" />
                    {mode === "create" ? "Alta de Paciente" : "Editar Paciente"}
                </h1>
                <p className="text-muted-foreground text-sm max-w-xl">
                    {mode === "create"
                        ? "Registro centralizado bajo estándar FHIR R4. Complete la información demográfica del paciente."
                        : "Actualización de registros demográficos bajo normativa HL7 FHIR."}
                </p>
            </div>

            <Card className="border-border/10 shadow-none bg-card/20 backdrop-blur-md overflow-hidden">
                <CardHeader className="border-b border-border/5 bg-muted/5 pb-8">
                    <CardTitle className="text-lg font-semibold tracking-tight">Datos demográficos</CardTitle>
                    <CardDescription className="text-sm">
                        {mode === "create"
                            ? "Los campos con asterisco (*) son obligatorios."
                            : "Actualice los campos necesarios."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-10">
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-10">
                        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <Field>
                                <FieldLabel htmlFor="givenNames" className="text-xs font-medium text-muted-foreground mb-2">
                                    Nombres <span className="text-primary">*</span>
                                </FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText>
                                            <UserIcon className="size-4" />
                                        </InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        {...form.register("givenNames")}
                                        id="givenNames"
                                        placeholder="Ej: María, Carmen"
                                    />
                                </InputGroup>
                                {form.formState.errors.givenNames && (
                                    <FieldError className="text-xs mt-1">{form.formState.errors.givenNames.message}</FieldError>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="familyName" className="text-xs font-medium text-muted-foreground mb-2">
                                    Apellidos <span className="text-primary">*</span>
                                </FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText>
                                            <UserIcon className="size-4" />
                                        </InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        {...form.register("familyName")}
                                        id="familyName"
                                        placeholder="Ej: García López"
                                    />
                                </InputGroup>
                                {form.formState.errors.familyName && (
                                    <FieldError className="text-xs mt-1">{form.formState.errors.familyName.message}</FieldError>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="gender" className="text-xs font-medium text-muted-foreground mb-2">
                                    Género <span className="text-primary">*</span>
                                </FieldLabel>
                                <Select
                                    onValueChange={(val) => form.setValue("gender", val as "female" | "male" | "other" | "unknown")}
                                    value={form.watch("gender")}
                                >
                                    <SelectTrigger id="gender" className="h-9 bg-background/20 border-border/20 focus:ring-primary/20 text-sm">
                                        <SelectValue placeholder="Seleccionar género" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover/90 backdrop-blur-xl border-border/10">
                                        <SelectItem value="unknown">Desconocido</SelectItem>
                                        <SelectItem value="female">Femenino</SelectItem>
                                        <SelectItem value="male">Masculino</SelectItem>
                                        <SelectItem value="other">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.gender && (
                                    <FieldError className="text-xs mt-1">{form.formState.errors.gender.message}</FieldError>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="birthDate" className="text-xs font-medium text-muted-foreground mb-2">
                                    Fecha de nacimiento
                                </FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText>
                                            <CalendarIcon className="size-4" />
                                        </InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        {...form.register("birthDate")}
                                        id="birthDate"
                                        type="date"
                                        max={new Date().toISOString().split("T")[0]}
                                        className={resolvedTheme === "dark" ? "[color-scheme:dark]" : "[color-scheme:light]"}
                                    />
                                </InputGroup>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="documentId" className="text-xs font-medium text-muted-foreground mb-2">
                                    Cédula / Identificación
                                </FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText>
                                            <IdCard className="size-4" />
                                        </InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        {...form.register("documentId")}
                                        id="documentId"
                                        placeholder="V-00000000"
                                    />
                                </InputGroup>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="phone" className="text-xs font-medium text-muted-foreground mb-2">
                                    Teléfono
                                </FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText>
                                            <PhoneIcon className="size-4" />
                                        </InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        {...form.register("phone")}
                                        id="phone"
                                        placeholder="412-0000000"
                                    />
                                </InputGroup>
                            </Field>
                        </FieldGroup>

                        <Field className="space-y-2">
                            <FieldLabel htmlFor="email" className="text-xs font-medium text-muted-foreground mb-2">
                                Correo electrónico
                            </FieldLabel>
                            <InputGroup>
                                <InputGroupAddon>
                                    <InputGroupText>
                                        <MailIcon className="size-4" />
                                    </InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                    {...form.register("email")}
                                    id="email"
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                />
                            </InputGroup>
                            {form.formState.errors.email && (
                                <FieldError className="text-xs mt-1">{form.formState.errors.email.message}</FieldError>
                            )}
                        </Field>

                        <Field className="space-y-2">
                            <FieldLabel htmlFor="address" className="text-xs font-medium text-muted-foreground mb-2">
                                Dirección completa
                            </FieldLabel>
                            <InputGroup>
                                <InputGroupAddon className="pt-3">
                                    <InputGroupText>
                                        <MapPinIcon className="size-4" />
                                    </InputGroupText>
                                </InputGroupAddon>
                                <InputGroupTextarea
                                    {...form.register("address")}
                                    id="address"
                                    placeholder="Calle, Edificio, Apto, Ciudad..."
                                    rows={3}
                                />
                            </InputGroup>
                        </Field>

                        <div className="flex justify-between items-center pt-8 border-t border-border/40">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    if (form.formState.isDirty) {
                                        setShowCancelConfirm(true)
                                    } else {
                                        router.push(mode === "edit" && patientId ? `/patients/${patientId}` : "/patients")
                                    }
                                }}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors"
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px] h-11"
                            >
                                {isLoading
                                    ? mode === "create"
                                        ? "Registrando..."
                                        : "Guardando..."
                                    : mode === "create"
                                        ? "Registrar Paciente"
                                        : "Guardar Cambios"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {mode === "create"
                                ? "Tienes datos ingresados que se perderán si cancelas."
                                : "Tienes cambios sin guardar. Si cancelas, se perderán."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Seguir {mode === "create" ? "registrando" : "editando"}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => router.push(mode === "edit" && patientId ? `/patients/${patientId}` : "/patients")}>
                            Descartar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}