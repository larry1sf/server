
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
