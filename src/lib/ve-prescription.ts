export const PRESCRIPTION_COLORS = {
    white: '#FFFFFF',
    green: '#F0FDF4',
    purple: '#FAF5FF',
    yellow: '#FEFCE8',
} as const;

export type PrescriptionColor = keyof typeof PRESCRIPTION_COLORS;

export const PRESCRIPTION_VALIDITY = {
    common: 30,
    antibiotic: 7,
    controlled: 0,
} as const;

const ANTIBIOTIC_PATTERN = /\b(amoxicilina|azitromicina|ciprofloxacina|metronidazol|ceftriaxona|penicilina|doxiciclina|claritromicina|levofloxacina|cefuroxima|cefepime|vancomicina|gentamicina|ampicilina|clindamicina|linezolid|daptomicina|meropenem|imipenem|ertapenem|trimetoprim|sulfametoxazol|nitrofurantoina|rifampicina|isoniazida|pirazinamida|etambutol|tigeciclina|polimixina|teicoplanina)\b/i;

const CONTROLLED_PATTERN = /\b(diazepam|lorazepam|alprazolam|clonazepam|midazolam|morfina|codeina|tramadol|fentanilo|metadona|fenobarbital|carbamazepina|oxicodona|hidromorfona|buprenorfina|tapentadol|risperidona|olanzapina|quetiapina|haloperidol|clorpromazina|levomepromazina|zuclopentixol|aripiprazol|clozapina|anfetamina|metilfenidato|modafinilo|ketamina)\b/i;

export function getPrescriptionColor(
    medicationCode: string,
    medicationDisplay: string
): PrescriptionColor {
    const text = `${medicationCode || ''} ${medicationDisplay || ''}`;
    if (CONTROLLED_PATTERN.test(text)) return 'purple';
    if (ANTIBIOTIC_PATTERN.test(text)) return 'green';
    return 'white';
}

export interface DosageItem {
    dose: string;
    frequency: string;
    route: string;
    duration: string;
    indications: string;
}

export function parseDosageInstruction(dosage: unknown): DosageItem {
    const empty: DosageItem = { dose: '', frequency: '', route: '', duration: '', indications: '' };
    if (!dosage) return empty;
    const arr = Array.isArray(dosage) ? dosage.map(d => String(d)) : [];
    if (arr.length === 0) return empty;

    const get = (prefix: string) =>
        arr.find(s => s.startsWith(prefix))?.replace(prefix, '') || '';

    return {
        dose: get('500mg') || get('250mg') || get('100mg') || arr[0] || '',
        frequency: get('Cada ') || get('q') || '',
        route: get('Vía: ') || '',
        duration: get('Duración: ') || '',
        indications: arr.find(s => s.startsWith('Indicaciones: '))?.replace('Indicaciones: ', '') || '',
    };
}

export function extractConcentration(medicationDisplay: string): string {
    const match = medicationDisplay.match(/(\d+\s*(?:mg|g|mcg|ui|ml))/i);
    return match ? match[1] : '';
}

export function extractPharmaceuticalForm(medicationDisplay: string): string {
    const lower = medicationDisplay.toLowerCase();
    const forms = ['tabletas', 'tab', 'capsulas', 'cap', 'jarabe', 'suspension', 'inyectable', 'ampolla', 'crema', 'gel', 'gotas', 'solucion', 'polvo', 'comprimido'];
    for (const form of forms) {
        if (lower.includes(form)) return form;
    }
    return '';
}

export interface PrescriptionForPrint {
    id: string;
    medication_code: string;
    medication_display: string;
    dosage_instruction: unknown;
    note: string | null;
    status: string | null;
    authored_on: string | null;
    valid_until: string | null;
    fhir_id: string | null;
    prescription_number: string | null;
    printed_count: number | null;
    patient?: {
        id: string;
        name_given: string[];
        name_family: string;
        birth_date: string | null;
        national_id: string | null;
    } | null;
    prescriber?: {
        id: string;
        name_given: string[];
        name_family: string;
        specialty: string | null;
        license_number: string | null;
        national_id: string | null;
        mpps_registration_number: string | null;
        university: string | null;
    } | null;
    clinic?: {
        id: string;
        name: string;
        rif: string | null;
        address: string | null;
        phone: string | null;
    } | null;
}

export interface PrintValidationError {
    field: string;
    message: string;
}

export function validatePrescriptionForPrint(
    prescription: PrescriptionForPrint
): PrintValidationError[] {
    const errors: PrintValidationError[] = [];

    if (!prescription.prescriber?.national_id) {
        errors.push({ field: 'prescriber.national_id', message: 'Falta la cédula del médico' });
    }
    if (!prescription.prescriber?.mpps_registration_number) {
        errors.push({ field: 'prescriber.mpps_registration_number', message: 'Falta el registro MPPS del médico' });
    }
    if (!prescription.prescriber?.university) {
        errors.push({ field: 'prescriber.university', message: 'Falta la universidad del médico' });
    }
    if (!prescription.patient?.national_id) {
        errors.push({ field: 'patient.national_id', message: 'Falta la cédula del paciente' });
    }
    if (!prescription.clinic?.rif) {
        errors.push({ field: 'clinic.rif', message: 'Falta el RIF de la clínica' });
    }
    if (!prescription.clinic?.address) {
        errors.push({ field: 'clinic.address', message: 'Falta la dirección de la clínica' });
    }
    if (prescription.status === 'cancelled') {
        errors.push({ field: 'status', message: 'Esta receta está cancelada y no puede imprimirse' });
    }
    if (prescription.valid_until) {
        const validUntil = new Date(prescription.valid_until);
        if (!isNaN(validUntil.getTime()) && validUntil < new Date()) {
            errors.push({ field: 'valid_until', message: 'Esta receta ha expirado' });
        }
    }

    return errors;
}