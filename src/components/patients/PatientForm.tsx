"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { UserIcon, Edit3 } from "lucide-react"
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
        <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
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

            <Card className="border border-n-5/30 bg-n-2/40 shadow-none overflow-hidden">
                <CardHeader className="border-b border-n-5/30 pb-5 px-8 pt-6">
                    <div className="flex items-center justify-between">
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
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field>
                                <FieldLabel htmlFor="givenNames">
                                    Nombres <span className="text-b-8">*</span>
                                </FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon align="inline-start">
                                        <InputGroupText className="text-n-8">Nom.</InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        {...form.register("givenNames")}
                                        id="givenNames"
                                        placeholder="María Carmen"
                                        className="placeholder:text-n-8"
                                    />
                                </InputGroup>
                                {form.formState.errors.givenNames && (
                                    <FieldError>{form.formState.errors.givenNames.message}</FieldError>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="familyName">
                                    Apellidos <span className="text-b-8">*</span>
                                </FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon align="inline-start">
                                        <InputGroupText className="text-n-8">Ape.</InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        {...form.register("familyName")}
                                        id="familyName"
                                        placeholder="García López"
                                        className="placeholder:text-n-8"
                                    />
                                </InputGroup>
                                {form.formState.errors.familyName && (
                                    <FieldError>{form.formState.errors.familyName.message}</FieldError>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="gender">
                                    Género <span className="text-b-8">*</span>
                                </FieldLabel>
                                <Select
                                    onValueChange={(val) => form.setValue("gender", val as "female" | "male" | "other" | "unknown")}
                                    value={form.watch("gender")}
                                >
                                    <SelectTrigger id="gender" className="h-10 bg-n-1 border-n-5 text-sm">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-n-5">
                                        <SelectItem value="unknown">Desconocido</SelectItem>
                                        <SelectItem value="female">Femenino</SelectItem>
                                        <SelectItem value="male">Masculino</SelectItem>
                                        <SelectItem value="other">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.gender && (
                                    <FieldError>{form.formState.errors.gender.message}</FieldError>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="birthDate">Fecha de nacimiento</FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon align="inline-start">
                                        <InputGroupText className="text-n-8">Nac.</InputGroupText>
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
                                <FieldLabel htmlFor="documentId">Cédula / Identificación</FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon align="inline-start">
                                        <InputGroupText className="text-n-8">ID</InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        {...form.register("documentId")}
                                        id="documentId"
                                        placeholder="00000000"
                                        className="placeholder:text-n-8 font-mono"
                                    />
                                </InputGroup>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon align="inline-start">
                                        <InputGroupText className="text-n-8">+58</InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        {...form.register("phone")}
                                        id="phone"
                                        placeholder="412 0000000"
                                        className="placeholder:text-n-8"
                                    />
                                </InputGroup>
                            </Field>
                        </FieldGroup>

                        <Field>
                            <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                            <InputGroup>
                                <InputGroupAddon align="inline-start">
                                    <InputGroupText className="text-n-8">@</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                    {...form.register("email")}
                                    id="email"
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    className="placeholder:text-n-8"
                                />
                            </InputGroup>
                            {form.formState.errors.email && (
                                <FieldError>{form.formState.errors.email.message}</FieldError>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="address">Dirección completa</FieldLabel>
                            <InputGroup>
                                <InputGroupAddon align="block-start" className="pt-3">
                                    <InputGroupText className="text-n-8">Dir.</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupTextarea
                                    {...form.register("address")}
                                    id="address"
                                    placeholder="Av. Principal, Edificio, Apartamento, Ciudad..."
                                    rows={3}
                                    className="min-h-[80px] placeholder:text-n-8"
                                />
                            </InputGroup>
                        </Field>

                        <div className="flex justify-end items-center gap-3 pt-5 border-t border-n-5/30">
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
    )
}