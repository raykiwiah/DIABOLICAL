import type { AiMessage } from '@application/ports/AiProvider';

export interface AiProviderConfig {
  apiKey: string;
  model: string;
}

/** Anthropic + Gemini take the system prompt out-of-band; split it out. */
export function splitSystem(messages: AiMessage[]): { system: string; rest: AiMessage[] } {
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
  const rest = messages.filter((m) => m.role !== 'system');
  return { system, rest };
}

/** Extract assistant text from an OpenAI-shaped chat completion. */
export function extractOpenAiText(json: unknown): string | null {
  const content = (json as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]
    ?.message?.content;
  return typeof content === 'string' && content.length > 0 ? content : null;
}
