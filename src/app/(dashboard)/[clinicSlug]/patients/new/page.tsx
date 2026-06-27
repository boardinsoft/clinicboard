"use client"

import React, { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createPatient } from "@/actions/patients"
import { PatientForm, PatientFormValues } from "@/components/patients/PatientForm"
import { notify } from '@/lib/notify'

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
            notify.error({ title: 'No se pudo registrar el paciente', description: 'Verifica los datos e intenta de nuevo' });
            setLoading(false)
            throw new Error(JSON.stringify(result.error))
        }

        notify.success({ title: 'Paciente registrado', description: `${values.familyName} ya está en tu consultorio` });

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