/**
 * Connectivity - the app's online/offline stance, as a pure decision.
 *
 * RNOTE is offline-first: everything works with zero network. This model lets a
 * user *choose* whether the app may reach the network at all, and folds in the
 * device's real connection so the answer is automatically "offline" whenever
 * there's no wifi/data. Network-dependent capabilities (AI, calendar sync) are
 * gated on the resolved answer, so Offline mode is a hard privacy guarantee, not
 * a hint. Pure and testable; the browser/store wiring lives at the edges.
 */
export type ConnectivityPreference = 'online' | 'offline';
export type NetworkState = 'online' | 'offline';
export type EffectiveConnectivity = 'online' | 'offline';

/**
 * The stance the rest of the app acts on. Online only when the user opted in
 * *and* the device actually has a connection - so pulling the plug (or picking
 * Offline) always resolves to local-only.
 */
export function resolveConnectivity(
  preference: ConnectivityPreference,
  network: NetworkState,
): EffectiveConnectivity {
  return preference === 'online' && network === 'online' ? 'online' : 'offline';
}

/** True when the user wants Online but the device forced us local (no network). */
export function isAutoOffline(preference: ConnectivityPreference, network: NetworkState): boolean {
  return preference === 'online' && network === 'offline';
}

export type CapabilityId = 'ai' | 'calendar';

export interface Capability {
  id: CapabilityId;
  label: string;
  /** One line: what it unlocks and, implicitly, why it needs the network. */
  summary: string;
}

/** The features that require the network - everything else works offline. */
export const NETWORK_CAPABILITIES: readonly Capability[] = [
  { id: 'ai', label: 'AI features', summary: 'Summaries, auto-organization and natural-language recaps.' },
  { id: 'calendar', label: 'Calendar sync', summary: 'Subscribe to and refresh external calendar feeds.' },
];

/** Network capabilities are available only when effectively online. */
export function capabilitiesEnabled(effective: EffectiveConnectivity): boolean {
  return effective === 'online';
}
