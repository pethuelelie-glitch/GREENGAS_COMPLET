/**
 * Notifications du faux backend (contrat 1.4.0, docs/partage/NOTE_BACKEND_notifications.md) :
 * créées par le serveur au moment de l'événement, pour chaque destinataire, avec les textes de la note.
 */
import type { Notification, NiveauNotification, Role, TypeNotification, TypeObjet } from '@/api/types';
import { nombre } from '@/lib/format';
import type { Etat, UtilisateurDB } from './etat';
import { nouvelUuid, validationPersonnelActive } from './etat';
import { maintenant } from './horloge';
import { bacApi, tourneeApi } from './serialiseurs';

export type NotificationDB = Notification & { destinataire_id: string };

interface Contenu {
  type: TypeNotification;
  niveau: NiveauNotification;
  titre: string;
  message: string;
  objet_type: TypeObjet | null;
  objet_id: string | null;
}

/** Types pour lesquels on ne recrée pas une notification identique encore non lue. */
const SANS_DOUBLON: TypeNotification[] = ['bac_surinscrit', 'collecte_a_verifier'];

export const destinatairesRoles = (etat: Etat, ...roles: Role[]) =>
  etat.utilisateurs.filter((u) => u.actif && u.statut_validation === 'valide' && roles.includes(u.role));

export const referentDuBac = (etat: Etat, bacId: string) =>
  etat.utilisateurs.filter((u) => u.actif && u.role === 'referent' && u.bac_id_referent === bacId);

/** Crée la notification pour chaque destinataire, sauf l'auteur de l'action et les doublons non lus. */
export function notifier(
  etat: Etat,
  destinataires: UtilisateurDB[],
  contenu: Contenu,
  options: { auteurId?: string; date?: string } = {},
): void {
  const vus = new Set<string>();
  for (const d of destinataires) {
    if (vus.has(d.id) || d.id === options.auteurId || d.role === 'capteur') continue;
    vus.add(d.id);
    const doublon =
      SANS_DOUBLON.includes(contenu.type) &&
      etat.notifications.some(
        (n) => n.destinataire_id === d.id && n.type === contenu.type && n.objet_id === contenu.objet_id && !n.lue,
      );
    if (doublon) continue;
    etat.notifications.unshift({
      id: nouvelUuid(etat, '0b1f0000'),
      destinataire_id: d.id,
      ...contenu,
      lue: false,
      date_creation: options.date ?? maintenant(),
      date_lecture: null,
    });
  }
}

/** Marque comme lues les notifications d'un objet (ex. « à trier » d'une tournée qui vient d'être triée). */
export function marquerLuesPourObjet(etat: Etat, type: TypeNotification, objetId: string): void {
  const instant = maintenant();
  for (const n of etat.notifications) {
    if (n.type === type && n.objet_id === objetId && !n.lue) {
      n.lue = true;
      n.date_lecture = instant;
    }
  }
}

export function notificationApi(n: NotificationDB): Notification {
  const { destinataire_id: _d, ...notification } = n;
  return notification;
}

/* ---------- Textes de la note (§2) ---------- */

export function contenuTourneeATrier(etat: Etat, tourneeId: string): Contenu | null {
  const t = etat.tournees.find((x) => x.id === tourneeId);
  if (!t) return null;
  const secteur = etat.secteurs.find((s) => s.id === t.secteur_id)?.code ?? '';
  return {
    type: 'tournee_a_trier',
    niveau: 'info',
    titre: 'Tournée à trier',
    message: `${t.code} (${secteur}, ${nombre(tourneeApi(etat, t).poids_collecte_kg)} kg) attend son tri.`,
    objet_type: 'tournee',
    objet_id: t.id,
  };
}

export function contenuCompteAValider(u: UtilisateurDB): Contenu {
  const role = u.role === 'operateur_tri' ? 'opérateur de tri' : 'responsable méthanisation';
  return {
    type: 'compte_a_valider',
    niveau: 'attention',
    titre: 'Compte à valider',
    message: `${u.nom} demande un accès ${role}.`,
    objet_type: 'utilisateur',
    objet_id: u.id,
  };
}

export function notifierBacSurinscrit(etat: Etat, bacId: string, auteurId?: string): void {
  const bac = etat.bacs.find((b) => b.id === bacId);
  if (!bac) return;
  const api = bacApi(etat, bac);
  if (api.nb_citoyens_valides <= bac.nb_foyers_declares) return;
  notifier(
    etat,
    [...destinatairesRoles(etat, 'administrateur'), ...referentDuBac(etat, bacId)],
    {
      type: 'bac_surinscrit',
      niveau: 'info',
      titre: 'Bac surinscrit',
      message: `${bac.code} : ${api.nb_citoyens_valides} comptes pour ${bac.nb_foyers_declares} foyers.`,
      objet_type: 'bac',
      objet_id: bac.id,
    },
    { auteurId },
  );
}

/** Notifications présentes au chargement du seed (note §4), datées du 12/09 à 09:00 UTC, non lues. */
export function notificationsDeDepart(etat: Etat): void {
  const date = '2026-09-12T09:00:00Z';
  const parNom = (nom: string) => etat.utilisateurs.filter((u) => u.nom === nom);
  const admins = destinatairesRoles(etat, 'administrateur');
  const aya = parNom('Aya Opératrice');

  for (const code of ['TRN-0912-01', 'TRN-0912-02']) {
    const t = etat.tournees.find((x) => x.code === code);
    const contenu = t && contenuTourneeATrier(etat, t.id);
    if (contenu) notifier(etat, aya, contenu, { date });
  }
  // Comptes à valider : seulement si la validation du personnel est activée (contrat 1.5.0).
  const aValider = validationPersonnelActive(etat)
    ? etat.utilisateurs.filter((x) => x.statut_validation === 'en_attente')
    : [];
  for (const u of aValider) {
    notifier(etat, admins, contenuCompteAValider(u), { date });
  }
  const bac022 = etat.bacs.find((b) => b.code === 'BAC-022');
  if (bac022) {
    const collecte = etat.collectes.find((c) => c.bac_id === bac022.id && c.statut_controle === 'a_verifier');
    if (collecte) {
      notifier(
        etat,
        [...admins, ...referentDuBac(etat, bac022.id)],
        {
          type: 'collecte_a_verifier',
          niveau: 'attention',
          titre: 'Collecte à vérifier',
          message: `${bac022.code} : ${nombre(collecte.poids_net_kg)} kg pour ${collecte.scans_valides} scans (${nombre(collecte.kg_par_scan, 2)} kg/scan).`,
          objet_type: 'collecte',
          objet_id: collecte.id,
        },
        { date },
      );
    }
    const api = bacApi(etat, bac022);
    notifier(
      etat,
      [...admins, ...referentDuBac(etat, bac022.id)],
      {
        type: 'bac_surinscrit',
        niveau: 'info',
        titre: 'Bac surinscrit',
        message: `${bac022.code} : ${api.nb_citoyens_valides} comptes pour ${bac022.nb_foyers_declares} foyers.`,
        objet_type: 'bac',
        objet_id: bac022.id,
      },
      { date },
    );
  }
}
