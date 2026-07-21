import { usePreferences, type SkinName } from '../state/preferences';

/**
 * Skin-aware microcopy. Under the Odysseus skin the interface speaks the
 * language of a voyage — notes are chronicles, folders are islands, the trash is
 * the Underworld. The `default` value of every entry is byte-identical to the
 * original copy, so the default skin reads exactly as before.
 *
 * Only presentational strings live here; nothing here changes behaviour.
 */
type Entry = Record<SkinName, string>;

const LEXICON = {
  // Sidebar navigation
  'nav.home': { default: 'Home', odysseus: 'Ithaca' },
  'nav.today': { default: 'Today', odysseus: "Today's Log" },
  'nav.timeMachine': { default: 'Time Machine', odysseus: 'Voyages Past' },
  'nav.search': { default: 'Search', odysseus: 'Seek Knowledge' },
  'nav.newPage': { default: 'New page', odysseus: 'New Chronicle' },
  'nav.private': { default: 'Private', odysseus: 'Chronicles' },
  'nav.trash': { default: 'Trash', odysseus: 'The Underworld' },
  'nav.settings': { default: 'Settings', odysseus: 'The Temple' },
  'empty.noPages': {
    default: 'No pages yet.',
    odysseus: 'Every great journey begins with a single story.',
  },

  // Search / command palette
  'search.placeholder': {
    default: 'Search pages or type a command…',
    odysseus: 'Seek knowledge across your chronicles…',
  },

  // Home dashboard
  'home.capturePlaceholder': {
    default: 'Capture a thought, task, or idea…',
    odysseus: 'Record a thought for the voyage…',
  },
  'home.captureButton': { default: 'Capture', odysseus: 'Record' },
  'home.recent': { default: 'Jump back in', odysseus: 'Recent Discoveries' },
  'home.recentEmpty': {
    default: 'No pages yet — capture something above.',
    odysseus: 'The sea is calm. Your next story awaits.',
  },
  'home.action.newPage.title': { default: 'New page', odysseus: 'Begin a Chronicle' },
  'home.action.newPage.sub': { default: 'Start from blank', odysseus: 'A blank scroll' },
  'home.action.templates.title': { default: 'Templates', odysseus: 'Charts' },
  'home.action.templates.sub': { default: 'Start from a layout', odysseus: 'Start from a map' },
  'home.action.today.title': { default: "Today's note", odysseus: "Captain's Log" },
  'home.action.today.sub': { default: 'Plan and reflect', odysseus: 'Chart the day' },
  'home.action.search.title': { default: 'Search', odysseus: 'Seek Knowledge' },

  // Time-of-day greeting
  'greeting.lateNight': { default: 'Still up?', odysseus: 'Sailing by starlight' },
  'greeting.morning': { default: 'Good morning', odysseus: 'Fair winds' },
  'greeting.afternoon': { default: 'Good afternoon', odysseus: 'Calm seas' },
  'greeting.evening': { default: 'Good evening', odysseus: 'Safe harbour' },

  // Editor
  'editor.untitled': { default: 'Untitled', odysseus: 'Untitled Chronicle' },
  'editor.saved': { default: 'Saved locally', odysseus: 'Preserved' },
  'editor.saving': { default: 'Saving…', odysseus: 'Preserving…' },
  'editor.emptyTitle': { default: 'No page open', odysseus: 'No chronicle open' },
  'editor.emptyBody': {
    default: 'Select a page from the sidebar or create a new one.',
    odysseus: 'Choose a chronicle from your log, or begin a new one.',
  },

  // Trash / The Underworld
  'trash.title': { default: 'Trash', odysseus: 'The Underworld' },
  'trash.empty': { default: 'Trash is empty', odysseus: 'The Underworld is quiet.' },
  'trash.emptyHint': {
    default: 'Pages you move to Trash appear here.',
    odysseus: 'Chronicles you release drift here — not yet forgotten.',
  },

  // Progress — the journey home
  'stats.progressLabel': { default: 'Your progress', odysseus: 'Your voyage home' },
  'stats.xp': { default: 'XP', odysseus: 'wisdom' },
  'stats.toNext': { default: 'to next', odysseus: 'to Ithaca' },
  'stats.dayOne': { default: 'day', odysseus: 'day at sea' },
  'stats.dayMany': { default: 'days', odysseus: 'days at sea' },
  'stats.noStreak': { default: 'No streak yet', odysseus: 'Becalmed — no streak yet' },
} satisfies Record<string, Entry>;

/**
 * Mythology names for the achievements under Odysseus. Keyed by achievement id;
 * the default title (from the domain) is used for any id not listed here and for
 * the default skin.
 */
const ACHIEVEMENT_ODYSSEUS: Record<string, string> = {
  'first-page': 'First Voyage',
  capturer: 'Navigator',
  prolific: 'Story Keeper',
  'streak-3': 'Steadfast Helmsman',
  'streak-7': 'Keeper of Memories',
  'level-5': 'King of Ithaca',
};

export function achievementTitle(id: string, fallback: string, skin: SkinName): string {
  if (skin === 'odysseus') return ACHIEVEMENT_ODYSSEUS[id] ?? fallback;
  return fallback;
}

export type LexKey = keyof typeof LEXICON;

export function lex(skin: SkinName, key: LexKey): string {
  const entry = LEXICON[key];
  return entry[skin] ?? entry.default;
}

/** Hook returning a translator bound to the active skin. */
export function useLexicon(): (key: LexKey) => string {
  const skin = usePreferences((s) => s.skin);
  return (key: LexKey) => lex(skin, key);
}
