import { ok, err, type Result } from '@domain/shared/Result';
import type { AiCompletionRequest, AiProvider } from '@application/ports/AiProvider';
import { postJson } from '../http';
import { aiError } from '../errors';
import { extractOpenAiText, type AiProviderConfig } from './shared';

/** OpenAI Chat Completions. */
export class OpenAiProvider implements AiProvider {
  readonly id = 'openai' as const;
  constructor(private readonly config: AiProviderConfig) {}

  async complete(req: AiCompletionRequest, signal?: AbortSignal): Promise<Result<string>> {
    const res = await postJson({
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { authorization: `Bearer ${this.config.apiKey}` },
      body: {
        model: this.config.model,
        max_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.2,
        messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
        ...(req.jsonSchemaHint ? { response_format: { type: 'json_object' } } : {}),
      },
      signal,
    });
    if (!res.ok) return res;
    const text = extractOpenAiText(res.value);
    return text !== null ? ok(text) : err(aiError('ai.bad-response', 'The AI response was empty.'));
  }
}
