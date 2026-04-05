# Política de Seguridad — Clinicboard

## Resumen

Clinicboard es una aplicación de gestión clínica que maneja datos sensibles de salud (PHI - Protected Health Information). La seguridad es nuestra máxima prioridad.

## Medidas de Seguridad Implementadas

### 🔐 Autenticación y Autorización
- **Supabase Auth**: Autenticación robusta con hash bcrypt
- **Multi-tenancy**: Aislamiento estricto de datos por `practitioner_id`
- **Row Level Security (RLS)**: Políticas activas en todas las tablas
- **Session Timeout**: Logout automático tras 10 minutos de inactividad
- **Proxy Edge Middleware**: Verificación de sesión en cada request

### 🛡️ Protección contra Ataques
- **Rate Limiting**:
  - Login: 5 intentos / 15 minutos por IP
  - API: 60 requests / minuto por usuario autenticado
- **CSP (Content Security Policy)**: Headers estrictos contra XSS
- **HSTS**: Strict Transport Security habilitado
- **X-Frame-Options**: Protección contra clickjacking
- **Input Sanitization**: Validación Zod en todas las operaciones

### 🔒 Encriptación de Datos
- **AES-256-GCM**: Encriptación de datos PHI en reposo
- **Campos encriptados**:
  - Notas clínicas (SOAP)
  - Diagnósticos sensibles
  - Historial médico
  - Notas de pacientes
- **TLS 1.3**: Encriptación en tránsito (Vercel/Supabase)

### 📊 Auditoría y Logging
- **Audit Logs**: Registro de cambios de estado (Appointments, Encounters)
- **Security Logger**: Logging estructurado sin exponer PHI
- **Trigger-based Auditing**: Triggers SQL para rastrear modificaciones
- **Immutable Addenda**: Notas adicionales no editables para encuentros finalizados

### 🚨 Manejo de Errores
- **Error Handler Centralizado**: Sin exposición de stack traces en producción
- **Mensajes Sanitizados**: Errores amigables al usuario sin filtrar información interna
- **Fail-Safe**: Rate limiter en modo fail-open si Redis falla

## Variables de Entorno Sensibles

**NUNCA** commits estas variables al repositorio:

```bash
ENCRYPTION_KEY              # Clave maestra AES-256
SUPABASE_SERVICE_ROLE_KEY   # Bypass RLS - SOLO servidor
UPSTASH_REDIS_REST_TOKEN    # Token de Redis
SUPABASE_DB_PASSWORD        # Contraseña de base de datos
```

### Generación Segura de Claves

```bash
# ENCRYPTION_KEY (32 bytes base64)
openssl rand -base64 32

# Verificar entropy
openssl rand -base64 32 | wc -c  # Debe ser ~44 caracteres
```

## Reporting de Vulnerabilidades

Si descubres una vulnerabilidad de seguridad:

1. **NO** abras un Issue público en GitHub
2. Envía un email a: security@clinicboard.com (o contacto del equipo)
3. Incluye:
   - Descripción detallada
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencias de mitigación (opcional)

**Tiempo de respuesta**: 48 horas hábiles

## Checklist de Seguridad Pre-Deployment

Antes de cada deploy a producción, verificar:

- [ ] Todas las variables de entorno están configuradas en Vercel
- [ ] RLS está habilitado en todas las tablas de Supabase
- [ ] Rate limiting está funcionando (test con 6+ intentos de login)
- [ ] Session timeout configurado correctamente (10 min)
- [ ] CSP headers no generan errores en consola del navegador
- [ ] Logs de seguridad están siendo capturados
- [ ] Upstash Redis está conectado y respondiendo
- [ ] npm audit no muestra vulnerabilidades críticas
- [ ] Backup de base de datos está configurado (Supabase auto-backup)

## Cumplimiento y Estándares

### FHIR R4
- Modelo de datos basado en FHIR R4
- Transiciones de estado validadas según especificación
- Identificadores únicos `fhir_id` para interoperabilidad

### Buenas Prácticas HIPAA-Style
Aunque no estamos certificados HIPAA (aplica solo en EE.UU.), seguimos prácticas similares:

- Encriptación en reposo y en tránsito
- Auditoría de accesos
- Control de autenticación
- Backup y disaster recovery
- Mínimo acceso necesario (principle of least privilege)

## Dependencias de Seguridad

### Actualizaciones
Ejecutar semanalmente:

```bash
npm audit
npm audit fix
```

### Dependencias Críticas
- `@supabase/ssr`: Manejo seguro de sesiones
- `@upstash/redis`: Rate limiting distribuido
- `zod`: Validación de inputs
- `next`: Framework con security headers built-in

## Responsabilidades del Equipo

### Desarrolladores
- Usar `withErrorHandling` en todas las Server Actions
- Validar inputs con Zod antes de procesar
- No loguear PHI ni tokens en consola
- Revisar permisos RLS antes de nueva tabla

### DevOps
- Rotar secrets cada 90 días
- Monitorear logs de seguridad
- Configurar alertas de rate limiting
- Verificar backups semanalmente

### QA
- Probar rate limiting en cada release
- Verificar session timeout
- Intentar XSS/SQL injection en forms
- Validar que errores no expongan stack traces

## Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [FHIR R4 Security](https://www.hl7.org/fhir/security.html)

---

**Última actualización**: 2026-04-05
**Versión**: 1.0.0
**Responsable**: Equipo de Seguridad Clinicboard
