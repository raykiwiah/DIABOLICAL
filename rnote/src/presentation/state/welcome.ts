import type { RichDoc } from '@domain/blocks';

/** The friendly first page a brand-new workspace is seeded with. */
export const WELCOME_DOC: RichDoc = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Welcome to RNOTE 👋' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This is your ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'private, offline-first' },
        { type: 'text', text: ' home for notes, tasks, and everything in between.' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Type ' },
        { type: 'text', marks: [{ type: 'code' }], text: '/' },
        { type: 'text', text: ' to insert headings, lists, to-dos, quotes, code and more.' },
      ],
    },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Get started' }] },
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Pick your vibe during onboarding' }] },
          ],
        },
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Create a new page from the sidebar' }],
            },
          ],
        },
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Press ' },
                { type: 'text', marks: [{ type: 'code' }], text: '⌘K' },
                { type: 'text', text: ' to open the command palette' },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Everything lives on your device. No account, no cloud, no lock-in.',
            },
          ],
        },
      ],
    },
  ],
};
