/** Écran à ouvrir pour l'objet d'une notification (contrat 1.4.0), selon le rôle. */
import type { Notification, RoleControlCenter } from '@/api/types';

export function ecranDeNotification(n: Notification, role: RoleControlCenter): string | null {
  const id = n.objet_id;
  if (!id) return null;
  switch (n.objet_type) {
    case 'tournee':
      return role === 'operateur_tri' ? `/tri/${id}/saisie` : role === 'administrateur' ? '/admin/tournees' : null;
    case 'alerte':
      return `/methanisation/alertes?alerte=${id}`;
    case 'site':
      return `/methanisation/sites/${id}`;
    case 'utilisateur':
      return '/admin/verifications?onglet=compte_en_attente';
    case 'collecte':
      return '/admin/verifications?onglet=collecte_a_verifier';
    case 'bac':
      return role === 'administrateur' ? `/admin/bacs/${id}` : '/admin/verifications?onglet=bac_surinscrit';
    default:
      return null;
  }
}
