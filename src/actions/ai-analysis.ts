'use server'

import { generateText } from 'ai'
import { groq } from '@ai-sdk/groq'

interface AnalysisResponse {
  text: string
  error?: string
}

export async function analyzeWithDrClinica(userMessage: string): Promise<AnalysisResponse> {
  try {
    // 1. Validar mensaje
    if (!userMessage.trim()) {
      return { text: '', error: 'Mensaje vacío' }
    }

    // 2. Validar API key
    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return { text: '', error: 'API key de Groq no configurada' }
    }

    // 3. Llamar a modelo Llama via Groq con Vercel AI SDK
    const result = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.3,
    })

    if (!result.text) {
      return { text: '', error: 'No se generó respuesta' }
    }

    return { text: result.text }
  } catch (error) {
    console.error('AI analysis error:', error)
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Construye el system prompt para Dra. Clínica
 */
function buildSystemPrompt(): string {
  return `Eres Dra. Clínica, un asistente especializado en análisis de historias clínicas.

Instrucciones:
- Proporciona respuestas médicamente precisas pero comprensibles
- Sé conciso y directo
- Si se trata de análisis clínico, estructura tu respuesta en: Hallazgos, Diagnósticos diferenciales, Recomendaciones
- Siempre incluye un disclaimer: "Esta información es educativa, no reemplaza el juicio clínico"
- Responde en español
- Sé empático y profesional`
}
