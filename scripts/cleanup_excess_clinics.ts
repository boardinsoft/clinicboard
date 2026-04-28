/**
 * Script para identificar y-archivar clínicas excedentes
 * Un practitioner puede tener máximo 2 clínicas activas
 * Este script:
 * 1. Identifica practitioners con más de 2 clínicas activas
 * 2. Muestra cuáles serían afectadas
 * 3. Opcionalmente las marca como inactivas
 *
 * Uso: npx tsx scripts/cleanup_excess_clinics.ts [--dry-run|--execute]
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ExcessClinic {
  practitioner_id: string;
  practitioner_name: string;
  clinic_id: string;
  clinic_name: string;
  active: boolean;
  created_at: string;
  excess_count: number;
}

async function findExcessClinics(): Promise<ExcessClinic[]> {
  const results: ExcessClinic[] = [];

  // Find all practitioners with more than 2 active clinics
  const { data: excessRecords, error } = await supabase
    .from('clinic_practitioners')
    .select(`
      practitioner_id,
      clinic_id,
      active,
      created_at,
      clinics!inner(name),
      practitioners!inner(name_given, name_family)
    `)
    .eq('active', true);

  if (error) {
    console.error('Error fetching clinic_practitioners:', error);
    return [];
  }

  // Group by practitioner and find excess
  const grouped = new Map<string, any[]>();
  for (const record of excessRecords || []) {
    const list = grouped.get(record.practitioner_id) || [];
    list.push(record);
    grouped.set(record.practitioner_id, list);
  }

  for (const [practitionerId, records] of grouped.entries()) {
    if (records.length > 2) {
      const practitionerName = `${records[0].practitioners?.name_given?.[0] || ''} ${records[0].practitioners?.name_family || ''}`.trim();

      // Mark extra records as excess (keep 2, mark others)
      for (let i = 2; i < records.length; i++) {
        results.push({
          practitioner_id: practitionerId,
          practitioner_name: practitionerName,
          clinic_id: records[i].clinic_id,
          clinic_name: records[i].clinics?.name || 'Unknown',
          active: records[i].active,
          created_at: records[i].created_at,
          excess_count: records.length - 2,
        });
      }
    }
  }

  return results;
}

async function archiveExcessClinics(clinics: ExcessClinic[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const clinic of clinics) {
    const { error } = await supabase
      .from('clinic_practitioners')
      .update({ active: false })
      .eq('practitioner_id', clinic.practitioner_id)
      .eq('clinic_id', clinic.clinic_id);

    if (error) {
      console.error(`Failed to archive clinic ${clinic.clinic_id} for practitioner ${clinic.practitioner_id}:`, error);
      failed++;
    } else {
      success++;
    }
  }

  return { success, failed };
}

async function main() {
  const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';

  console.log('\n=== ClinicBoard: Cleanup Excess Clinics ===\n');
  console.log(`Mode: ${mode === 'execute' ? 'EXECUTE (will archive)' : 'DRY-RUN (no changes)'}\n`);

  console.log('Finding practitioners with more than 2 active clinics...\n');

  const excessClinics = await findExcessClinics();

  if (excessClinics.length === 0) {
    console.log('✓ No excess clinics found. All practitioners have 2 or fewer active clinics.');
    return;
  }

  // Group by practitioner for display
  const byPractitioner = new Map<string, ExcessClinic[]>();
  for (const clinic of excessClinics) {
    const list = byPractitioner.get(clinic.practitioner_id) || [];
    list.push(clinic);
    byPractitioner.set(clinic.practitioner_id, list);
  }

  console.log(`Found ${excessClinics.length} excess clinic membership(s) from ${byPractitioner.size} practitioner(s):\n`);

  for (const [practitionerId, clinics] of byPractitioner.entries()) {
    console.log(`  Practitioner: ${clinics[0].practitioner_name} (${practitionerId})`);
    console.log(`  Excess: ${clinics[0].excess_count} clinic(s):`);
    for (const clinic of clinics) {
      console.log(`    - ${clinic.clinic_name} (${clinic.clinic_id})`);
    }
    console.log();
  }

  if (mode === 'dry-run') {
    console.log('Run with --execute to archive these excess clinic memberships.\n');
  } else {
    console.log('Archiving excess clinic memberships...');
    const { success, failed } = await archiveExcessClinics(excessClinics);
    console.log(`\nArchive complete: ${success} archived, ${failed} failed.`);
  }
}

main().catch(console.error);