import { ok, err, type Result } from '@domain/shared/Result';
import type { AiCompletionRequest, AiProvider } from '@application/ports/AiProvider';
import { postJson } from '../http';
import { aiError } from '../errors';
import { splitSystem, type AiProviderConfig } from './shared';

/** Google Gemini generateContent. */
export class GeminiProvider implements AiProvider {
  readonly id = 'gemini' as const;
  constructor(private readonly config: AiProviderConfig) {}

  async complete(req: AiCompletionRequest, signal?: AbortSignal): Promise<Result<string>> {
    const { system, rest } = splitSystem(req.messages);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.config.model,
    )}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`;
    const res = await postJson({
      url,
      headers: {},
      body: {
        contents: rest.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        generationConfig: {
          maxOutputTokens: req.maxTokens ?? 1024,
          temperature: req.temperature ?? 0.2,
          ...(req.jsonSchemaHint ? { responseMimeType: 'application/json' } : {}),
        },
      },
      signal,
    });
    if (!res.ok) return res;
    const text = extractText(res.value);
    return text !== null ? ok(text) : err(aiError('ai.bad-response', 'The AI response was empty.'));
  }
}

function extractText(json: unknown): string | null {
  const parts = (
    json as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  )?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts
    .map((p) => (typeof p.text === 'string' ? p.text : ''))
    .join('');
  return text.length > 0 ? text : null;
}
