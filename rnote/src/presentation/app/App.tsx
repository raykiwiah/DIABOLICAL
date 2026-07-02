import { useEffect } from 'react';
import { usePreferences } from '../state/preferences';
import { useWorkspace } from '../state/workspace';
import { Onboarding } from '../onboarding/Onboarding';
import { AppShell } from './AppShell';
import { Spinner } from '../components/Spinner';

export function App(): JSX.Element {
  const onboarded = usePreferences((s) => s.onboarded);
  const status = useWorkspace((s) => s.status);
  const bootstrap = useWorkspace((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (!onboarded) return <Onboarding />;
  if (status !== 'ready') return <BootScreen />;
  return <AppShell />;
}

function BootScreen(): JSX.Element {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
        <span className="font-display text-xl font-bold">R</span>
      </div>
      <Spinner />
    </div>
  );
}
