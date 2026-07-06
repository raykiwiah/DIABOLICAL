import { create } from 'zustand';
import { isOnline } from '@infrastructure/net/connectivity';
import { writeKey, writeProvider, writeEnabled } from '@infrastructure/ai/aiConfig';
import {
  randomToken,
  codeChallenge,
  buildAuthUrl,
  parseCallback,
  buildExchangeInit,
  extractKey,
  OPENROUTER_EXCHANGE_URL,
} from '@infrastructure/ai/oauth';
import { useAiSettings } from './aiSettings';

/**
 * "Sign in with your account" for AI, via OpenRouter's PKCE OAuth. The user
 * authorizes on OpenRouter (RNOTE never sees a password); we exchange the
 * returned code for a user-scoped key that spends their own credits, stored
 * locally exactly like a pasted key - so the rest of the app is unchanged. The
 * pasted-key path stays available; this is a second, friendlier option.
 */
const PENDING_KEY = 'rnote.ai.oauth.pending'; // { verifier, email, state? (legacy) }
const ACCOUNT_KEY = 'rnote.ai.account'; // { email, connectedAt }

interface ConnectedAccount {
  provider: 'openrouter';
  email: string;
  connectedAt: number;
}

interface Pending {
  verifier: string;
  email: string;
  /** Legacy: older builds round-tripped a state param; kept only to verify it if echoed. */
  state?: string;
}

type Status = 'idle' | 'connecting' | 'exchanging' | 'error';

interface AiAccountState {
  account: ConnectedAccount | null;
  status: Status;
  error: string | null;
  /** True right after a successful exchange, until the UI acknowledges it.
      The exchange can finish before React mounts, so a transition is not
      observable - this flag is. */
  justConnected: boolean;
  ackConnected: () => void;
  /** Begin the OAuth redirect (requires Online). `email` is a local label. */
  connect: (email: string) => Promise<void>;
  /** Finish the redirect: if the URL carries a code, swap it for a key. */
  completeCallback: () => Promise<void>;
  disconnect: () => void;
}

function readAccount(): ConnectedAccount | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Partial<ConnectedAccount>;
    if (typeof obj.email === 'string' && typeof obj.connectedAt === 'number') {
      return { provider: 'openrouter', email: obj.email, connectedAt: obj.connectedAt };
    }
    return null;
  } catch {
    return null;
  }
}

function readPending(): Pending | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Partial<Pending>;
    if (typeof obj.verifier === 'string') {
      return {
        verifier: obj.verifier,
        email: obj.email ?? '',
        ...(typeof obj.state === 'string' ? { state: obj.state } : {}),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode - session only */
  }
}
function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Reflect the freshly-stored key/provider into the reactive AI settings store. */
function refreshAiSettings(): void {
  const ai = useAiSettings.getState();
  ai.setProvider('openrouter'); // re-snapshots (picks up the new key)
  ai.setEnabled(true);
}

export const useAiAccount = create<AiAccountState>((set) => ({
  account: readAccount(),
  status: 'idle',
  error: null,
  justConnected: false,
  ackConnected: () => set({ justConnected: false }),

  connect: async (email) => {
    if (!isOnline()) {
      set({ status: 'error', error: 'Switch to Online to connect an account.' });
      return;
    }
    set({ status: 'connecting', error: null });
    const verifier = randomToken();
    const challenge = await codeChallenge(verifier);
    safeSet(PENDING_KEY, JSON.stringify({ verifier, email: email.trim() }));
    // The callback URL must be bare — OpenRouter redirects to `callback?code=...`
    // and does not preserve extra query params (this broke the first release).
    const callbackUrl = window.location.origin + window.location.pathname;
    window.location.assign(buildAuthUrl({ callbackUrl, challenge }));
  },

  completeCallback: async () => {
    const { code, state } = parseCallback(window.location.search);
    if (!code) return;
    const pending = readPending();
    // Always scrub the code from the URL so a reload can't re-trigger.
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    if (!pending) {
      set({ status: 'error', error: 'No sign-in was started on this device. Open Settings and try again.' });
      return;
    }
    // Legacy in-flight pendings carried a state param; verify only if both sides have one.
    if (pending.state && state && pending.state !== state) {
      set({ status: 'error', error: 'That sign-in link did not match this device. Try again.' });
      safeRemove(PENDING_KEY);
      return;
    }
    set({ status: 'exchanging', error: null });
    try {
      const res = await fetch(OPENROUTER_EXCHANGE_URL, buildExchangeInit(code, pending.verifier));
      const key = extractKey(await res.json().catch(() => null));
      if (!res.ok || !key) {
        set({ status: 'error', error: 'Could not complete the connection. Please try again.' });
        safeRemove(PENDING_KEY);
        return;
      }
      writeKey('openrouter', key);
      writeProvider('openrouter');
      writeEnabled(true);
      const account: ConnectedAccount = {
        provider: 'openrouter',
        email: pending.email,
        connectedAt: Date.now(),
      };
      safeSet(ACCOUNT_KEY, JSON.stringify({ email: account.email, connectedAt: account.connectedAt }));
      safeRemove(PENDING_KEY);
      refreshAiSettings();
      set({ account, status: 'idle', error: null, justConnected: true });
    } catch {
      set({ status: 'error', error: 'Could not reach OpenRouter. Check your connection and retry.' });
      safeRemove(PENDING_KEY);
    }
  },

  disconnect: () => {
    writeKey('openrouter', '');
    safeRemove(ACCOUNT_KEY);
    safeRemove(PENDING_KEY);
    useAiSettings.getState().setProvider('openrouter'); // re-snapshot (key now empty)
    set({ account: null, status: 'idle', error: null });
  },
}));
