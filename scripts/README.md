# Scripts de Utilidad - Clinicboard

Colección de scripts para mantenimiento y operaciones de seguridad.

---

## 🔑 Generación de Claves de Encriptación

### `generate-encryption-key.sh`

Genera claves de encriptación AES-256 criptográficamente seguras.

**Uso básico**:
```bash
./scripts/generate-encryption-key.sh
```

**Generar múltiples claves**:
```bash
./scripts/generate-encryption-key.sh 3
```

**Características**:
- Usa OpenSSL CSPRNG
- 32 bytes (256 bits) de entropía
- Output en Base64
- Validación automática de longitud
- Instrucciones integradas

**Cuándo usar**:
- Setup inicial de entornos (Staging/Producción)
- Rotación periódica de claves
- Recuperación ante compromiso de clave

---

## 🔄 Rotación de Claves de Encriptación

### `rotate-encryption-key.ts`

Re-encripta todos los datos PHI existentes con una nueva clave.

**Pre-requisitos**:
1. Crear backup de la base de datos
2. Generar nueva clave con `generate-encryption-key.sh`
3. Configurar variables de entorno

**Configuración**:
```bash
export OLD_ENCRYPTION_KEY="clave_actual_en_vercel"
export NEW_ENCRYPTION_KEY="clave_nueva_generada"
export NEXT_PUBLIC_SUPABASE_URL="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
```

**Ejecución**:
```bash
npx tsx scripts/rotate-encryption-key.ts
```

**Proceso**:
1. Valida variables de entorno
2. Lee registros con datos encriptados
3. Desencripta con clave vieja
4. Encripta con clave nueva
5. Actualiza base de datos
6. Reporta progreso y errores

**Tablas procesadas**:
- `patients.encrypted_notes`
- (Agregar más según se implementen)

**Características**:
- Procesamiento en lotes (100 registros/lote)
- Manejo de errores granular
- Progreso en tiempo real
- Validación de seguridad

**Post-rotación**:
1. Verificar datos en Supabase Dashboard
2. Actualizar `ENCRYPTION_KEY` en Vercel
3. Re-deploy de la aplicación
4. Probar lectura de datos PHI
5. Documentar en `ENCRYPTION_KEYS_SETUP.md`

---

## 📅 Calendario de Mantenimiento

### Rotación de Claves

**Staging**:
- Frecuencia: Cada 6 meses
- Próxima: 2026-10-05

**Producción**:
- Frecuencia: Cada 3 meses
- Próxima: 2026-07-05

### Auditoría de Seguridad

**Mensual**:
```bash
npm audit
npm audit fix
```

**Trimestral**:
- Revisar logs de acceso en Supabase
- Verificar rate limiting en Upstash
- Probar session timeout
- Revisar CSP headers

---

## 🛠️ Desarrollo de Nuevos Scripts

Al crear un nuevo script:

1. **Ubicación**: `/scripts/`
2. **Naming**: Usar kebab-case (`mi-script.ts` o `mi-script.sh`)
3. **Permisos**: Hacer ejecutables los `.sh`: `chmod +x`
4. **Documentación**: Agregar sección a este README
5. **Seguridad**: Nunca hardcodear secretos

**Template de script TypeScript**:

```typescript
/**
 * Nombre del Script
 *
 * Descripción breve de lo que hace.
 *
 * Uso:
 * export VAR1="valor"
 * npx tsx scripts/mi-script.ts
 */

import { createClient } from '@supabase/supabase-js';

async function main(): Promise<void> {
    console.log('🚀 Iniciando script...\n');

    // Validar environment
    if (!process.env.REQUIRED_VAR) {
        throw new Error('REQUIRED_VAR no está configurada');
    }

    // Lógica del script
    try {
        // ...
        console.log('\n✅ Script completado');
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

main().catch(console.error);
```

**Template de script Bash**:

```bash
#!/bin/bash
set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}🚀 Iniciando script...${NC}"

# Validar prerequisitos
if ! command -v required-tool &> /dev/null; then
    echo -e "${RED}❌ Error: required-tool no está instalado${NC}"
    exit 1
fi

# Lógica del script
# ...

echo -e "${GREEN}✅ Script completado${NC}"
```

---

## ⚠️ Consideraciones de Seguridad

- **NUNCA** hardcodear claves o secretos en los scripts
- **SIEMPRE** validar variables de entorno al inicio
- **CREAR** backup antes de operaciones destructivas
- **LOGUEAR** operaciones para auditoría
- **MANEJAR** errores de forma segura (sin exponer secretos)

---

## 📞 Soporte

Si encuentras problemas con algún script:

1. Revisar logs del script
2. Verificar variables de entorno
3. Consultar documentación en `SECURITY.md`
4. Contactar al equipo de DevOps

---

**Última actualización**: 2026-04-05
