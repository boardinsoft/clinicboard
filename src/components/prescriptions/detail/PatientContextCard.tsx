'use client';

import React from 'react';
import Link from 'next/link';
import { UserCircle, AlertCircle, Stethoscope, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AllergyItem {
    code_display: string;
    criticality: string | null;
}

interface ConditionItem {
    code_display: string;
    clinical_status: string | null;
}

interface PatientContextCardProps {
    patient?: {
        id: string;
        name_given: string[];
        name_family: string;
        birth_date: string | null;
        national_id: string | null;
        gender: string | null;
        active: boolean | null;
        allergies: AllergyItem[] | null;
        conditions: ConditionItem[] | null;
    } | null;
    clinicSlug: string;
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

function getAvatarColor(gender: string | null | undefined): string {
    switch (gender) {
        case 'female':
            return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
        case 'male':
            return 'bg-n-5/30 text-n-11 dark:bg-n-5 dark:text-n-11';
        default:
            return 'bg-n-3 text-n-11 dark:bg-n-5 dark:text-n-10';
    }
}

function getGenderLabel(gender: string | null | undefined): string {
    switch (gender) {
        case 'female':
            return 'F';
        case 'male':
            return 'M';
        default:
            return '—';
    }
}

function getFullName(patient: PatientContextCardProps['patient']): string {
    if (!patient) return '—';
    return `${patient.name_family}, ${(patient.name_given || []).join(' ')}`;
}

export function PatientContextCard({ patient, clinicSlug }: PatientContextCardProps) {
    const fullName = getFullName(patient);
    const age = calcAge(patient?.birth_date);
    const initials = getInitials(patient?.name_given, patient?.name_family);
    const genderLabel = getGenderLabel(patient?.gender);
    const avatarColor = getAvatarColor(patient?.gender);

    const allergies = patient?.allergies ?? [];
    const conditions = patient?.conditions ?? [];
    const activeConditions = conditions.filter(c => c.clinical_status === 'active');

    const visibleAllergies = allergies.slice(0, 3);
    const hiddenAllergyCount = allergies.length - visibleAllergies.length;

    const visibleConditions = activeConditions.slice(0, 3);
    const hiddenConditionCount = activeConditions.length - visibleConditions.length;

    const hasAllergies = allergies.length > 0;
    const hasConditions = activeConditions.length > 0;

    return (
        <div className="bg-n-1 rounded-lg border border-n-5/30 p-5 space-y-4">
            <div className="flex items-start gap-4">
                <div
                    className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center shrink-0',
                        'text-lg font-bold border-2 border-n-5/20',
                        avatarColor
                    )}
                    aria-hidden="true"
                >
                    {patient ? initials : <UserCircle className="w-8 h-8" strokeWidth={1.5} />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-n-11 tracking-tight">
                            {fullName}
                        </h3>
                        {patient && (
                            <Link
                                href={`/${clinicSlug}/patients/${patient.id}`}
                                className="text-[11px] font-medium text-b-8 hover:text-b-9 flex items-center gap-0.5 transition-colors"
                                aria-label={`Ver perfil completo de ${fullName}`}
                            >
                                Ver perfil
                                <ArrowUpRight className="w-3 h-3" strokeWidth={1.8} aria-hidden="true" />
                            </Link>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {patient?.national_id && (
                            <span className="text-[11px] font-mono text-n-9 bg-n-2 px-2 py-0.5 rounded border border-n-5/30">
                                {patient.national_id}
                            </span>
                        )}
                        {age && (
                            <span className="text-[11px] text-n-8">{age}</span>
                        )}
                        {genderLabel !== '—' && (
                            <span className="text-[11px] text-n-8">{genderLabel}</span>
                        )}
                        {patient?.active !== undefined && (
                            <Badge
                                variant={patient.active ? 'pill-success' : 'pill-neutral'}
                                className="text-[10px]"
                            >
                                {patient.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {hasAllergies && (
                <div className="flex items-start gap-2.5 p-3 bg-s-danger-bg/50 rounded-lg border border-s-danger-br/30">
                    <AlertCircle
                        className="w-4 h-4 text-s-danger shrink-0 mt-0.5"
                        strokeWidth={1.8}
                        aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-s-danger uppercase tracking-wider mb-1.5">
                            Alergias ({allergies.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {visibleAllergies.map((allergy, i) => (
                                <Badge
                                    key={i}
                                    variant="pill-danger"
                                    className="text-[11px]"
                                >
                                    {allergy.code_display}
                                    {allergy.criticality === 'high' && (
                                        <AlertTriangle
                                            className="w-3 h-3 ml-1 text-s-danger"
                                            strokeWidth={2}
                                            aria-label="Alergia crítica"
                                        />
                                    )}
                                </Badge>
                            ))}
                            {hiddenAllergyCount > 0 && patient && (
                                <Link
                                    href={`/${clinicSlug}/patients/${patient.id}`}
                                    className="text-[11px] text-b-8 hover:text-b-9 transition-colors"
                                >
                                    +{hiddenAllergyCount} más
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {hasConditions && (
                <div className="flex items-start gap-2.5 p-3 bg-s-warning-bg/50 rounded-lg border border-s-warning-br/30">
                    <Stethoscope
                        className="w-4 h-4 text-s-warning shrink-0 mt-0.5"
                        strokeWidth={1.8}
                        aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-s-warning uppercase tracking-wider mb-1.5">
                            Condiciones activas ({activeConditions.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {visibleConditions.map((condition, i) => (
                                <Badge
                                    key={i}
                                    variant="pill-warning"
                                    className="text-[11px]"
                                >
                                    {condition.code_display}
                                </Badge>
                            ))}
                            {hiddenConditionCount > 0 && patient && (
                                <Link
                                    href={`/${clinicSlug}/patients/${patient.id}`}
                                    className="text-[11px] text-b-8 hover:text-b-9 transition-colors"
                                >
                                    +{hiddenConditionCount} más
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
