import { useState, type ReactNode } from 'react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErreurApi } from '@/api/erreurs';
import { FournisseurSession } from '@/auth/session';
import { FournisseurNotifications } from '@/components/greengas/Notifications';
import { FournisseurInfobulles } from '@/components/ui/infobulle';
import { FournisseurPreferences } from '@/lib/preferences';

/** Nouvel essai seulement si le serveur est injoignable ou en erreur interne (jamais sur une erreur métier). */
function nouvelEssai(tentatives: number, erreur: unknown): boolean {
  if (erreur instanceof ErreurApi && erreur.status > 0 && erreur.status < 500) return false;
  return tentatives < 2;
}

export function creerClientRequetes(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache(),
    mutationCache: new MutationCache(),
    defaultOptions: {
      queries: { staleTime: 2000, retry: nouvelEssai, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

export function Fournisseurs({ children, client }: { children: ReactNode; client?: QueryClient }) {
  const [queryClient] = useState(() => client ?? creerClientRequetes());
  return (
    <QueryClientProvider client={queryClient}>
      <FournisseurPreferences>
        <FournisseurInfobulles delayDuration={250}>
          <FournisseurNotifications>
            <FournisseurSession>{children}</FournisseurSession>
          </FournisseurNotifications>
        </FournisseurInfobulles>
      </FournisseurPreferences>
    </QueryClientProvider>
  );
}
