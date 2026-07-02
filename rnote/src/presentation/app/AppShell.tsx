import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '../sidebar/Sidebar';
import { Topbar } from '../topbar/Topbar';
import { DocumentEditor } from '../editor/DocumentEditor';
import { Home } from '../home/Home';
import { useWorkspace } from '../state/workspace';
import { useHotkey } from '../hooks/useHotkey';
import { OPEN_TEMPLATES_EVENT } from '../lib/events';

// Loaded on demand.
const CommandPalette = lazy(() =>
  import('../command-palette/CommandPalette').then((m) => ({ default: m.CommandPalette })),
);
const TemplatePicker = lazy(() =>
  import('../templates/TemplatePicker').then((m) => ({ default: m.TemplatePicker })),
);

/** The main three-region workspace: sidebar · topbar · editor, plus the ⌘K palette. */
export function AppShell(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const view = useWorkspace((s) => s.view);

  useHotkey('k', () => setPaletteOpen((o) => !o), { meta: true, allowInEditable: true });
  useHotkey('\\', () => setSidebarOpen((o) => !o), { meta: true, allowInEditable: true });

  useEffect(() => {
    const open = (): void => setTemplatesOpen(true);
    window.addEventListener(OPEN_TEMPLATES_EVENT, open);
    return () => window.removeEventListener(OPEN_TEMPLATES_EVENT, open);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {sidebarOpen && <Sidebar onOpenSearch={() => setPaletteOpen(true)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenSearch={() => setPaletteOpen(true)}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />
        <main className="min-h-0 flex-1">
          {view === 'home' ? <Home /> : <DocumentEditor />}
        </main>
      </div>

      <Suspense fallback={null}>
        <AnimatePresence>
          {paletteOpen && <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />}
        </AnimatePresence>
      </Suspense>
      <Suspense fallback={null}>
        {templatesOpen && (
          <TemplatePicker open onClose={() => setTemplatesOpen(false)} />
        )}
      </Suspense>
    </div>
  );
}
