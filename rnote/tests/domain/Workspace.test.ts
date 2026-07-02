import { describe, it, expect } from 'vitest';
import { Workspace } from '@domain/workspace';
import { FakeClock } from '../support/fakes';

const clock = new FakeClock();

describe('Workspace', () => {
  it('creates with a trimmed name', () => {
    const result = Workspace.create('  My Life  ', clock);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.name).toBe('My Life');
  });

  it('requires a non-empty name', () => {
    expect(Workspace.create('   ', clock).ok).toBe(false);
  });

  it('renames', () => {
    const created = Workspace.create('A', clock);
    if (!created.ok) throw new Error('setup failed');
    const renamed = created.value.rename('B', clock);
    expect(renamed.ok).toBe(true);
    expect(created.value.name).toBe('B');
  });
});
