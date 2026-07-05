import { create } from 'zustand';
import {
  resolveConnectivity,
  isAutoOffline as computeAutoOffline,
  type ConnectivityPreference,
  type EffectiveConnectivity,
  type NetworkState,
} from '@domain/connectivity';
import { readPreference, writePreference, networkState } from '@infrastructure/net/connectivity';

/**
 * Reactive view over the app's online/offline stance. The user's choice is
 * persisted (localStorage, via the same guard the network layer reads); the
 * device's real connection is tracked live from the browser's online/offline
 * events. `effective` is what the UI acts on.
 */
interface ConnectivityState {
  preference: ConnectivityPreference;
  network: NetworkState;
  effective: EffectiveConnectivity;
  /** Online was chosen but the device dropped the connection. */
  autoOffline: boolean;
  setPreference: (preference: ConnectivityPreference) => void;
  /** Fold in a fresh network reading (used by the online/offline listeners). */
  syncNetwork: () => void;
}

function derive(preference: ConnectivityPreference, network: NetworkState) {
  return {
    preference,
    network,
    effective: resolveConnectivity(preference, network),
    autoOffline: computeAutoOffline(preference, network),
  };
}

export const useConnectivity = create<ConnectivityState>((set, get) => ({
  ...derive(readPreference(), networkState()),

  setPreference: (preference) => {
    writePreference(preference);
    set(derive(preference, get().network));
  },

  syncNetwork: () => {
    set(derive(get().preference, networkState()));
  },
}));

// Keep the store honest about the real connection for the life of the tab.
if (typeof window !== 'undefined') {
  const sync = (): void => useConnectivity.getState().syncNetwork();
  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);
}
