import type { Patient, Condition, AllergyIntolerance, EncounterWithClinicalNote } from '@/types/database.types';
import { calcAge, getGenderLabel } from '@/lib/clinical';
import { formatDate } from '@/lib/clinical';

export function buildPatientContext(
  patient: Patient,
  conditions: Condition[],
  allergies: AllergyIntolerance[],
  recentEncounters: EncounterWithClinicalNote[]
): string {
  const name = `${patient.name_given?.join(' ')} ${patient.name_family}`.trim();
  const age = calcAge(patient.birth_date);
  const gender = getGenderLabel(patient.gender);

  const activeConditions = conditions
    .filter(c => c.clinical_status === 'active')
    .map(c => c.code_display)
    .filter(Boolean)
    .join(', ') || 'ninguna';

  const allergyList = allergies
    .map(a => a.code_display)
    .filter(Boolean)
    .join(', ') || 'sin alergias conocidas';

  const lastEnc = recentEncounters[0];
  const lastVisit = lastEnc
    ? `${formatDate(lastEnc.start_time)} — ${lastEnc.clinical_note?.reason_code ?? 'sin motivo registrado'}`
    : 'sin consultas registradas';

  return `Paciente: ${name}, ${age} años, ${gender}.
Condiciones activas: ${activeConditions}.
Alergias: ${allergyList}.
Última consulta: ${lastVisit}.`;
}
