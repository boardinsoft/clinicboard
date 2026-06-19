import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import {
    PRESCRIPTION_COLORS,
    type PrescriptionForPrint,
    parseDosageInstruction,
    extractConcentration,
    extractPharmaceuticalForm,
    getPrescriptionColor,
} from '@/lib/ve-prescription';

const styles = StyleSheet.create({
    page: {
        paddingTop: 36,
        paddingBottom: 60,
        paddingHorizontal: 48,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#1a1a1a',
    },
    rxIconBox: {
        width: 64,
        height: 64,
        backgroundColor: '#E0E7FF',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rxIconText: {
        fontSize: 32,
        fontFamily: 'Helvetica-Bold',
        color: '#3730A3',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
    },
    headerInfo: {
        flex: 1,
    },
    clinicName: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 2,
        color: '#111827',
    },
    clinicMeta: {
        fontSize: 8,
        color: '#4b5563',
        marginBottom: 1,
    },
    prescriberName: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 2,
    },
    prescriberMeta: {
        fontSize: 8,
        color: '#374151',
        marginBottom: 1,
    },
    patientBlock: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 14,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
    },
    patientField: {
        width: '50%',
        marginBottom: 3,
    },
    fieldLabel: {
        fontSize: 7,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    fieldValue: {
        fontSize: 10,
        color: '#111827',
    },
    rpTitle: {
        fontSize: 26,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginVertical: 14,
        color: '#111827',
        letterSpacing: 1,
    },
    medicationBlock: {
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    medicationName: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
    },
    medicationLine: {
        fontSize: 9,
        color: '#374151',
        marginBottom: 1,
        lineHeight: 1.4,
    },
    sectionTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
        marginTop: 10,
        color: '#111827',
    },
    sectionText: {
        fontSize: 9,
        color: '#374151',
        lineHeight: 1.5,
    },
    notesBox: {
        backgroundColor: '#FFFBEB',
        padding: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FDE68A',
        marginTop: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 48,
        right: 48,
        borderTopWidth: 1,
        borderTopColor: '#d1d5db',
        paddingTop: 10,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    footerLabel: {
        fontSize: 7,
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    footerValue: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
    },
    signatureLine: {
        marginTop: 20,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#9ca3af',
        width: 200,
        alignSelf: 'center',
        textAlign: 'center',
        fontSize: 8,
        color: '#6b7280',
    },
    legalNotice: {
        fontSize: 7,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 6,
        fontStyle: 'italic',
    },
});

