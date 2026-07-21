import { describe, it, expect, beforeEach } from 'vitest';
import { usePreferences } from '@/presentation/state/preferences';
import { lex } from '@/presentation/theme/lexicon';

describe('skin preference (Odysseus)', () => {
  beforeEach(() => {
    localStorage.removeItem('rnote.skin');
    usePreferences.setState({ skin: 'default' });
  });

  it('setSkin persists and reflects onto <html data-skin>, both ways', () => {
    usePreferences.getState().setSkin('odysseus');
    expect(usePreferences.getState().skin).toBe('odysseus');
    expect(localStorage.getItem('rnote.skin')).toBe('odysseus');
    expect(document.documentElement.getAttribute('data-skin')).toBe('odysseus');

    usePreferences.getState().setSkin('default');
    expect(usePreferences.getState().skin).toBe('default');
    expect(document.documentElement.getAttribute('data-skin')).toBe('default');
  });

  it('does not touch onboarding / terms / name state when switching', () => {
    const before = usePreferences.getState();
    const snapshot = {
      onboarded: before.onboarded,
      userName: before.userName,
      termsAcceptedVersion: before.termsAcceptedVersion,
    };
    usePreferences.getState().setSkin('odysseus');
    const after = usePreferences.getState();
    expect(after.onboarded).toBe(snapshot.onboarded);
    expect(after.userName).toBe(snapshot.userName);
    expect(after.termsAcceptedVersion).toBe(snapshot.termsAcceptedVersion);
  });
});

describe('lexicon', () => {
  it('keeps default copy byte-identical to the original strings', () => {
    expect(lex('default', 'nav.trash')).toBe('Trash');
    expect(lex('default', 'nav.search')).toBe('Search');
    expect(lex('default', 'nav.newPage')).toBe('New page');
    expect(lex('default', 'editor.saved')).toBe('Saved locally');
    expect(lex('default', 'empty.noPages')).toBe('No pages yet.');
    expect(lex('default', 'home.recent')).toBe('Jump back in');
    expect(lex('default', 'search.placeholder')).toBe('Search pages or type a command…');
  });

  it('re-imagines the key surfaces under Odysseus', () => {
    expect(lex('odysseus', 'nav.trash')).toBe('The Underworld');
    expect(lex('odysseus', 'nav.search')).toBe('Seek Knowledge');
    expect(lex('odysseus', 'nav.settings')).toBe('The Temple');
    expect(lex('odysseus', 'editor.saved')).toBe('Preserved');
    expect(lex('odysseus', 'home.recent')).toBe('Recent Discoveries');
    expect(lex('odysseus', 'empty.noPages')).toContain('single story');
  });
});
