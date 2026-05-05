"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { UserIcon, Edit3, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
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
    patientActive?: boolean
}

function calcAge(birthDate: string): string {
    if (!birthDate) return ""
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return `${age}`
}

function getGenderLabel(gender: string): string {
    switch (gender) {
        case "male": return "Masculino"
        case "female": return "Femenino"
        case "other": return "Otro"
        default: return "Sin especificar"
    }
}

function getAvatarColor(gender: string): string {
    switch (gender) {
        case "female": return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
        case "male": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        default: return "bg-n-3 text-n-11 dark:bg-n-5 dark:text-n-10"
    }
}

function getInitials(givenNames?: string, familyName?: string): string {
    const first = givenNames?.split(",")[0]?.trim()?.[0] || ""
    const last = familyName?.[0] || ""
    return `${first}${last}`.toUpperCase() || "?"
}

interface FormFieldProps {
    label: string
    required?: boolean
    description?: string
    error?: string
    children: React.ReactNode
}

function FormField({ label, required, description, error, children }: FormFieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex flex-col gap-0.5">
                <label className="text-sm font-medium text-foreground">
                    {label} {required && <span className="text-b-8">*</span>}
                </label>
                {description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                )}
            </div>
            {children}
            {error && <FieldError>{error}</FieldError>}
        </div>
    )
}

