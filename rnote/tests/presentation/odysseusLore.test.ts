import { describe, it, expect, beforeEach } from 'vitest';
import { useSound } from '@/presentation/state/sound';
import { achievementTitle, lex } from '@/presentation/theme/lexicon';

describe('sound preference', () => {
  beforeEach(() => {
    localStorage.removeItem('rnote.sound');
    useSound.setState({ enabled: false });
  });

  it('is off by default and toggles + persists', () => {
    expect(useSound.getState().enabled).toBe(false);
    useSound.getState().toggle();
    expect(useSound.getState().enabled).toBe(true);
    expect(localStorage.getItem('rnote.sound')).toBe('1');
    useSound.getState().setEnabled(false);
    expect(localStorage.getItem('rnote.sound')).toBe('0');
  });
});

describe('achievement titles', () => {
  it('recasts achievements as myth under Odysseus, keeps originals on default', () => {
    expect(achievementTitle('level-5', 'Rising star', 'odysseus')).toBe('King of Ithaca');
    expect(achievementTitle('first-page', 'First page', 'odysseus')).toBe('First Voyage');
    expect(achievementTitle('level-5', 'Rising star', 'default')).toBe('Rising star');
  });

  it('falls back to the given title for unknown ids', () => {
    expect(achievementTitle('mystery', 'Mystery', 'odysseus')).toBe('Mystery');
  });
});

describe('extended lexicon', () => {
  it('themes trash and progress while preserving the defaults', () => {
    expect(lex('default', 'trash.title')).toBe('Trash');
    expect(lex('odysseus', 'trash.title')).toBe('The Underworld');
    expect(lex('default', 'stats.toNext')).toBe('to next');
    expect(lex('odysseus', 'stats.toNext')).toBe('to Ithaca');
    expect(lex('odysseus', 'stats.xp')).toBe('wisdom');
  });
});
