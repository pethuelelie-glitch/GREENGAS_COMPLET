/** Requêtes TanStack Query du domaine « méthanisation » (rafraîchies toutes les 5 s). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiBacs } from '@/api/administration';
import { apiAlertes } from '@/api/alertes';
import { apiProductions } from '@/api/productions';
import type { FiltresAlertes, FiltresProductions } from '@/api/requetes';
import { apiSites } from '@/api/sites';
import { apiCollectes } from '@/api/tournees';
import type { DestinationDigestat, StatutSite } from '@/api/types';
import { INTERVALLE } from '@/hooks/referentiel';

export function useProductionGlobale(date: string) {
  return useQuery({
    queryKey: ['production-globale', date],
    queryFn: () => apiProductions.globale(date),
    refetchInterval: INTERVALLE,
  });
}

export function useProductions(filtres: FiltresProductions, actif = true) {
  return useQuery({
    queryKey: ['productions', filtres],
    queryFn: () => apiProductions.lister(filtres),
    refetchInterval: INTERVALLE,
    enabled: actif,
  });
}

export function useAlertes(filtres: FiltresAlertes = {}) {
  return useQuery({ queryKey: ['alertes', filtres], queryFn: () => apiAlertes.lister(filtres), refetchInterval: INTERVALLE });
}

export function useSite(id: string | undefined) {
  return useQuery({ queryKey: ['site', id], queryFn: () => apiSites.detail(id as string), enabled: !!id, refetchInterval: INTERVALLE });
}

export function useBacsCarte() {
  return useQuery({ queryKey: ['bacs', {}], queryFn: () => apiBacs.lister() });
}

export function useCollectesSignalees() {
  return useQuery({
    queryKey: ['collectes', { statut_controle: 'a_verifier' }],
    queryFn: () => apiCollectes.lister({ statut_controle: 'a_verifier' }),
    refetchInterval: INTERVALLE,
  });
}

/** Invalide tout ce qui dépend de la production, des sites et des alertes. */
function useInvaliderEnergie() {
  const queryClient = useQueryClient();
  return () => {
    for (const cle of ['sites', 'site', 'productions', 'production-globale', 'production', 'alertes', 'alerte', 'journal']) {
      void queryClient.invalidateQueries({ queryKey: [cle] });
    }
  };
}

export function useResoudreAlerte() {
  const invalider = useInvaliderEnergie();
  return useMutation({
    mutationFn: ({ id, commentaire }: { id: string; commentaire: string }) => apiAlertes.resoudre(id, commentaire),
    onSuccess: invalider,
  });
}

export function useChangerStatutSite() {
  const invalider = useInvaliderEnergie();
  return useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: StatutSite }) => apiSites.changerStatut(id, statut),
    onSuccess: invalider,
  });
}

export function useCloturerJournee() {
  const invalider = useInvaliderEnergie();
  return useMutation({
    mutationFn: ({ id, destination }: { id: string; destination: DestinationDigestat }) => apiProductions.cloturer(id, destination),
    onSuccess: invalider,
  });
}
