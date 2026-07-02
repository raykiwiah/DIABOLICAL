import { lazy, Suspense, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '../sidebar/Sidebar';
import { Topbar } from '../topbar/Topbar';
import { DocumentEditor } from '../editor/DocumentEditor';
import { Home } from '../home/Home';
import { useWorkspace } from '../state/workspace';
import { useHotkey } from '../hooks/useHotkey';

// The palette is only needed once the user reaches for it (⌘K).
const CommandPalette = lazy(() =>
  import('../command-palette/CommandPalette').then((m) => ({ default: m.CommandPalette })),
);

/** The main three-region workspace: sidebar · topbar · editor, plus the ⌘K palette. */
export function AppShell(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const view = useWorkspace((s) => s.view);

  useHotkey('k', () => setPaletteOpen((o) => !o), { meta: true, allowInEditable: true });
  useHotkey('\\', () => setSidebarOpen((o) => !o), { meta: true, allowInEditable: true });

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
    </div>
  );
}
