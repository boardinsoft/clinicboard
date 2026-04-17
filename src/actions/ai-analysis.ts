'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

interface AnalysisResponse {
  text: string
  error?: string
}

export async function analyzeWithDrClinica(userMessage: string): Promise<AnalysisResponse> {
  try {
    // 1. Verificar autenticación (temporarily disabled for debugging)
    // const supabase = await createServerSupabaseClient()
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    // if (authError || !user?.id) {
    //   return { text: '', error: 'No autenticado' }
    // }

    // 2. Validar mensaje
    if (!userMessage.trim()) {
      return { text: '', error: 'Mensaje vacío' }
    }

    // 3. Llamar a Hugging Face API
    const hfToken = process.env.HUGGING_FACE_API_KEY
    if (!hfToken) {
      return { text: '', error: 'Token de Hugging Face no configurado' }
    }

    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: buildPrompt(userMessage),
          parameters: {
            max_new_tokens: 512,
            temperature: 0.3,
            top_p: 0.9,
          },
        }),
      }
    )

    const responseText = await response.text()

    // Verificar si es HTML (error) en lugar de JSON
    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      console.error('HF returned HTML (model loading or error):', responseText.slice(0, 200))
      return {
        text: '',
        error: 'El modelo de Hugging Face está cargando (puede tardar 1-2 min). Verifica tu token en .env.local y reinicia el servidor.',
      }
    }

    if (!response.ok) {
      console.error('HF error response:', responseText)
      return {
        text: '',
        error: `Error ${response.status}: ${responseText.slice(0, 100)}`,
      }
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      console.error('JSON parse error:', responseText.slice(0, 200))
      return { text: '', error: 'Respuesta inválida de Hugging Face' }
    }

    // 4. Extraer texto de la respuesta
    const assistantText =
      result[0]?.generated_text || result.generated_text || ''

    if (!assistantText) {
      return { text: '', error: 'No se generó respuesta' }
    }

    // 5. Limpiar y retornar
    const cleanedText = cleanResponse(assistantText, userMessage)

    return { text: cleanedText }
  } catch (error) {
    console.error('AI analysis error:', error)
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Construye el prompt para el modelo especializado en medicina
 */
function buildPrompt(userMessage: string): string {
  return `Eres Dra. Clínica, un asistente especializado en análisis de historias clínicas.

Instrucciones:
- Proporciona respuestas médicamente precisas pero comprensibles
- Sé conciso y directo
- Si se trata de análisis clínico, estructura tu respuesta en: Hallazgos, Diagnósticos diferenciales, Recomendaciones
- Siempre haz un disclaimer: "Esta información es educativa, no reemplaza el juicio clínico"
- Responde en español

Consulta del médico:
${userMessage}

Respuesta:`
}

/**
 * Limpia la respuesta del modelo (remueve el prompt original)
 */
function cleanResponse(fullText: string, userMessage: string): string {
  // Busca dónde comienza la respuesta real (después del prompt)
  const parts = fullText.split('Respuesta:')

  if (parts.length > 1) {
    return parts[1].trim()
  }

  // Fallback: si no encuentra el separador, retorna el texto procesado
  return fullText
    .replace(userMessage, '')
    .trim()
    .substring(0, 2000) // Limita a 2000 caracteres
}
