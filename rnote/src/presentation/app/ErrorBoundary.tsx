import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes so the app degrades to a friendly, recoverable
 * screen instead of a blank page. Local data is untouched by a UI crash, so we
 * say so and offer both an in-place retry and a full reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // In a later milestone this feeds an opt-in, local-first diagnostics log.
    console.error('RNOTE encountered an error:', error, info.componentStack);
  }

  private readonly reset = (): void => this.setState({ error: null });

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/15 text-danger">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The interface hit an unexpected error. Your notes are safe on this device — nothing was
            lost.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.reset}
              className="h-9 rounded-md border border-border bg-surface-hover px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:brightness-110"
            >
              Reload app
            </button>
          </div>
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-subtle">Technical details</summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted p-3 text-left text-[11px] text-muted-foreground">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
