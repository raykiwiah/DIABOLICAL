import { ok, err, type Result } from '@domain/shared/Result';
import type { AiCompletionRequest, AiProvider } from '@application/ports/AiProvider';
import { postJson } from '../http';
import { aiError } from '../errors';
import { splitSystem, type AiProviderConfig } from './shared';

/** Anthropic Messages API (browser-direct with the explicit opt-in header). */
export class AnthropicProvider implements AiProvider {
  readonly id = 'anthropic' as const;
  constructor(private readonly config: AiProviderConfig) {}

  async complete(req: AiCompletionRequest, signal?: AbortSignal): Promise<Result<string>> {
    const { system, rest } = splitSystem(req.messages);
    const res = await postJson({
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: {
        model: this.config.model,
        max_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.2,
        ...(system ? { system } : {}),
        messages: rest.map((m) => ({ role: m.role, content: m.content })),
      },
      signal,
    });
    if (!res.ok) return res;
    const text = extractText(res.value);
    return text !== null ? ok(text) : err(aiError('ai.bad-response', 'The AI response was empty.'));
  }
}

function extractText(json: unknown): string | null {
  const content = (json as { content?: Array<{ type?: string; text?: string }> })?.content;
  if (!Array.isArray(content)) return null;
  const text = content
    .filter((b) => b?.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('');
  return text.length > 0 ? text : null;
}
