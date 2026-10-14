import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Secondes écoulées depuis la dernière réponse reçue du serveur (indicateur « il y a 3 s »).
 */
export function useDerniereMiseAJour(): number {
  const queryClient = useQueryClient();
  const [derniere, setDerniere] = useState(() => Date.now());
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((evenement) => {
        if (evenement.type === 'updated' && evenement.action.type === 'success') setDerniere(Date.now());
      }),
    [queryClient],
  );

  useEffect(() => {
    const t = window.setInterval(() => setMaintenant(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  return Math.max(0, Math.round((maintenant - derniere) / 1000));
}
