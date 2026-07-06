import { describe, it, expect } from 'vitest';
import {
  randomToken,
  codeChallenge,
  buildAuthUrl,
  parseCallback,
  buildExchangeInit,
  extractKey,
  OAUTH_STATE_PARAM,
} from '@infrastructure/ai/oauth';

describe('OpenRouter OAuth (PKCE)', () => {
  it('generates URL-safe random tokens with no padding', () => {
    const t = randomToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(t.length).toBeGreaterThan(20);
    expect(randomToken()).not.toBe(randomToken()); // unique
  });

  it('derives a stable S256 challenge from a verifier', async () => {
    // Known RFC 7636 test vector.
    const challenge = await codeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('builds an auth URL with a BARE callback (provider does not preserve extra params)', () => {
    const url = new URL(
      buildAuthUrl({ callbackUrl: 'https://app.example/RNOTE/', challenge: 'CHAL' }),
    );
    expect(url.origin + url.pathname).toBe('https://openrouter.ai/auth');
    expect(url.searchParams.get('code_challenge')).toBe('CHAL');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    const callback = new URL(url.searchParams.get('callback_url')!);
    expect(callback.toString()).toBe('https://app.example/RNOTE/');
    expect(callback.search).toBe(''); // no query of our own — the real-flow bug
  });

  it('parses the code out of a callback query, however the provider shaped it', () => {
    expect(parseCallback('?code=abc123')).toEqual({ code: 'abc123', state: null });
    expect(parseCallback('?code=abc123&rnote_oauth=ST')).toEqual({ code: 'abc123', state: 'ST' });
    // A provider appending "?code=" onto a URL that already had a query:
    expect(parseCallback(`?${OAUTH_STATE_PARAM}=ST?code=abc123`)).toEqual({
      code: 'abc123',
      state: 'ST',
    });
    expect(parseCallback('?nope=1')).toEqual({ code: null, state: null });
  });

  it('shapes the exchange request as PKCE JSON', () => {
    const init = buildExchangeInit('the-code', 'the-verifier');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      code: 'the-code',
      code_verifier: 'the-verifier',
      code_challenge_method: 'S256',
    });
  });

  it('extracts the issued key, or null when malformed', () => {
    expect(extractKey({ key: 'sk-or-v1-abc' })).toBe('sk-or-v1-abc');
    expect(extractKey({ key: '' })).toBeNull();
    expect(extractKey({})).toBeNull();
    expect(extractKey(null)).toBeNull();
  });
});
