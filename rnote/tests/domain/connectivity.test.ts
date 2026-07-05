import { describe, it, expect } from 'vitest';
import {
  resolveConnectivity,
  isAutoOffline,
  capabilitiesEnabled,
  NETWORK_CAPABILITIES,
} from '@domain/connectivity';

describe('connectivity model', () => {
  it('is online only when the user opted in AND the network is up', () => {
    expect(resolveConnectivity('online', 'online')).toBe('online');
    expect(resolveConnectivity('online', 'offline')).toBe('offline'); // no network
    expect(resolveConnectivity('offline', 'online')).toBe('offline'); // opted out
    expect(resolveConnectivity('offline', 'offline')).toBe('offline');
  });

  it('flags auto-offline only when Online was chosen but the network is down', () => {
    expect(isAutoOffline('online', 'offline')).toBe(true);
    expect(isAutoOffline('online', 'online')).toBe(false);
    expect(isAutoOffline('offline', 'offline')).toBe(false); // chosen, not forced
    expect(isAutoOffline('offline', 'online')).toBe(false);
  });

  it('enables network capabilities only when effectively online', () => {
    expect(capabilitiesEnabled('online')).toBe(true);
    expect(capabilitiesEnabled('offline')).toBe(false);
  });

  it('lists AI and calendar as the network-dependent capabilities', () => {
    expect(NETWORK_CAPABILITIES.map((c) => c.id)).toEqual(['ai', 'calendar']);
  });
});
