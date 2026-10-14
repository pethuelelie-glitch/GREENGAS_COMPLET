/**
 * Requêtes partagées par plusieurs domaines (coque, tri, méthanisation, administration).
 * Clés de cache : docs/ROUTES.md.
 */
import { useQuery } from '@tanstack/react-query';
import { apiParametres, apiVerifications } from '@/api/administration';
import { apiAlertes } from '@/api/alertes';
import { apiSecteurs, apiSites } from '@/api/sites';
import { apiTournees } from '@/api/tournees';
import type { CleParametre, Parametre } from '@/api/types';
import { config } from '@/lib/config';

export const INTERVALLE = config.rafraichissementMs;

export function useSites(options: { suivi?: boolean } = {}) {
  return useQuery({
    queryKey: ['sites'],
    queryFn: apiSites.lister,
    refetchInterval: options.suivi ? INTERVALLE : false,
  });
}

export function useSecteurs() {
  return useQuery({ queryKey: ['secteurs'], queryFn: apiSecteurs.lister, staleTime: 60_000 });
}

export function useParametres() {
  return useQuery({ queryKey: ['parametres'], queryFn: apiParametres.lister });
}

/** Valeur d'un paramètre système (lue, jamais recalculée). */
export function valeurParametre(parametres: Parametre[] | undefined, cle: CleParametre): number | undefined {
  return parametres?.find((p) => p.cle === cle)?.valeur;
}

/** Alertes ouvertes : bandeau global, compteur du menu et notifications (rafraîchies toutes les 5 s). */
export function useAlertesOuvertes(actif = true) {
  return useQuery({
    queryKey: ['alertes', { statut: 'ouverte' }],
    queryFn: () => apiAlertes.lister({ statut: 'ouverte' }),
    refetchInterval: INTERVALLE,
    enabled: actif,
  });
}

export function useVerifications(actif = true) {
  return useQuery({
    queryKey: ['verifications', 'toutes'],
    queryFn: () => apiVerifications.lister(),
    refetchInterval: INTERVALLE,
    enabled: actif,
  });
}

export function useTourneesATrier(actif = true) {
  return useQuery({
    queryKey: ['tournees', { statut: 'collectee' }],
    queryFn: () => apiTournees.lister({ statut: 'collectee' }),
    enabled: actif,
  });
}
