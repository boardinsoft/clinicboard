'use client';

import React, { useState, useMemo } from 'react';
import { Button, Tag, Loading } from '@carbon/react';
import {
    Stethoscope,
    Add,
    ChevronDown,
    ChevronRight,
    Chat,
    Folder,
    DocumentMultiple_01,
    Time,
    Checkmark,
    Search,
} from '@carbon/icons-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EncounterWithSpecialty {
    id: string;
    start_time: string;
    evolution_note?: string;
    status?: string;
    reason_code?: any[];
    practitioner?: {
        name_given?: string[];
        name_family?: string;
        specialty?: string;
    };
}

interface SpecialtySidebarProps {
    selectedPatient: any;
    encounters: EncounterWithSpecialty[];
    isLoading: boolean;
    activeEncounterId: string | null;
    onSelectEncounter: (id: string | null, enc: EncounterWithSpecialty | null) => void;
    onNewEncounter: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function getSpecialtyLabel(specialty: string | undefined | null): string {
    if (!specialty) return 'Medicina General';
    return specialty.trim();
}

// Map specialty → Carbon icon (fallback: Stethoscope)
const SPECIALTY_ICONS: Record<string, React.ComponentType<any>> = {
    'Cardiología': Stethoscope,
    'Medicina Interna': Stethoscope,
    'Medicina General': Stethoscope,
    'Neurología': Stethoscope,
    'Pediatría': Stethoscope,
    'Ginecología': Stethoscope,
    'Traumatología': Stethoscope,
    'Dermatología': Stethoscope,
};

function SpecialtyIcon({ specialty }: { specialty: string }) {
    const Icon = SPECIALTY_ICONS[specialty] ?? Stethoscope;
    return <Icon size={16} aria-hidden="true" />;
}

// ─── EncounterRow ───────────────────────────────────────────────────────────────

function EncounterRow({
    enc,
    isActive,
    onClick,
}: {
    enc: EncounterWithSpecialty;
    isActive: boolean;
    onClick: () => void;
}) {
    const status = enc.status || 'finished';
    const reasonText = Array.isArray(enc.reason_code) && enc.reason_code.length > 0
        ? enc.reason_code[0]?.text || enc.reason_code[0]?.code || null
        : null;
    const preview = enc.evolution_note
        ? enc.evolution_note.slice(0, 60) + (enc.evolution_note.length > 60 ? '…' : '')
        : 'Sin nota clínica';

    return (
        <button
            className={`hc-enc-row${isActive ? ' hc-enc-row--active' : ''}`}
            onClick={onClick}
            aria-selected={isActive}
            role="option"
        >
            <span className={`hc-enc-row__bar hc-enc-row__bar--${status}`} aria-hidden="true" />
            <span className="hc-enc-row__body">
                <span className="hc-enc-row__top">
                    <span className="hc-enc-row__date">{formatShortDate(enc.start_time)}</span>
                    {status === 'finished' ? (
                        <Checkmark size={16} aria-label="Finalizado" className="hc-enc-row__status-icon hc-enc-row__status-icon--done" />
                    ) : (
                        <Time size={16} aria-label="En curso" className="hc-enc-row__status-icon hc-enc-row__status-icon--pending" />
                    )}
                </span>
                {reasonText && (
                    <span className="hc-enc-row__reason">{reasonText}</span>
                )}
                <span className="hc-enc-row__preview">{preview}</span>
            </span>
        </button>
    );
}

// ─── SpecialtyGroup ─────────────────────────────────────────────────────────────

function SpecialtyGroup({
    specialty,
    encounters,
    activeEncounterId,
    onSelectEncounter,
    defaultOpen = true,
}: {
    specialty: string;
    encounters: EncounterWithSpecialty[];
    activeEncounterId: string | null;
    onSelectEncounter: (id: string | null, enc: EncounterWithSpecialty | null) => void;
    defaultOpen?: boolean;
}) {
    const [historialOpen, setHistorialOpen] = useState(defaultOpen);
    const [documentsOpen, setDocumentsOpen] = useState(false);

    return (
        <div className="hc-spec-group" role="group" aria-label={`Especialidad: ${specialty}`}>
            {/* Specialty header — static label, not collapsible at this level */}
            <div className="hc-spec-group__header">
                <SpecialtyIcon specialty={specialty} />
                <span className="hc-spec-group__name">{specialty}</span>
                <Tag
                    type="cool-gray"
                    size="sm"
                    className="hc-spec-group__badge"
                    aria-label={`${encounters.length} encuentros`}
                >
                    {encounters.length}
                </Tag>
            </div>

            {/* Sub-menu: Historial */}
            <div className="hc-spec-submenu">
                <button
                    className="hc-spec-submenu__toggle"
                    aria-expanded={historialOpen}
                    onClick={() => setHistorialOpen(o => !o)}
                >
                    {historialOpen
                        ? <ChevronDown size={16} aria-hidden="true" />
                        : <ChevronRight size={16} aria-hidden="true" />
                    }
                    <DocumentMultiple_01 size={16} aria-hidden="true" />
                    <span>Historial</span>
                    <span className="hc-spec-submenu__count">{encounters.length}</span>
                </button>

                {historialOpen && (
                    <div className="hc-spec-submenu__body" role="listbox" aria-label={`Historial de ${specialty}`}>
                        {encounters.map(enc => (
                            <EncounterRow
                                key={enc.id}
                                enc={enc}
                                isActive={activeEncounterId === enc.id}
                                onClick={() => onSelectEncounter(enc.id, enc)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Sub-menu: Documentos (placeholder) */}
            <div className="hc-spec-submenu">
                <button
                    className="hc-spec-submenu__toggle"
                    aria-expanded={documentsOpen}
                    onClick={() => setDocumentsOpen(o => !o)}
                >
                    {documentsOpen
                        ? <ChevronDown size={16} aria-hidden="true" />
                        : <ChevronRight size={16} aria-hidden="true" />
                    }
                    <Folder size={16} aria-hidden="true" />
                    <span>Documentos</span>
                    <span className="hc-spec-submenu__count">0</span>
                </button>

                {documentsOpen && (
                    <div className="hc-spec-submenu__body hc-spec-submenu__body--empty" role="status">
                        <span className="hc-spec-submenu__empty-text">Sin documentos registrados</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Export ────────────────────────────────────────────────────────────────

export default function SpecialtySidebar({
    selectedPatient,
    encounters,
    isLoading,
    activeEncounterId,
    onSelectEncounter,
    onNewEncounter,
}: SpecialtySidebarProps) {
    // Group encounters by specialty
    const grouped = useMemo(() => {
        const map = new Map<string, EncounterWithSpecialty[]>();
        for (const enc of encounters) {
            const key = getSpecialtyLabel(enc.practitioner?.specialty);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(enc);
        }
        // Sort specialties alphabetically, but put "Medicina General" last
        return Array.from(map.entries()).sort(([a], [b]) => {
            if (a === 'Medicina General') return 1;
            if (b === 'Medicina General') return -1;
            return a.localeCompare(b, 'es');
        });
    }, [encounters]);

    return (
        <div className="hc-sidebar-inner" aria-label="Panel de especialidades">
            {/* Header */}
            <div className="hc-sidebar__header">
                <div className="hc-sidebar__badge-wrapper">
                    {encounters.length > 0 && (
                        <span className="hc-sidebar__badge" aria-label={`${encounters.length} encuentros totales`}>
                            {encounters.length}
                        </span>
                    )}
                </div>
                <Button
                    kind="ghost"
                    size="sm"
                    hasIconOnly
                    renderIcon={Add}
                    iconDescription="Nueva consulta"
                    tooltipAlignment="end"
                    onClick={onNewEncounter}
                    disabled={!selectedPatient}
                    aria-label="Nueva consulta"
                />
            </div>

            {/* Body */}
            <div className="hc-sidebar__body">
                {!selectedPatient ? (
                    <div className="hc-empty-state hc-empty-state--sm" role="status">
                        <Search size={32} aria-hidden="true" />
                        <p>Sin paciente seleccionado</p>
                    </div>
                ) : isLoading ? (
                    <div className="hc-sidebar__loading" aria-live="polite" aria-busy="true">
                        <Loading withOverlay={false} small description="Cargando historial..." />
                    </div>
                ) : encounters.length === 0 ? (
                    <div className="hc-empty-state hc-empty-state--sm" role="status">
                        <Chat size={32} aria-hidden="true" />
                        <p>Sin encuentros previos</p>
                    </div>
                ) : (
                    <div className="hc-spec-list">
                        {grouped.map(([specialty, encs], index) => (
                            <SpecialtyGroup
                                key={specialty}
                                specialty={specialty}
                                encounters={encs}
                                activeEncounterId={activeEncounterId}
                                onSelectEncounter={onSelectEncounter}
                                defaultOpen={index === 0}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
