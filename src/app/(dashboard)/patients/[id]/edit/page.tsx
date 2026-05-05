"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { updatePatient } from "@/actions/patients"
import { PatientForm, PatientFormValues } from "@/components/patients/PatientForm"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

interface PatientIdentifier { value?: string }
interface PatientTelecom { system?: string; value?: string }
interface PatientAddress { text?: string }

export default function EditPatientPage() {
    const router = useRouter()
    const { id } = useParams<{ id: string }>()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [patientName, setPatientName] = useState("")
    const [patientData, setPatientData] = useState<PatientFormValues | null>(null)
    const [patientActive, setPatientActive] = useState(true)

    const formRef = useRef<{ reset: (values: PatientFormValues) => void } | null>(null)

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                const { data, error } = await supabase
                    .from("patients")
                    .select("*")
                    .eq("id", id)
                    .single()

                if (error) throw error

                if (!data) {
                    router.replace("/patients")
                    return
                }

                const values: PatientFormValues = {
                    givenNames: data.name_given?.join(", ") || "",
                    familyName: data.name_family || "",
                    gender: (data.gender as PatientFormValues['gender']) || "unknown",
                    birthDate: data.birth_date || "",
                    documentId: (data.identifiers as PatientIdentifier[] | null)?.[0]?.value || "",
                    phone: (data.telecom as PatientTelecom[] | null)?.find(t => t.system === "phone")?.value || "",
                    email: (data.telecom as PatientTelecom[] | null)?.find(t => t.system === "email")?.value || "",
                    address: (data.address as PatientAddress[] | null)?.[0]?.text || "",
                }
                setPatientData(values)
                setPatientName(`${data.name_given?.join(" ") || ""} ${data.name_family || ""}`.trim())
                setPatientActive(data.active !== false)
            } catch (error: unknown) {
                console.error("Error fetching patient:", error)
                const message = error instanceof Error ? error.message : "No se pudo cargar la información del paciente."
                toast.error("Error al cargar", { description: message })
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchPatient()
    }, [id, supabase, router])

    const handleSubmit = async (values: PatientFormValues) => {
        setSaving(true)

        const givenNames = values.givenNames.split(",").map(n => n.trim()).filter(n => n !== "")

        await updatePatient(id as string, {
            givenNames,
            familyName: values.familyName,
            gender: values.gender,
            birthDate: values.birthDate || null,
            documentId: values.documentId || "",
            phone: values.phone || "",
            email: values.email || "",
            address: values.address || ""
        })

        toast.success("Paciente actualizado", {
            description: "Los cambios han sido guardados exitosamente."
        })

        router.push(`/patients/${id}`)

        setSaving(false)
    }

    if (loading) {
        return (
            <div className="p-8 max-w-4xl mx-auto space-y-8 animate-pulse text-pretty">
                <Skeleton className="h-4 w-48 mb-4 bg-muted/10" />
                <Skeleton className="h-12 w-64 mb-8 bg-muted/20" />
                <Card className="border-border/10 shadow-none bg-card/20 overflow-hidden">
                    <Skeleton className="h-[500px] w-full bg-muted/5" />
                </Card>
            </div>
        )
    }

    if (!patientData) {
        return (
            <div className="p-8 max-w-4xl mx-auto space-y-8">
                <Skeleton className="h-4 w-48 mb-4 bg-muted/10" />
                <Card className="border-border/10 shadow-none bg-card/20">
                    <CardHeader>
                        <CardTitle className="text-lg">Paciente no encontrado</CardTitle>
                        <CardDescription>No se pudo cargar la información del paciente.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <PatientForm
            mode="edit"
            defaultValues={patientData}
            onSubmit={handleSubmit}
            isLoading={saving}
            patientId={id}
            patientName={patientName}
            patientActive={patientActive}
        />
    )
}