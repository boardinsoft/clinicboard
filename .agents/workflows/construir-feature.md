---
description: Flujo de trabajo automatizado para desarrollar nuevas funcionalidades siguiendo la arquitectura de CI/CD orientada a entornos Cloud (Staging y Producción).
---

# Flujo de Desarrollo Cloud (Cloud-Only Workflow)

Este workflow está diseñado para trabajar directamente con entornos en la nube (Supabase y Vercel), evitando la dependencia de proxies o entornos locales pesados. Se enfoca en despliegues rápidos en ramas de Staging y Previsualización.

Al invocar `/construir-feature`, sigue estos pasos estrictamente:

## Paso 1: Gestión de Ramas y Git
1. Analiza el requerimiento solicitado.
2. Asegúrate de estar en `develop` y sincronizado (`git pull origin develop`).
3. Crea una rama `feature/<nombre-descriptivo>`.

## Paso 2: Cambios en el Esquema (Cloud Staging)
1. Si necesitas cambios en la DB, crea una migración: `npx supabase migration new <nombre>`.
2. Escribe el SQL en `supabase/migrations/`.
3. Informa al usuario: "Migración preparada. Se aplicará automáticamente al empujar a la rama de Staging en la nube".

## Paso 3: Desarrollo de la Funcionalidad
1. Modifica o crea archivos en `/src/` (Next.js, Server Actions, UI).
2. Sigue las guías de estilo estético (vibrante, premium).
3. Resuelve errores de linter en tiempo real.

## Paso 4: Despliegue y Pruebas en Cloud (Preview)
1. Haz commit de tus cambios: `feat: <descripción del cambio>`.
2. Empuja la rama al origen: `git push origin feature/<nombre>`.
3. Vercel generará automáticamente una **Preview URL**. 
4. Utiliza **TestSprite MCP** indicando la URL de previsualización de Vercel para ejecutar pruebas de QA directamente sobre el servidor en la nube.

## Paso 5: Promoción a Staging/Producción
1. Si las pruebas en la URL de preview son exitosas, notifica al usuario.
2. Crea el Pull Request hacia `develop` para que las GitHub Actions desplieguen en el entorno de Staging definitivo.
3. Finaliza con el resumen de la tarea.
