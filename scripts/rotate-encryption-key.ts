/**
 * Script de Rotación de Clave de Encriptación
 *
 * Este script re-encripta todos los datos PHI existentes con una nueva clave.
 *
 * IMPORTANTE:
 * - Ejecutar en horario de bajo tráfico
 * - Crear backup de la base de datos ANTES de ejecutar
 * - Verificar que OLD_ENCRYPTION_KEY y NEW_ENCRYPTION_KEY están configuradas
 *
 * Uso:
 *
 * export OLD_ENCRYPTION_KEY="clave_actual_base64"
 * export NEW_ENCRYPTION_KEY="clave_nueva_base64"
 * npx tsx scripts/rotate-encryption-key.ts
 *
 * @ts-nocheck - Script de mantenimiento, tipos dinámicos necesarios
 */

import { createClient } from '@supabase/supabase-js';

const OLD_KEY = process.env.OLD_ENCRYPTION_KEY;
const NEW_KEY = process.env.NEW_ENCRYPTION_KEY;

// Configuración
const BATCH_SIZE = 100; // Procesar en lotes para mejor performance

interface TableConfig {
    table: string;
    fields: string[];
}

const TABLES_TO_ROTATE: TableConfig[] = [
    { table: 'patients', fields: ['encrypted_notes'] },
    // Agregar más tablas según se implementen campos encriptados:
    // { table: 'encounters', fields: ['subjective', 'objective', 'analysis', 'plan'] },
    // { table: 'encounter_addenda', fields: ['content'] },
];

/**
 * Valida que las variables de entorno requeridas estén configuradas
 */
function validateEnvironment(): void {
    if (!OLD_KEY) {
        throw new Error('OLD_ENCRYPTION_KEY no está configurada');
    }

    if (!NEW_KEY) {
        throw new Error('NEW_ENCRYPTION_KEY no está configurada');
    }

    if (OLD_KEY === NEW_KEY) {
        throw new Error('OLD_ENCRYPTION_KEY y NEW_ENCRYPTION_KEY deben ser diferentes');
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL no está configurada');
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada');
    }

    console.log('✅ Variables de entorno validadas');
}

/**
 * Desencripta usando la clave vieja
 */
async function decryptWithOldKey(ciphertext: string): Promise<string> {
    const original = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = OLD_KEY;

    try {
        const { decrypt } = await import('../src/lib/crypto/aes256');
        const result = await decrypt(ciphertext);
        return result;
    } finally {
        process.env.ENCRYPTION_KEY = original;
    }
}

/**
 * Encripta usando la clave nueva
 */
async function encryptWithNewKey(plaintext: string): Promise<string> {
    const original = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = NEW_KEY;

    try {
        const { encrypt } = await import('../src/lib/crypto/aes256');
        const result = await encrypt(plaintext);
        return result;
    } finally {
        process.env.ENCRYPTION_KEY = original;
    }
}

/**
 * Procesa un registro individual
 */
async function rotateRecord(
    supabase: ReturnType<typeof createClient>,
    tableConfig: TableConfig,
    record: any // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<{ success: boolean; error?: string }> {
    const updates: Record<string, string> = {};

    try {
        for (const field of tableConfig.fields) {
            const encryptedValue = record[field];

            // Saltar si el campo está vacío
            if (!encryptedValue || typeof encryptedValue !== 'string') {
                continue;
            }

            // Desencriptar con clave vieja
            const plaintext = await decryptWithOldKey(encryptedValue);

            // Encriptar con clave nueva
            const newEncrypted = await encryptWithNewKey(plaintext);

            updates[field] = newEncrypted;
        }

        // Si hay campos para actualizar
        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
                .from(tableConfig.table)
                .update(updates as never) // Type assertion para bypass strict typing de Supabase
                .eq('id', record.id as string);

            if (updateError) {
                return {
                    success: false,
                    error: `Error al actualizar: ${updateError.message}`,
                };
            }
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Procesa una tabla completa en lotes
 */
async function rotateTable(
    supabase: ReturnType<typeof createClient>,
    tableConfig: TableConfig
): Promise<void> {
    console.log(`\n📦 Procesando tabla: ${tableConfig.table}`);

    // Contar registros totales
    const { count } = await supabase
        .from(tableConfig.table)
        .select('*', { count: 'exact', head: true });

    console.log(`   Total de registros: ${count || 0}`);

    if (!count || count === 0) {
        console.log('   ⏭️  Tabla vacía, saltando...');
        return;
    }

    let processed = 0;
    let errors = 0;
    let offset = 0;

    while (offset < count) {
        // Obtener lote de registros
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: records, error: fetchError } = await supabase
            .from(tableConfig.table)
            .select(`id, ${tableConfig.fields.join(', ')}`)
            .range(offset, offset + BATCH_SIZE - 1) as any;

        if (fetchError) {
            console.error(`   ❌ Error al leer lote (offset ${offset}):`, fetchError);
            break;
        }

        if (!records || records.length === 0) {
            break;
        }

        // Procesar cada registro del lote
        for (const record of records) {
            const result = await rotateRecord(supabase, tableConfig, record);

            if (result.success) {
                processed++;
                process.stdout.write(`\r   Progreso: ${processed}/${count} (${Math.round((processed / count) * 100)}%)`);
            } else {
                errors++;
                console.error(`\n   ⚠️  Error en registro ${record.id}: ${result.error}`);
            }
        }

        offset += BATCH_SIZE;
    }

    console.log(`\n   ✅ Completado: ${processed} exitosos, ${errors} errores`);
}

/**
 * Función principal
 */
async function main(): Promise<void> {
    console.log('🔄 Iniciando rotación de clave de encriptación...\n');

    // Validar configuración
    validateEnvironment();

    // Crear cliente de Supabase con service role (bypass RLS)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('\n⚠️  ADVERTENCIA: Este proceso modificará datos en la base de datos.');
    console.log('⚠️  Asegúrate de haber creado un backup antes de continuar.\n');

    // En producción, agregar confirmación interactiva aquí
    if (process.env.NODE_ENV === 'production') {
        console.log('❌ Este script requiere confirmación manual en producción.');
        console.log('   Edita el script y elimina esta validación para continuar.');
        process.exit(1);
    }

    const startTime = Date.now();

    // Procesar cada tabla
    for (const tableConfig of TABLES_TO_ROTATE) {
        await rotateTable(supabase, tableConfig);
    }

    const endTime = Date.now();
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Rotación completada en ${durationSeconds}s`);
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Verificar datos en Supabase Dashboard');
    console.log('   2. Actualizar ENCRYPTION_KEY en Vercel con la nueva clave');
    console.log('   3. Re-deploy de la aplicación');
    console.log('   4. Verificar que la app puede leer datos correctamente');
    console.log('   5. Documentar la rotación en ENCRYPTION_KEYS_SETUP.md\n');
}

// Ejecutar
main().catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
});
