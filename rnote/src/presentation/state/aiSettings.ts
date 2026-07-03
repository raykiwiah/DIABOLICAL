import { create } from 'zustand';
import type { AiProviderId } from '@application/ports/AiProvider';
import {
  readAiConfig,
  resolveModel,
  resolveKey,
  writeEnabled,
  writeProvider,
  writeModel,
  writeKey,
  writeAutoOrganize,
  writeConfidence,
} from '@infrastructure/ai/aiConfig';

/**
 * Reactive view over the local AI config (localStorage-backed). Writes go
 * straight to the same store the composition root reads, so `getAiProvider()`
 * always sees the latest without prop-drilling or a shared singleton.
 */
interface AiSettingsState {
  enabled: boolean;
  provider: AiProviderId;
  /** Model resolved for the current provider (default if unset). */
  model: string;
  /** API key for the current provider (local-only). */
  apiKey: string;
  autoOrganize: boolean;
  confidenceThreshold: number;

  setEnabled: (enabled: boolean) => void;
  setProvider: (provider: AiProviderId) => void;
  setModel: (model: string) => void;
  setApiKey: (key: string) => void;
  setAutoOrganize: (on: boolean) => void;
  setConfidenceThreshold: (value: number) => void;
}

function snapshot(): Pick<
  AiSettingsState,
  'enabled' | 'provider' | 'model' | 'apiKey' | 'autoOrganize' | 'confidenceThreshold'
> {
  const cfg = readAiConfig();
  return {
    enabled: cfg.enabled,
    provider: cfg.provider,
    model: resolveModel(cfg),
    apiKey: resolveKey(cfg),
    autoOrganize: cfg.autoOrganize,
    confidenceThreshold: cfg.confidenceThreshold,
  };
}

export const useAiSettings = create<AiSettingsState>((set) => ({
  ...snapshot(),

  setEnabled: (enabled) => {
    writeEnabled(enabled);
    set({ enabled });
  },
  setProvider: (provider) => {
    writeProvider(provider);
    // Model + key are per-provider — re-resolve for the new selection.
    set(snapshot());
  },
  setModel: (model) => {
    writeModel(readAiConfig().provider, model);
    set({ model });
  },
  setApiKey: (key) => {
    writeKey(readAiConfig().provider, key);
    set({ apiKey: key });
  },
  setAutoOrganize: (on) => {
    writeAutoOrganize(on);
    set({ autoOrganize: on });
  },
  setConfidenceThreshold: (value) => {
    writeConfidence(value);
    set({ confidenceThreshold: value });
  },
}));