function calculateAge(birthDate: string | null): string {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} años`;
}

function formatDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

interface PrescriptionPDFDocumentProps {
    prescription: PrescriptionForPrint;
}

export default function PrescriptionPDFDocument({ prescription }: PrescriptionPDFDocumentProps) {
    const color = getPrescriptionColor(
        prescription.medication_code,
        prescription.medication_display
    );
    const dosage = parseDosageInstruction(prescription.dosage_instruction);
    const concentration = extractConcentration(prescription.medication_display);
    const pharmaceuticalForm = extractPharmaceuticalForm(prescription.medication_display);
    const patientName = prescription.patient
        ? `${prescription.patient.name_family}, ${(prescription.patient.name_given || []).join(' ')}`
        : '';
    const prescriberName = prescription.prescriber
        ? `${prescription.prescriber.name_family}, ${(prescription.prescriber.name_given || []).join(' ')}`
        : '';
    const patientAge = calculateAge(prescription.patient?.birth_date ?? null);

    return (
        <Document
            title={`Receta ${prescription.fhir_id || prescription.id}`}
            author={prescriberName}
            subject="Receta médica"
        >
            <Page
                size="A4"
                style={[styles.page, { backgroundColor: PRESCRIPTION_COLORS[color] }]}
            >
                {/* Header: Rx icon + clínica + médico */}
                <View style={styles.header}>
                    <View style={styles.rxIconBox}>
                        <Text style={styles.rxIconText}>Rx</Text>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.clinicName}>
                            {prescription.clinic?.name || 'Clínica'}
                        </Text>
                        {prescription.clinic?.rif && (
                            <Text style={styles.clinicMeta}>RIF: {prescription.clinic.rif}</Text>
                        )}
                        {prescription.clinic?.address && (
                            <Text style={styles.clinicMeta}>{prescription.clinic.address}</Text>
                        )}
                        {prescription.clinic?.phone && (
                            <Text style={styles.clinicMeta}>Tel: {prescription.clinic.phone}</Text>
                        )}
                        <View style={{ marginTop: 6 }} />
                        <Text style={styles.prescriberName}>Dr. {prescriberName}</Text>
                        {prescription.prescriber?.national_id && (
                            <Text style={styles.prescriberMeta}>
                                Cédula: {prescription.prescriber.national_id}
                            </Text>
                        )}
                        {prescription.prescriber?.mpps_registration_number && (
                            <Text style={styles.prescriberMeta}>
                                Reg. MPPS: {prescription.prescriber.mpps_registration_number}
                            </Text>
                        )}
                        {prescription.prescriber?.specialty && (
                            <Text style={styles.prescriberMeta}>
                                Especialidad: {prescription.prescriber.specialty}
                            </Text>
                        )}
                        {prescription.prescriber?.university && (
                            <Text style={styles.prescriberMeta}>
                                Universidad: {prescription.prescriber.university}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Paciente */}
                <View style={styles.patientBlock}>
                    <View style={styles.patientField}>
                        <Text style={styles.fieldLabel}>Paciente</Text>
                        <Text style={styles.fieldValue}>{patientName}</Text>
                    </View>
                    <View style={styles.patientField}>
                        <Text style={styles.fieldLabel}>Cédula</Text>
                        <Text style={styles.fieldValue}>
                            {prescription.patient?.national_id || ''}
                        </Text>
                    </View>
                    <View style={styles.patientField}>
                        <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
                        <Text style={styles.fieldValue}>
                            {formatDate(prescription.patient?.birth_date ?? null)} {patientAge && `(${patientAge})`}
                        </Text>
                    </View>
                    <View style={styles.patientField}>
                        <Text style={styles.fieldLabel}>Fecha de emisión</Text>
                        <Text style={styles.fieldValue}>
                            {formatDate(prescription.authored_on)}
                        </Text>
                    </View>
                </View>

                {/* Rp/ */}
                <Text style={styles.rpTitle}>Rp/</Text>

                {/* Medicamento */}
                <View style={styles.medicationBlock}>
                    <Text style={styles.medicationName}>
                        {prescription.medication_display} {concentration && `(${concentration})`}
                    </Text>
                    {pharmaceuticalForm && (
                        <Text style={styles.medicationLine}>
                            Forma farmacéutica: {pharmaceuticalForm}
                        </Text>
                    )}
                    {dosage.dose && (
                        <Text style={styles.medicationLine}>Dosis: {dosage.dose}</Text>
                    )}
                    {dosage.frequency && (
                        <Text style={styles.medicationLine}>Frecuencia: {dosage.frequency}</Text>
                    )}
                    {dosage.route && (
                        <Text style={styles.medicationLine}>Vía de administración: {dosage.route}</Text>
                    )}
                    {dosage.duration && (
                        <Text style={styles.medicationLine}>Duración: {dosage.duration}</Text>
                    )}
                </View>

                {/* Indicaciones al paciente */}
                {dosage.indications && (
                    <>
                        <Text style={styles.sectionTitle}>Indicaciones al paciente</Text>
                        <Text style={styles.sectionText}>{dosage.indications}</Text>
                    </>
                )}

                {/* Advertencias al farmacéutico */}
                {prescription.note && (
                    <>
                        <Text style={styles.sectionTitle}>Advertencias al farmacéutico</Text>
                        <View style={styles.notesBox}>
                            <Text style={styles.sectionText}>{prescription.note}</Text>
                        </View>
                    </>
                )}

                {/* Footer: fechas + firma */}
                <View style={styles.footer} fixed>
                    <View style={styles.footerRow}>
                        <View>
                            <Text style={styles.footerLabel}>Fecha de emisión</Text>
                            <Text style={styles.footerValue}>
                                {formatDate(prescription.authored_on)}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.footerLabel}>Fecha de expiración</Text>
                            <Text style={styles.footerValue}>
                                {formatDate(prescription.valid_until)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.signatureLine}>
                        <Text>Firma y sello: Dr. {prescriberName}</Text>
                    </View>
                    <Text style={styles.legalNotice}>
                        Receta emitida conforme a la Gaceta Oficial N° 40.131 - MPPS Venezuela
                    </Text>
                </View>
            </Page>
        </Document>
    );
}