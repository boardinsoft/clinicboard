"use client"

import React, { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createPatient } from "@/actions/patients"
import { PatientForm, PatientFormValues } from "@/components/patients/PatientForm"
import { toast } from "sonner"

function getClinicSlug(pathname: string): string {
    const parts = pathname.split('/').filter(Boolean);
    return parts[0] || '';
}

export default function NewPatientPage() {
    const router = useRouter()
    const pathname = usePathname()
    const clinicSlug = getClinicSlug(pathname)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (values: PatientFormValues) => {
        setLoading(true)

        const givenNames = values.givenNames.split(",").map(n => n.trim()).filter(n => n !== "")

        const result = await createPatient({
            givenNames,
            familyName: values.familyName,
            gender: values.gender,
            birthDate: values.birthDate || null,
            documentId: values.documentId || "",
            phone: values.phone || "",
            email: values.email || "",
            address: values.address || ""
        })

        if (result.error) {
            toast.error("Error al registrar", {
                description: JSON.stringify(result.error) || "No se pudo guardar el paciente."
            })
            setLoading(false)
            throw new Error(JSON.stringify(result.error))
        }

        toast.success("Paciente registrado", {
            description: `El paciente ${values.familyName} ha sido creado exitosamente.`
        })

        if (result.data?.id) {
            router.push(`/${clinicSlug}/patients/${result.data.id}`)
        } else {
            router.push(`/${clinicSlug}/patients`)
        }

        setLoading(false)
    }

    return (
        <PatientForm
            mode="create"
            onSubmit={handleSubmit}
            isLoading={loading}
        />
    )
}