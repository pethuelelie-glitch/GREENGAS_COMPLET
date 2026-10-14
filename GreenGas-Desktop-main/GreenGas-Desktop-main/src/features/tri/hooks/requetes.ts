/** Requêtes TanStack Query du domaine « tri » (clés : docs/ROUTES.md). */
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiBacs } from '@/api/administration';
import { apiProductionDetail } from '@/api/productions';
import type { FiltresLots, FiltresTournees } from '@/api/requetes';
import { apiCollectes, apiTournees } from '@/api/tournees';
import { apiTri } from '@/api/tri';
import type { TriRequete } from '@/api/types';

export function useTournees(filtres: FiltresTournees = {}) {
  return useQuery({ queryKey: ['tournees', filtres], queryFn: () => apiTournees.lister(filtres) });
}

export function useTournee(id: string | undefined) {
  return useQuery({ queryKey: ['tournee', id], queryFn: () => apiTournees.detail(id as string), enabled: !!id });
}

/** Collectes « à vérifier » : pastille ambre sur la ligne de la tournée concernée. */
export function useCollectesAVerifier() {
  return useQuery({
    queryKey: ['collectes', { statut_controle: 'a_verifier' }],
    queryFn: () => apiCollectes.lister({ statut_controle: 'a_verifier' }),
  });
}

export function useResultatTri(tourneeId: string | undefined) {
  return useQuery({
    queryKey: ['tri', tourneeId],
    queryFn: () => apiTri.resultat(tourneeId as string),
    enabled: !!tourneeId,
  });
}

export function useProduction(id: string | null | undefined) {
  return useQuery({ queryKey: ['production', id], queryFn: () => apiProductionDetail(id as string), enabled: !!id });
}

/** Traçabilité de chaque bac de la tournée : points du bac et répartition par citoyen. */
export function useTracabilitesBacs(bacIds: string[]) {
  return useQueries({
    queries: bacIds.map((id) => ({ queryKey: ['bac-tracabilite', id], queryFn: () => apiBacs.tracabilite(id) })),
  });
}

export function useLots(filtres: FiltresLots = {}) {
  return useQuery({ queryKey: ['lots', filtres], queryFn: () => apiTri.lots(filtres) });
}

export function useValiderTri(tourneeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requete: TriRequete) => apiTri.valider(tourneeId, requete),
    onSuccess: (resultat) => {
      queryClient.setQueryData(['tri', tourneeId], resultat);
      // Le tri change les tournées, les points, la production du site et la traçabilité des bacs.
      for (const cle of ['tournees', 'tournee', 'collectes', 'lots', 'bac-tracabilite', 'productions', 'production-globale', 'production', 'verifications']) {
        void queryClient.invalidateQueries({ queryKey: [cle] });
      }
    },
  });
}
