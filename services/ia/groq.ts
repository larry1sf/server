
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

export const serviceGroq = async ({ messages = [] }: {
  messages?: Array<{ role: string, content: string }>
} = {}): Promise<string> => {
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const { text } = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemMessage,
    prompt: conversationMessages.map(m => m.content).join('\n'),
  })
  return text
}

export const generateTitle = async (message: string): Promise<string> => {
  const { text } = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    system: "Eres un generador de títulos altamente conciso. Crea un título de máximo 4-5 palabras que resuma el mensaje del usuario de forma descriptiva. No uses comillas ni puntos al final. Responde SOLO con el título.",
    prompt: `Crea un título para esta conversación basado en este primer mensaje: "${message}"`,
  })
  return text.trim()
}
