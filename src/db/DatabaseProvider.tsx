import { useEffect, useState, type ReactNode } from 'react';
import { isIndexedDBAvailable } from './index';
import { seedDefaultProfiles } from './seed';

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initDatabase() {
      if (!isIndexedDBAvailable()) {
        setError('IndexedDB is not available in this browser. Please use a modern browser to use this application.');
        setStatus('error');
        return;
      }

      try {
        await seedDefaultProfiles();
        setStatus('ready');
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
        setStatus('error');
      }
    }

    initDatabase();
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent mx-auto" />
          <p className="text-slate-600 font-body">Initializing database...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-8">
        <div className="max-w-md text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h1 className="mb-2 text-xl font-semibold font-heading text-slate-900">Database Error</h1>
          <p className="text-slate-600 font-body">{error}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
