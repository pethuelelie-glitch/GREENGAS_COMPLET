/** Requêtes TanStack Query du domaine « administration ». */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiBacs,
  apiJournal,
  apiParametres,
  apiScans,
  apiUtilisateurs,
  apiVerifications,
} from '@/api/administration';
import { apiProductions } from '@/api/productions';
import type { FiltresBacs, FiltresCollectes, FiltresJournal, FiltresUtilisateurs } from '@/api/requetes';
import { apiSimulation } from '@/api/simulation';
import { apiSecteurs } from '@/api/sites';
import { apiCollectes, apiTournees } from '@/api/tournees';
import type {
  BacEcriture,
  CleParametre,
  TourneeCreation,
  UtilisateurCreation,
  UtilisateurModification,
} from '@/api/types';
import { INTERVALLE } from '@/hooks/referentiel';

function useInvalider() {
  const queryClient = useQueryClient();
  return (...cles: string[]) => {
    for (const cle of [...cles, 'journal']) void queryClient.invalidateQueries({ queryKey: [cle] });
  };
}

/* ---------- Lectures ---------- */

export const useBacs = (filtres: FiltresBacs = {}) =>
  useQuery({ queryKey: ['bacs', filtres], queryFn: () => apiBacs.lister(filtres) });

export const useBac = (id: string | undefined) =>
  useQuery({ queryKey: ['bac', id], queryFn: () => apiBacs.detail(id as string), enabled: !!id });

export const useTracabilite = (bacId: string | undefined) =>
  useQuery({ queryKey: ['bac-tracabilite', bacId], queryFn: () => apiBacs.tracabilite(bacId as string), enabled: !!bacId });

export const useCollectes = (filtres: FiltresCollectes = {}, actif = true) =>
  useQuery({ queryKey: ['collectes', filtres], queryFn: () => apiCollectes.lister(filtres), enabled: actif });

export const useUtilisateurs = (filtres: FiltresUtilisateurs = {}, actif = true) =>
  useQuery({ queryKey: ['utilisateurs', filtres], queryFn: () => apiUtilisateurs.lister(filtres), enabled: actif });

export const useScans = (bacId: string | undefined) =>
  useQuery({ queryKey: ['scans', bacId], queryFn: () => apiScans.lister({ bac_id: bacId }), enabled: !!bacId });

export const useListeVerifications = () =>
  useQuery({ queryKey: ['verifications', 'toutes'], queryFn: () => apiVerifications.lister(), refetchInterval: INTERVALLE });

export const useJournal = (filtres: FiltresJournal = {}) =>
  useQuery({ queryKey: ['journal', filtres], queryFn: () => apiJournal.lister(filtres) });

export const useScenarios = () => useQuery({ queryKey: ['scenarios'], queryFn: apiSimulation.scenarios, refetchInterval: INTERVALLE });

export const useToutesTournees = () => useQuery({ queryKey: ['tournees', {}], queryFn: () => apiTournees.lister() });

export const useProductionsDuJour = (date: string) =>
  useQuery({ queryKey: ['production-globale', date], queryFn: () => apiProductions.globale(date), refetchInterval: INTERVALLE });

/* ---------- Actions ---------- */

export function useForcerFacteur() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: ({ siteId, facteur }: { siteId: string; facteur: number }) => apiSimulation.forcerFacteur(siteId, facteur),
    onSuccess: () => invalider('scenarios', 'sites', 'site', 'productions', 'production-globale', 'alertes'),
  });
}

export function useRetablirNominal() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: (siteId: string) => apiSimulation.retablir(siteId),
    onSuccess: () => {
      invalider('scenarios');
      // La mesure nominale arrive juste après la suppression du scénario.
      window.setTimeout(() => invalider('sites', 'site', 'productions', 'production-globale', 'alertes'), 400);
    },
  });
}

export function useDeciderCollecte() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: ({ id, decision, commentaire }: { id: string; decision: 'valider_points' | 'annuler_points'; commentaire: string }) =>
      apiCollectes.decider(id, decision, commentaire),
    onSuccess: () => invalider('verifications', 'collectes', 'tri', 'bac-tracabilite', 'bacs'),
  });
}

export function useDeciderCompte() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: ({ id, decision, commentaire }: { id: string; decision: 'valider' | 'refuser'; commentaire?: string }) =>
      apiUtilisateurs.decider(id, decision, commentaire),
    onSuccess: () => invalider('verifications', 'utilisateurs', 'bacs', 'bac', 'bac-tracabilite'),
  });
}

export function useCreerUtilisateur() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: (corps: UtilisateurCreation) => apiUtilisateurs.creer(corps),
    onSuccess: () => invalider('utilisateurs', 'bacs', 'verifications'),
  });
}

export function useModifierUtilisateur() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: ({ id, corps }: { id: string; corps: UtilisateurModification }) => apiUtilisateurs.modifier(id, corps),
    onSuccess: () => invalider('utilisateurs', 'bacs', 'verifications', 'bac-tracabilite'),
  });
}

export function useCreerBac() {
  const invalider = useInvalider();
  return useMutation({ mutationFn: (corps: BacEcriture) => apiBacs.creer(corps), onSuccess: () => invalider('bacs') });
}

export function useModifierBac() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: ({ id, corps }: { id: string; corps: BacEcriture }) => apiBacs.modifier(id, corps),
    onSuccess: () => invalider('bacs', 'bac', 'bac-tracabilite'),
  });
}

export function useModifierSecteur() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: ({ id, corps }: { id: string; corps: { site_id?: string; site_repli_id?: string } }) => apiSecteurs.modifier(id, corps),
    onSuccess: () => invalider('secteurs'),
  });
}

export function usePlanifierTournee() {
  const invalider = useInvalider();
  return useMutation({ mutationFn: (corps: TourneeCreation) => apiTournees.planifier(corps), onSuccess: () => invalider('tournees') });
}

export function useModifierParametre() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: ({ cle, valeur }: { cle: CleParametre; valeur: number }) => apiParametres.modifier(cle, valeur),
    onSuccess: () => invalider('parametres'),
  });
}
