import { describe, it, expect } from 'vitest';
import { parseJsonLoose } from '@infrastructure/ai/parseJson';

describe('parseJsonLoose', () => {
  it('parses clean JSON', () => {
    expect(parseJsonLoose('{"a":1}')).toEqual({ a: 1 });
  });

  it('strips ```json fences', () => {
    expect(parseJsonLoose('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('strips bare ``` fences', () => {
    expect(parseJsonLoose('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('extracts the first object from surrounding prose', () => {
    expect(parseJsonLoose('Sure! Here you go: {"tags":["a","b"]} — hope that helps')).toEqual({
      tags: ['a', 'b'],
    });
  });

  it('handles braces inside strings', () => {
    expect(parseJsonLoose('{"text":"a } b { c"}')).toEqual({ text: 'a } b { c' });
  });

  it('returns null for non-JSON', () => {
    expect(parseJsonLoose('no json here')).toBeNull();
    expect(parseJsonLoose('')).toBeNull();
  });
});
