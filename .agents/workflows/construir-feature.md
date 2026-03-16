---
description: Flujo de trabajo automatizado para desarrollar nuevas funcionalidades siguiendo la arquitectura de CI/CD local, staging y producción.
---

# Flujo de Desarrollo (CI/CD Feature Workflow)

Cuando el usuario pida desarrollar una nueva funcionalidad o invocar este workflow (`/construir-feature`), debes actuar como desarrollador y seguir **estrictamente** los siguientes pasos en orden.

## Paso 1: Preparación del Entorno (Ramas)
1. Analiza qué funcionalidad se te ha pedido desarrollar.
2. Comprueba la rama actual. Asegúrate de iniciar siempre partiendo de la rama `develop` asegurándote que esté actualizada (`git pull origin develop`).
3. Crea y cámbiate a una nueva rama de trabajo llamada `feature/<nombre-descriptivo-corto>`.

## Paso 2: Cambios de Base de Datos (Supabase Local)
1. Si la funcionalidad solicitada requiere cambios o nuevas tablas en la base de datos, debes ejecutar el CLI de Supabase para generar una migración: `npx supabase migration new <nombre-migracion>`.
2. Escribe el SQL necesario y pertinente dentro de la carpeta `supabase/migrations/`.
3. Informa al usuario o verifica el entorno local para aplicar esta migración de prueba sin afectar la base de datos real.

## Paso 3: Desarrollo
1. Identifica qué archivos de `/src/` (Componentes, Acciones, Rutas) debes alterar o crear para satisfacer el requerimiento en Next.js.
2. Escribe el código necesario siguiendo las directrices estéticas y técnicas establecidas para "clinicboard".
3. Valida y corrige cualquier error del linter.

## Paso 4: Pruebas Automáticas (QA)
1. Utiliza las integraciones de prueba, como **TestSprite MCP**, para instruir a la creación y ejecución de tests correspondientes para tu nuevo código, validando los flujos críticos.

## Paso 5: Commit y Preparar Despliegue (Staging)
1. Asegúrate de añadir los archivos con git usando `git add .` (O de forma granular si es adecuado).
2. Haz el commit utilizando un estilo descriptivo tipo *conventional commits*. Por ejemplo: `feat: Añadir [<nueva función>]`.
3. Detente aquí y notifica al usuario: "He terminado en local y probado el nuevo código. La rama `feature/<nombre>` está lista para que le hagas un Pull Request hacia `develop`."
