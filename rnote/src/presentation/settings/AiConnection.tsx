import { useState, type ReactNode } from 'react';
import {
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  KeyRound,
  LogIn,
  LogOut,
} from 'lucide-react';
import type { AiProviderId } from '@application/ports/AiProvider';
import { getAiProvider } from '@/composition/container';
import { AI_PROVIDER_IDS, PROVIDER_LABELS, DEFAULT_MODELS } from '@infrastructure/ai/aiConfig';
import { useAiSettings } from '../state/aiSettings';
import { useAiAccount } from '../state/aiAccount';
import { useConnectivity } from '../state/connectivity';
import { cn } from '../lib/cn';

type Method = 'key' | 'account';
type TestState = { status: 'idle' | 'testing' } | { status: 'ok' | 'error'; message: string };

/**
 * Two ways to bring your own AI, side by side:
 *  - API key: paste a key for any provider (unchanged).
 *  - Sign in: authorize RNOTE on OpenRouter (PKCE OAuth) - no key to copy, no
 *    password shared, spends your own credits. Both write the same local config.
 */
export function AiConnection(): JSX.Element {
  const account = useAiAccount((a) => a.account);
  const [method, setMethod] = useState<Method>(account ? 'account' : 'key');

  return (
    <>
      <p className="flex gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck size={26} className="shrink-0 text-success" />
        Your note text is sent only to the provider you connect, using your own account. Nothing is
        sent anywhere until you turn this on, and credentials are stored only on this device.
      </p>

      <div role="radiogroup" aria-label="AI connection method" className="grid grid-cols-2 gap-2">
        <MethodChoice
          selected={method === 'key'}
          onClick={() => setMethod('key')}
          icon={<KeyRound size={15} />}
          title="API key"
          subtitle="Paste a key"
        />
        <MethodChoice
          selected={method === 'account'}
          onClick={() => setMethod('account')}
          icon={<LogIn size={15} />}
          title="Sign in"
          subtitle="Authorize an account"
        />
      </div>

      {method === 'key' ? <ApiKeyMethod /> : <AccountMethod />}
    </>
  );
}

// API key
function ApiKeyMethod(): JSX.Element {
  const s = useAiSettings();
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<TestState>({ status: 'idle' });

  const runTest = async (): Promise<void> => {
    setTest({ status: 'testing' });
    const provider = getAiProvider({ ignoreEnabled: true });
    if (!provider) {
      setTest({ status: 'error', message: 'Enter an API key first.' });
      return;
    }
    const res = await provider.complete({
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      maxTokens: 5,
      temperature: 0,
    });
    if (res.ok) {
      setTest({ status: 'ok', message: `Connected - the model replied "${res.value.trim().slice(0, 40)}".` });
    } else {
      setTest({ status: 'error', message: res.error.message });
    }
  };

  return (
    <>
      <Field label="Provider">
        <select
          value={s.provider}
          onChange={(e) => s.setProvider(e.target.value as AiProviderId)}
          className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm text-foreground outline-none focus:border-border-strong"
        >
          {AI_PROVIDER_IDS.map((id) => (
            <option key={id} value={id}>
              {PROVIDER_LABELS[id]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Model">
        <input
          value={s.model}
          onChange={(e) => s.setModel(e.target.value)}
          placeholder={DEFAULT_MODELS[s.provider]}
          spellCheck={false}
          className="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-border-strong"
        />
      </Field>

      <Field label="API key">
        <div className="flex items-center gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={s.apiKey}
            onChange={(e) => s.setApiKey(e.target.value)}
            placeholder="Paste your key…"
            autoComplete="off"
            spellCheck={false}
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-2.5 font-mono text-sm text-foreground outline-none focus:border-border-strong"
          />
          <button
            type="button"
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
            onClick={() => setShowKey((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-surface-hover"
          >
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </Field>

      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void runTest()}
          disabled={test.status === 'testing' || !s.apiKey}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
        >
          {test.status === 'testing' && <Loader2 size={14} className="animate-spin" />}
          Test connection
        </button>
        {(test.status === 'ok' || test.status === 'error') && (
          <span
            className={cn(
              'flex items-center gap-1.5 text-xs',
              test.status === 'ok' ? 'text-success' : 'text-danger',
            )}
          >
            {test.status === 'ok' ? <Check size={13} /> : <AlertCircle size={13} />}
            {test.message}
          </span>
        )}
      </div>
    </>
  );
}

// Sign in (OpenRouter OAuth)
function AccountMethod(): JSX.Element {
  const account = useAiAccount((a) => a.account);
  const status = useAiAccount((a) => a.status);
  const error = useAiAccount((a) => a.error);
  const connect = useAiAccount((a) => a.connect);
  const disconnect = useAiAccount((a) => a.disconnect);
  const offline = useConnectivity((c) => c.effective === 'offline');
  const [email, setEmail] = useState('');

  if (account) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-3 py-2.5">
        <Check size={16} className="shrink-0 text-success" />
        <span className="min-w-0 flex-1 text-sm text-foreground">
          Connected to OpenRouter{account.email ? ` as ${account.email}` : ''}.
          <span className="block text-[11px] text-subtle">
            Using your own credits · since {new Date(account.connectedAt).toLocaleDateString()}
          </span>
        </span>
        <button
          type="button"
          onClick={disconnect}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-muted-foreground transition hover:bg-surface-hover hover:text-danger"
        >
          <LogOut size={13} /> Disconnect
        </button>
      </div>
    );
  }

  const busy = status === 'connecting' || status === 'exchanging';

  const busyLabel = status === 'exchanging' ? 'Finishing…' : 'Redirecting…';

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Sign in to use AI with your own account and tokens — across Claude, GPT, Gemini and more.
        You finish on OpenRouter’s secure page (continue with Google, GitHub or email); RNOTE never
        sees your password and only receives a key scoped to you.
      </p>
      <Field label="Account email (optional label)">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          spellCheck={false}
          className="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-border-strong"
        />
      </Field>

      {/* Google is the most-requested identity; it starts the same secure
          OpenRouter sign-in (where Google is an option). Labelled transparently. */}
      <button
        type="button"
        disabled={offline || busy}
        onClick={() => void connect(email)}
        className="flex h-10 items-center justify-center gap-2.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-surface-hover disabled:opacity-40"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <GoogleMark />}
        {busy ? busyLabel : 'Continue with Google'}
      </button>
      <button
        type="button"
        disabled={offline || busy}
        onClick={() => void connect(email)}
        className="flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
        Continue with email or GitHub
      </button>
      <p className="text-[11px] text-subtle">Secure sign-in via OpenRouter · your credits, your models.</p>

      {offline && (
        <p className="text-[11px] text-warning">Switch to Online to connect an account.</p>
      )}
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-danger">
          <AlertCircle size={13} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

/** The Google "G" mark, inlined (CSP blocks external images). */
function GoogleMark(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

// Bits
function MethodChoice({
  selected,
  onClick,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
}): JSX.Element {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors',
        selected ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:bg-surface-hover',
      )}
    >
      <span className={selected ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
      <span className="min-w-0">
        <span className={cn('block text-sm font-medium', selected ? 'text-foreground' : 'text-muted-foreground')}>
          {title}
        </span>
        <span className="block text-[11px] text-subtle">{subtitle}</span>
      </span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
