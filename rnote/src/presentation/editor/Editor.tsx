import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { AnimatePresence } from 'framer-motion';
import type { RichDoc } from '@domain/blocks';
import { SLASH_COMMANDS, filterCommands, type SlashCommand } from './commands';
import { SlashMenu } from './SlashMenu';

interface EditorProps {
  initialContent: RichDoc;
  onChange: (doc: RichDoc) => void;
  editable?: boolean;
}

interface SlashState {
  open: boolean;
  query: string;
  index: number;
  items: SlashCommand[];
  range: { from: number; to: number } | null;
  x: number;
  y: number;
}

const CLOSED: SlashState = {
  open: false,
  query: '',
  index: 0,
  items: SLASH_COMMANDS,
  range: null,
  x: 0,
  y: 0,
};

/**
 * The RNOTE block editor. Built on Tiptap/ProseMirror for a rock-solid
 * contenteditable model, with a bespoke, dependency-free "/" command menu:
 * detection reads the current text block, positioning uses ProseMirror's caret
 * coordinates, and navigation is routed through `handleKeyDown` so Enter selects
 * a block instead of leaking a newline.
 */
export function Editor({ initialContent, onChange, editable = true }: EditorProps): JSX.Element {
  const editorRef = useRef<TiptapEditor | null>(null);
  const [slash, setSlash] = useState<SlashState>(CLOSED);
  const slashRef = useRef<SlashState>(slash);
  useEffect(() => {
    slashRef.current = slash;
  }, [slash]);

  const refreshSlash = useCallback((editor: TiptapEditor) => {
    const { selection } = editor.state;
    if (!selection.empty || !selection.$from.parent.isTextblock) {
      if (slashRef.current.open) setSlash((s) => ({ ...s, open: false }));
      return;
    }
    const $from = selection.$from;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, '\n', '￼');
    const match = /(?:^|\s)\/(\w*)$/.exec(textBefore);
    if (!match) {
      if (slashRef.current.open) setSlash((s) => ({ ...s, open: false }));
      return;
    }

    const query = match[1] ?? '';
    const items = filterCommands(query);
    const from = selection.from - (query.length + 1);
    const coords = editor.view.coordsAtPos(selection.from);
    setSlash((prev) => {
      const sameQuery = prev.open && prev.query === query;
      const index = sameQuery ? Math.min(prev.index, Math.max(0, items.length - 1)) : 0;
      return { open: true, query, items, index, range: { from, to: selection.from }, x: coords.left, y: coords.bottom };
    });
  }, []);

  const choose = useCallback(
    (index: number) => {
      const editor = editorRef.current;
      const state = slashRef.current;
      const command = state.items[index];
      if (!editor || !state.range || !command) return;
      editor.chain().focus().deleteRange(state.range).run();
      command.run(editor);
      setSlash((s) => ({ ...s, open: false }));
    },
    [],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): boolean => {
      const state = slashRef.current;
      if (!state.open || state.items.length === 0) return false;
      const count = state.items.length;
      switch (event.key) {
        case 'ArrowDown':
          setSlash((s) => ({ ...s, index: (s.index + 1) % count }));
          return true;
        case 'ArrowUp':
          setSlash((s) => ({ ...s, index: (s.index - 1 + count) % count }));
          return true;
        case 'Enter':
        case 'Tab':
          choose(state.index);
          return true;
        case 'Escape':
          setSlash((s) => ({ ...s, open: false }));
          return true;
        default:
          return false;
      }
    },
    [choose],
  );

  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'heading' ? 'Heading' : "Write, or press '/' for commands…",
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: { class: 'focus:outline-none', spellcheck: 'true' },
      handleKeyDown: (_view, event) => handleKeyDown(event),
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getJSON() as unknown as RichDoc);
      refreshSlash(e);
    },
    onSelectionUpdate: ({ editor: e }) => refreshSlash(e),
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  return (
    <div className="rn-editor relative">
      <EditorContent editor={editor} />
      <AnimatePresence>
        {slash.open && (
          <SlashMenu
            items={slash.items}
            activeIndex={slash.index}
            position={{ x: slash.x, y: slash.y }}
            onSelect={choose}
            onHover={(index) => setSlash((s) => ({ ...s, index }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
