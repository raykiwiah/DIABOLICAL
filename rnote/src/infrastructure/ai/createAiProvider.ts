import type { AiProvider, AiProviderId } from '@application/ports/AiProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { OpenAiProvider } from './providers/OpenAiProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenRouterProvider } from './providers/OpenRouterProvider';

export interface AiRuntimeConfig {
  id: AiProviderId;
  apiKey: string;
  model: string;
}

/** Build the concrete adapter for a provider id. */
export function createAiProvider(cfg: AiRuntimeConfig): AiProvider {
  const config = { apiKey: cfg.apiKey, model: cfg.model };
  switch (cfg.id) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'openai':
      return new OpenAiProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    case 'openrouter':
      return new OpenRouterProvider(config);
  }
}
