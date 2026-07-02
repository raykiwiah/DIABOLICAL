import { describe, it, expect } from 'vitest';
import type { RichDoc } from '@domain/blocks';
import { richDocToMarkdown } from '@/presentation/lib/markdown';

const doc: RichDoc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hello ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'world' },
        { type: 'text', text: ' and ' },
        { type: 'text', marks: [{ type: 'link', attrs: { href: 'https://x.com' } }], text: 'link' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'two' }] }] },
      ],
    },
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'done' }] }],
        },
      ],
    },
    { type: 'codeBlock', attrs: { language: 'ts' }, content: [{ type: 'text', text: 'const x = 1;' }] },
  ],
};

describe('richDocToMarkdown', () => {
  it('serializes blocks and inline marks', () => {
    const md = richDocToMarkdown(doc);
    expect(md).toContain('# Title');
    expect(md).toContain('Hello **world**');
    expect(md).toContain('[link](https://x.com)');
    expect(md).toContain('- one');
    expect(md).toContain('- two');
    expect(md).toContain('- [x] done');
    expect(md).toContain('```ts');
    expect(md).toContain('const x = 1;');
  });
});
