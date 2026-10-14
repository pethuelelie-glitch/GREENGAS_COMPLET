/** Notifications de l'utilisateur connecté (contrat 1.4.0). Clés de cache : ['notifications', …]. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiNotifications } from '@/api/notifications';
import { INTERVALLE } from './referentiel';

/** Nombre de non lues, pour la pastille (toutes les 5 s). */
export const useCompteurNotifications = () =>
  useQuery({
    queryKey: ['notifications', 'compteur'],
    queryFn: apiNotifications.compteur,
    refetchInterval: INTERVALLE,
  });

/** Non lues (couleur de la pastille, toast des nouvelles critiques), seulement s'il y en a. */
export const useNotificationsNonLues = (actif: boolean) =>
  useQuery({
    queryKey: ['notifications', 'non-lues'],
    queryFn: apiNotifications.nonLues,
    refetchInterval: INTERVALLE,
    enabled: actif,
  });

/** Les plus récentes : 20 pour le panneau (chargées à l'ouverture), davantage pour la page. */
export const useListeNotifications = (actif: boolean, taille = 20, lue?: boolean) =>
  useQuery({
    queryKey: ['notifications', 'liste', taille, lue ?? 'toutes'],
    queryFn: () => apiNotifications.lister(taille, lue),
    enabled: actif,
    refetchInterval: actif ? INTERVALLE : false,
  });

function useInvaliderNotifications() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ['notifications'] });
}

export function useMarquerLue() {
  const invalider = useInvaliderNotifications();
  return useMutation({ mutationFn: apiNotifications.marquerLue, onSuccess: invalider });
}

export function useToutLire() {
  const invalider = useInvaliderNotifications();
  return useMutation({ mutationFn: apiNotifications.toutLire, onSuccess: invalider });
}