export function PatientForm({
    defaultValues,
    onSubmit,
    isLoading = false,
    mode,
    patientId,
    patientName,
    patientActive = true,
}: PatientFormProps) {
    const router = useRouter()
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

    const watchAll = form.watch()
    const givenNames = watchAll.givenNames || defaultValues?.givenNames || ""
    const familyName = watchAll.familyName || defaultValues?.familyName || patientName || ""
    const gender = watchAll.gender || defaultValues?.gender || "unknown"
    const birthDate = watchAll.birthDate || defaultValues?.birthDate || ""
    const documentId = watchAll.documentId || defaultValues?.documentId || ""

    const handleSubmit = async (values: PatientFormValues) => {
        try {
            await onSubmit(values)
        } catch (error: unknown) {
            console.error("Error submitting patient form:", error)
            const message = error instanceof Error ? error.message : "Ocurrió un error inesperado."
            toast.error("Error", { description: message })
        }
    }

    const initials = getInitials(givenNames, familyName)
    const age = calcAge(birthDate)

    return (
        <div className="min-h-screen bg-n-2">
            <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
                {mode === "edit" && patientName ? (
                    <div className="mb-6 p-5 bg-n-1 rounded-lg border border-n-5/30">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 border-2 border-n-5/20",
                                getAvatarColor(gender)
                            )}>
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-bold text-n-11 tracking-tight leading-tight">
                                    {patientName}
                                </h1>
                                <div className="flex items-center gap-3 mt-1.5">
                                    {documentId && (
                                        <span className="text-xs font-mono text-n-8 bg-n-2 px-2 py-0.5 rounded">{documentId}</span>
                                    )}
                                    {age && (
                                        <span className="text-xs text-n-8">{age} años</span>
                                    )}
                                    <span className="text-xs text-n-8 capitalize">{getGenderLabel(gender)}</span>
                                    <Badge variant={patientActive ? "pill-success" : "pill-neutral"} className="text-[10px] py-0.5">
                                        {patientActive ? "Activo" : "Inactivo"}
                                    </Badge>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-b-8/10 flex items-center justify-center shrink-0">
                                <Edit3 className="w-5 h-5 text-b-8" />
                            </div>
                        </div>
                        <p className="text-sm text-n-8 mt-4 leading-relaxed">
                            Los cambios se guardarán en el expediente FHIR del paciente
                        </p>
                    </div>
                ) : (
                    <div className="mb-6 p-5 bg-n-1 rounded-lg border border-n-5/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-b-8/10 flex items-center justify-center">
                                <UserIcon className="size-5 text-b-8" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-n-11">
                                Alta de Paciente
                            </h1>
                        </div>
                        <p className="text-sm text-n-8 mt-2 leading-relaxed">
                            Complete la información demográfica del paciente
                        </p>
                    </div>
                )}

                <Card className="border border-n-5/30 bg-n-1 shadow-none overflow-hidden">
                    <CardHeader className="border-b border-n-5/30 pb-5 px-6 pt-5">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 rounded-full bg-b-8" />
                            <div>
                                <CardTitle className="text-sm font-semibold tracking-tight text-n-11 uppercase">
                                    Datos demográficos
                                </CardTitle>
                                <CardDescription className="text-xs text-n-8 mt-0.5">
                                    {mode === "create"
                                        ? "Los campos marcados con * son obligatorios"
                                        : "Complete o actualice la información necesaria"}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="divide-y divide-n-5/30">
                            <div className="p-6 space-y-6 first:pt-0 last:pb-0">
                                <FormField
                                    label="Nombres"
                                    required
                                    description="Primer nombre y segundos nombres del paciente"
                                    error={form.formState.errors.givenNames?.message}
                                >
                                    <Input
                                        {...form.register("givenNames")}
                                        id="givenNames"
                                        placeholder="María Carmen"
                                        className="h-10"
                                    />
                                </FormField>

                                <FormField
                                    label="Apellidos"
                                    required
                                    description="Apellidos completos del paciente"
                                    error={form.formState.errors.familyName?.message}
                                >
                                    <Input
                                        {...form.register("familyName")}
                                        id="familyName"
                                        placeholder="García López"
                                        className="h-10"
                                    />
                                </FormField>

                                <FormField
                                    label="Género"
                                    required
                                    description="Sexo biológico registrado"
                                    error={form.formState.errors.gender?.message}
                                >
                                    <Select
                                        onValueChange={(val) => form.setValue("gender", val as "female" | "male" | "other" | "unknown")}
                                        value={form.watch("gender")}
                                    >
                                        <SelectTrigger className="h-10 bg-n-1 border-n-5/40 text-sm rounded-md">
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-n-5">
                                            <SelectItem value="unknown">Desconocido</SelectItem>
                                            <SelectItem value="female">Femenino</SelectItem>
                                            <SelectItem value="male">Masculino</SelectItem>
                                            <SelectItem value="other">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormField>

                                <FormField
                                    label="Fecha de nacimiento"
                                    description="Día, mes y año de nacimiento"
                                >
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                className={cn(
                                                    "flex h-10 w-full items-center justify-between rounded-md border border-n-5/40 bg-n-1 px-3 py-2 text-sm hover:border-n-5/60 transition-all",
                                                    !form.watch("birthDate") && "text-muted-foreground"
                                                )}
                                            >
                                                {form.watch("birthDate") ? form.watch("birthDate") : "Seleccionar fecha"}
                                                <CalendarIcon className="h-4 w-4 text-n-8" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={form.watch("birthDate") ? new Date(form.watch("birthDate")!) : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        form.setValue("birthDate", date.toISOString().split("T")[0])
                                                    }
                                                }}
                                                className="rounded-md border"
                                                captionLayout="dropdown"
                                                disabled={(date) => date > new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </FormField>

                                <FormField
                                    label="Cédula / Identificación"
                                    description="Documento de identidad oficial"
                                >
                                    <Input
                                        {...form.register("documentId")}
                                        id="documentId"
                                        placeholder="00000000"
                                        className="h-10 font-mono"
                                    />
                                </FormField>

                                <FormField
                                    label="Teléfono"
                                    description="Número de contacto principal"
                                >
                                    <Input
                                        {...form.register("phone")}
                                        id="phone"
                                        placeholder="412 0000000"
                                        className="h-10"
                                    />
                                </FormField>

                                <FormField
                                    label="Correo electrónico"
                                    description="Dirección de correo electrónico"
                                    error={form.formState.errors.email?.message}
                                >
                                    <Input
                                        {...form.register("email")}
                                        id="email"
                                        type="email"
                                        placeholder="correo@ejemplo.com"
                                        className="h-10"
                                    />
                                </FormField>

                                <FormField
                                    label="Dirección completa"
                                    description="Residencia actual del paciente"
                                >
                                    <Textarea
                                        {...form.register("address")}
                                        id="address"
                                        placeholder="Av. Principal, Edificio, Apartamento, Ciudad..."
                                        rows={3}
                                        className="min-h-[80px] resize-none"
                                    />
                                </FormField>
                            </div>

                            <div className="flex justify-end items-center gap-3 p-5 bg-n-2/30 border-t border-n-5/30">
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
                                    className="text-n-8 hover:text-n-11 hover:bg-n-3 transition-colors h-9 px-4"
                                    disabled={isLoading}
                                >
                                    Cancelar
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-b-8 hover:bg-b-9 text-white h-9 px-5 font-medium shadow-lg shadow-b-8/20"
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
        </div>
    )
}