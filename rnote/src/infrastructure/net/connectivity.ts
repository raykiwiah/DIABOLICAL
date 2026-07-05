import {
  resolveConnectivity,
  type ConnectivityPreference,
  type EffectiveConnectivity,
  type NetworkState,
} from '@domain/connectivity';

/**
 * The network guard. Both the presentation store and the low-level fetch sites
 * (AI, calendar) resolve through here, so "Offline mode makes no network calls"
 * holds no matter which layer is asking. Reads the persisted preference and the
 * live browser connection; pure domain logic does the resolving.
 */
export const CONNECTIVITY_KEY = 'rnote.connectivity';

/** Persisted stance; anything unset/unknown is treated as offline (privacy-first default). */
export function readPreference(): ConnectivityPreference {
  try {
    return localStorage.getItem(CONNECTIVITY_KEY) === 'online' ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
}

export function writePreference(preference: ConnectivityPreference): void {
  try {
    localStorage.setItem(CONNECTIVITY_KEY, preference);
  } catch {
    /* Storage unavailable (private mode) - stance degrades to session-only. */
  }
}

/** The device's real connection, defaulting to online where the API is absent (e.g. tests). */
export function networkState(): NetworkState {
  try {
    return navigator.onLine ? 'online' : 'offline';
  } catch {
    return 'online';
  }
}

export function effectiveConnectivity(): EffectiveConnectivity {
  return resolveConnectivity(readPreference(), networkState());
}

/** The one predicate network code checks before touching the wire. */
export function isOnline(): boolean {
  return effectiveConnectivity() === 'online';
}
