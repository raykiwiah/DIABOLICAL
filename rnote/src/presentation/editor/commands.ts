import type { Editor } from '@tiptap/react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  TextQuote,
  Code2,
  Minus,
  Lightbulb,
  ListCollapse,
  Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react';
import { pickImageDataUrl } from '../lib/files';

export interface SlashCommand {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
  /** Applied after the "/query" text has already been removed from the doc. */
  run: (editor: Editor) => void;
}

/**
 * The block palette surfaced by the "/" menu. Ordered by expected frequency.
 * Adding a block type is a single entry here plus its editor extension.
 */
export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'paragraph',
    title: 'Text',
    description: 'Plain paragraph',
    icon: Type,
    keywords: ['text', 'paragraph', 'plain', 'body'],
    run: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    id: 'heading1',
    title: 'Heading 1',
    description: 'Large section title',
    icon: Heading1,
    keywords: ['h1', 'title', 'heading', 'big'],
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'heading2',
    title: 'Heading 2',
    description: 'Medium section title',
    icon: Heading2,
    keywords: ['h2', 'subtitle', 'heading'],
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'heading3',
    title: 'Heading 3',
    description: 'Small section title',
    icon: Heading3,
    keywords: ['h3', 'heading'],
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bulletList',
    title: 'Bulleted list',
    description: 'A simple bullet list',
    icon: List,
    keywords: ['bullet', 'unordered', 'list', 'ul'],
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'orderedList',
    title: 'Numbered list',
    description: 'A numbered list',
    icon: ListOrdered,
    keywords: ['numbered', 'ordered', 'list', 'ol'],
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'taskList',
    title: 'To-do list',
    description: 'Track tasks with checkboxes',
    icon: ListTodo,
    keywords: ['todo', 'task', 'checkbox', 'check'],
    run: (e) => e.chain().focus().toggleTaskList().run(),
  },
  {
    id: 'quote',
    title: 'Quote',
    description: 'Capture a quotation',
    icon: TextQuote,
    keywords: ['quote', 'blockquote', 'citation'],
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'code',
    title: 'Code',
    description: 'A formatted code block',
    icon: Code2,
    keywords: ['code', 'snippet', 'pre', 'monospace'],
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'callout',
    title: 'Callout',
    description: 'Make text stand out',
    icon: Lightbulb,
    keywords: ['callout', 'note', 'info', 'tip', 'aside', 'highlight'],
    run: (e) => e.chain().focus().toggleCallout().run(),
  },
  {
    id: 'toggle',
    title: 'Toggle',
    description: 'A collapsible section',
    icon: ListCollapse,
    keywords: ['toggle', 'collapse', 'details', 'accordion', 'expand'],
    run: (e) => e.chain().focus().setDetails().run(),
  },
  {
    id: 'image',
    title: 'Image',
    description: 'Upload an image',
    icon: ImageIcon,
    keywords: ['image', 'picture', 'photo', 'upload', 'img'],
    run: (e) => {
      void pickImageDataUrl().then((src) => {
        if (src) e.chain().focus().setImage({ src }).run();
      });
    },
  },
  {
    id: 'divider',
    title: 'Divider',
    description: 'A horizontal rule',
    icon: Minus,
    keywords: ['divider', 'hr', 'rule', 'separator', 'line'],
    run: (e) => e.chain().focus().setHorizontalRule().run(),
  },
];

/** Rank commands by a fuzzy-ish match over title + keywords. */
export function filterCommands(query: string): SlashCommand[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.includes(q) || q.includes(k)),
  );
}
