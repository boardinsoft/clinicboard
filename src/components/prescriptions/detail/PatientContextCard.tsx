'use client';

import React from 'react';
import { UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MedicationRequestStatus } from '@/lib/fhir/types';

interface PatientContextCardProps {
    patient?: {
        id: string;
        name_given: string[];
        name_family: string;
        birth_date: string | null;
        national_id: string | null;
    } | null;
    prescriber?: {
        name_given: string[];
        name_family: string;
    } | null;
    status: MedicationRequestStatus | null;
}

function calcAge(birthDate: string | null | undefined): string | null {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age}a`;
}

function getInitials(givenNames?: string[], familyName?: string): string {
    const first = givenNames?.[0]?.[0] || '';
    const last = familyName?.[0] || '';
    return `${first}${last}`.toUpperCase() || '?';
}

export function PatientContextCard({ patient, prescriber, status }: PatientContextCardProps) {
    const fullName = patient
        ? `${patient.name_family}, ${(patient.name_given || []).join(' ')}`
        : '—';
    const age = calcAge(patient?.birth_date);
    const initials = getInitials(patient?.name_given, patient?.name_family);
    const prescriberName = prescriber
        ? `${prescriber.name_family}, ${(prescriber.name_given || []).join(' ')}`
        : '—';

    return (
        <div className="flex items-start gap-3 p-4 bg-n-1 rounded-lg border border-n-5/30">
            <div
                className="w-10 h-10 rounded-full bg-b-2 flex items-center justify-center shrink-0 text-b-8 text-sm font-bold"
                aria-hidden="true"
            >
                {patient ? initials : <UserCircle className="w-5 h-5" strokeWidth={1.8} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-n-11">{fullName}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {age && (
                        <>
                            <span className="text-[11px] text-n-8">{age}</span>
                            <span className="text-[10px] text-n-6" aria-hidden="true">·</span>
                        </>
                    )}
                    <span className="text-[11px] text-n-9">
                        Dr. {prescriberName}
                    </span>
                    {patient?.national_id && (
                        <>
                            <span className="text-[10px] text-n-6" aria-hidden="true">·</span>
                            <span className="text-[11px] font-mono text-n-9">
                                {patient.national_id}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
