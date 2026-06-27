'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pill, FileText, AlertCircle, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { notify } from '@/lib/notify';
import { createPrescriptions } from '@/actions/prescriptions';
import { getPrescriptionColor } from '@/lib/ve-prescription';
import type { MedicationItemInput } from '@/lib/schemas/prescription.schema';
import MedicationCard from './MedicationCard';
import AddMedicationDialog from './AddMedicationDialog';
import PrescriptionNotesCard from './PrescriptionNotesCard';
import PrescriptionPreviewModal from './PrescriptionPreviewModal';
import type { EncounterWithClinicalNote } from '@/types/database.types';
import type { Tables } from '@/types/database.types';

interface PrescriptionCreatorProps {
    encounterId: string;
    clinicSlug: string;
    encounter: EncounterWithClinicalNote;
    patient: Tables<'patients'> | null;
    clinic: {
        id: string;
        name: string;
    } | null;
    practitioner: {
        name_given: string[];
        name_family: string;
        specialty: string | null;
        license_number: string | null;
    } | null;
}

function calcAge(birthDate: string | null): string | null {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return `${age}a`;
}

function getDefaultValidUntil(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

export default function PrescriptionCreator({
    encounterId,
    clinicSlug,
    encounter,
    patient,
    clinic,
    practitioner,
}: PrescriptionCreatorProps) {
    const router = useRouter();
    const [items, setItems] = useState<MedicationItemInput[]>([]);
    const [notes, setNotes] = useState('');
    const [validUntil, setValidUntil] = useState(getDefaultValidUntil(30));
    const [isAddingMedication, setIsAddingMedication] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const patientName = patient
        ? `${patient.name_family}, ${(patient.name_given || []).join(' ')}`
        : '—';
    const patientAge = calcAge(patient?.birth_date || null);
    const patientDocId = patient?.national_id || '—';

    const practitionerName = practitioner
        ? `${practitioner.name_family}, ${(practitioner.name_given || []).join(' ')}`
        : '—';

    const hasUnsavedChanges = items.length > 0 || notes.trim().length > 0;

    useEffect(() => {
        const hasAntibiotic = items.some(item =>
            getPrescriptionColor(item.medication_code, item.medication_display) === 'green'
        );
        if (hasAntibiotic && items.length > 0) {
            setValidUntil(getDefaultValidUntil(7));
        }
    }, [items]);

    const handleAddMedication = (medication: { code: string; display: string }) => {
        const newItem: MedicationItemInput = {
            id: `med-${Date.now()}`,
            medication_code: medication.code,
            medication_display: medication.display,
            dose: '',
            frequency: '',
            route: '',
            duration_value: '',
            duration_unit: 'dias',
            indications: '',
        };
        setItems([...items, newItem]);
        setIsAddingMedication(false);
    };

    const handleUpdateItem = (id: string, field: keyof MedicationItemInput, value: string) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSaveDraft = async () => {
        if (items.length === 0) {
            notify.error('Agrega al menos un medicamento a la receta');
            return;
        }

        if (!encounter.clinic_id) {
            notify.error('Selecciona una clínica para la receta');
            return;
        }

        setIsSaving(true);

        const result = await createPrescriptions({
            encounter_id: encounterId,
            patient_id: encounter.patient_id,
            clinic_id: encounter.clinic_id,
            items,
            notes,
            intent: 'order',
            valid_until: new Date(validUntil).toISOString(),
        });

        setIsSaving(false);

        if (result.error) {
            notify.error('No se pudo guardar el borrador', { description: 'Intenta de nuevo en unos momentos' });
            return;
        }

        notify.success('Receta guardada como borrador');
        router.push(`/${clinicSlug}/prescriptions`);
    };

    const handleSaveAndActivate = async () => {
        if (items.length === 0) {
            notify.error('Agrega al menos un medicamento a la receta');
            return;
        }

        if (!encounter.clinic_id) {
            notify.error('Selecciona una clínica para la receta');
            return;
        }

        setIsSaving(true);

        const result = await createPrescriptions({
            encounter_id: encounterId,
            patient_id: encounter.patient_id,
            clinic_id: encounter.clinic_id,
            items,
            notes,
            intent: 'order',
            valid_until: new Date(validUntil).toISOString(),
        });

        setIsSaving(false);

        if (result.error) {
            notify.error('No se pudo crear la receta', { description: 'Intenta de nuevo en unos momentos' });
            return;
        }

        const data = result.data as unknown as Array<{ id: string }>;
        if (data && data.length > 0) {
            for (const rx of data) {
                const { activatePrescription } = await import('@/actions/prescriptions');
                await activatePrescription(rx.id);
            }
        }

        notify.success('Receta creada y activada');
        router.push(`/${clinicSlug}/prescriptions`);
    };

    const handleCancel = () => {
        if (hasUnsavedChanges) {
            setShowCancelConfirm(true);
        } else {
            router.push(`/${clinicSlug}/history?encounterId=${encounterId}`);
        }
    };

    return (
        <div className="min-h-screen bg-n-2 flex flex-col">
            <div className="shrink-0 bg-n-1 border-b border-n-5/30">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 pl-0 pr-3 gap-1.5"
                            onClick={handleCancel}
                        >
                            <ArrowLeft className="w-4 h-4 text-n-8" />
                            <span className="text-xs font-medium text-n-8">Volver</span>
                        </Button>
                        <div className="w-px h-6 bg-n-5/30" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-b-8/10 flex items-center justify-center">
                                <Pill className="w-4 h-4 text-b-8" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-n-11">Nueva Receta</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="pill-info" className="text-[10px]">
                                        #{encounterId.slice(0, 8)}
                                    </Badge>
                                    <span className="text-[10px] text-n-8">Sin activar</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-[11px]"
                            onClick={() => setIsPreviewOpen(true)}
                            disabled={items.length === 0}
                        >
                            <FileText className="w-3.5 h-3.5 mr-1.5" />
                            Vista Previa
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-6 space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-n-1 rounded-lg border border-n-5/30">
                        <div className="w-10 h-10 rounded-full bg-b-8/10 flex items-center justify-center text-b-8 text-sm font-bold shrink-0">
                            {patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-n-11 truncate">{patientName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-n-8 mono">{patientDocId}</span>
                                {patientAge && (
                                    <>
                                        <span className="text-[10px] text-n-6">·</span>
                                        <span className="text-[11px] text-n-8">{patientAge}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <Badge variant="pill-neutral" className="text-[10px] shrink-0">
                            Paciente en consulta
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-5 rounded-full bg-b-8" />
                                <h2 className="text-sm font-semibold text-n-11">Medicamentos</h2>
                                <Badge variant="pill" className="text-[10px]">{items.length}</Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[11px] font-bold text-b-8 hover:bg-b-1"
                                onClick={() => setIsAddingMedication(true)}
                            >
                                <Pill className="w-3.5 h-3.5 mr-1" />
                                Agregar medicamento
                            </Button>
                        </div>

                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 bg-n-1 rounded-lg border border-dashed border-n-5/30">
                                <div className="w-12 h-12 rounded-full bg-n-3/50 flex items-center justify-center">
                                    <Pill className="w-5 h-5 text-n-6" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium text-n-8">Sin medicamentos agregados</p>
                                    <p className="text-[11px] text-n-6 mt-0.5">Usa el botón de arriba para agregar medicamentos a la receta</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[11px] mt-1"
                                    onClick={() => setIsAddingMedication(true)}
                                >
                                    <Pill className="w-3 h-3 mr-1" />
                                    Agregar el primero
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <MedicationCard
                                        key={item.id}
                                        item={item}
                                        index={index + 1}
                                        onUpdate={(field, value) => handleUpdateItem(item.id, field, value)}
                                        onRemove={() => handleRemoveItem(item.id)}
                                    />
                                ))}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full h-8 text-[11px] text-n-8 border border-dashed border-n-5/30 hover:border-b-8/30 hover:text-b-8"
                                    onClick={() => setIsAddingMedication(true)}
                                >
                                    <Pill className="w-3 h-3 mr-1" />
                                    Agregar otro medicamento
                                </Button>
                            </div>
                        )}
                    </div>

                    <PrescriptionNotesCard notes={notes} onChange={setNotes} />

                    <div className="bg-n-1 rounded-lg border border-n-5/30 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <CalendarClock className="w-4 h-4 text-b-8" />
                            <h3 className="text-sm font-semibold text-n-11">Fecha de Expiración</h3>
                            <Badge variant="pill-info" className="text-[10px]">Art. 5 #8</Badge>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="valid_until" className="text-[11px] font-medium text-n-10">
                                        Fecha de expiración de la receta
                                    </Label>
                                    <Input
                                        id="valid_until"
                                        type="date"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                        className="h-9 text-sm w-44"
                                        min={new Date().toISOString().split('T')[0]}
                                        max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                    />
                                </div>
                                <div className="flex gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[10px]"
                                        onClick={() => setValidUntil(getDefaultValidUntil(30))}
                                    >
                                        30 días
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[10px]"
                                        onClick={() => setValidUntil(getDefaultValidUntil(7))}
                                    >
                                        7 días
                                    </Button>
                                </div>
                            </div>
                            <p className="text-[10px] text-n-8">
                                Los antibióticos tienen validez de 7 días. Los controlados vencen inmediatamente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="shrink-0 bg-n-1 border-t border-n-5/30 px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 text-[12px]"
                        onClick={handleCancel}
                    >
                        Cancelar
                    </Button>
                    <div className="flex-1" />
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-[12px]"
                        onClick={handleSaveDraft}
                        disabled={isSaving || items.length === 0}
                    >
                        Guardar borrador
                    </Button>
                    <Button
                        size="sm"
                        className="h-9 px-4 text-[12px] bg-b-8 hover:bg-b-9 active:scale-95"
                        onClick={handleSaveAndActivate}
                        disabled={isSaving || items.length === 0}
                    >
                        {isSaving ? 'Guardando...' : 'Guardar y activar'}
                    </Button>
                </div>
            </div>

            <AddMedicationDialog
                open={isAddingMedication}
                onOpenChange={setIsAddingMedication}
                onSelect={handleAddMedication}
            />

            <PrescriptionPreviewModal
                open={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                items={items}
                notes={notes}
                patientName={patientName}
                patientDocId={patientDocId}
                patientAge={patientAge}
                practitionerName={practitionerName}
                practitionerSpecialty={practitioner?.specialty ?? null}
                practitionerRegNumber={practitioner?.license_number ?? null}
                clinicName={clinic?.name ?? null}
                clinicAddress={null}
                clinicPhone={null}
                onSaveDraft={handleSaveDraft}
                onSaveAndActivate={handleSaveAndActivate}
            />

            {showCancelConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-n-1 rounded-lg border border-n-5/30 p-6 max-w-sm w-full mx-4 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-s-warning-bg/30 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-s-warning" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-n-11">Descartar receta</h3>
                                <p className="text-[11px] text-n-8 mt-0.5">Tienes cambios sin guardar</p>
                            </div>
                        </div>
                        <p className="text-xs text-n-8 mb-5">
                            ¿Estás seguro de que quieres salir? Los medicamentos agregados se perderán.
                        </p>
                        <div className="flex items-center gap-2 justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[11px]"
                                onClick={() => setShowCancelConfirm(false)}
                            >
                                Continuar editando
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-[11px] border-s-danger/30 text-s-danger hover:bg-s-danger/10"
                                onClick={() => router.push(`/${clinicSlug}/history?encounterId=${encounterId}`)}
                            >
                                Descartar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}