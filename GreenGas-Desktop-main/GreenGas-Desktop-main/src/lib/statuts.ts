/**
 * Correspondance entre une valeur de statut, son ton (jeton de couleur) et son icône.
 * Un statut n'est jamais indiqué par la couleur seule : la pastille porte toujours l'icône et le texte.
 */
import {
  CircleCheck,
  Clock,
  Lock,
  TriangleAlert,
  Wrench,
  CircleDashed,
  type LucideIcon,
} from 'lucide-react';
import type {
  StatutAlerte,
  StatutBac,
  StatutControle,
  StatutJournee,
  StatutParametre,
  StatutSite,
  StatutTournee,
  StatutTransaction,
  StatutValidation,
} from '@/api/types';
import {
  LIBELLE_STATUT_ALERTE,
  LIBELLE_STATUT_BAC,
  LIBELLE_STATUT_CONTROLE,
  LIBELLE_STATUT_JOURNEE,
  LIBELLE_STATUT_PARAMETRE,
  LIBELLE_STATUT_SITE,
  LIBELLE_STATUT_TOURNEE,
  LIBELLE_STATUT_TRANSACTION,
  LIBELLE_STATUT_VALIDATION,
} from './libelles';

export type Ton = 'ok' | 'alerte' | 'attention' | 'neutre';

export interface ApparenceStatut {
  ton: Ton;
  icone: LucideIcon;
  libelle: string;
}

const ok = (libelle: string): ApparenceStatut => ({ ton: 'ok', icone: CircleCheck, libelle });
const alerte = (libelle: string): ApparenceStatut => ({ ton: 'alerte', icone: TriangleAlert, libelle });
const attention = (libelle: string): ApparenceStatut => ({ ton: 'attention', icone: Clock, libelle });
const neutre = (libelle: string, icone: LucideIcon = Lock): ApparenceStatut => ({ ton: 'neutre', icone, libelle });

export const STATUT_SITE: Record<StatutSite, ApparenceStatut> = {
  nominal: ok(LIBELLE_STATUT_SITE.nominal),
  alerte: alerte(LIBELLE_STATUT_SITE.alerte),
  maintenance: neutre(LIBELLE_STATUT_SITE.maintenance, Wrench),
};

export const STATUT_TOURNEE: Record<StatutTournee, ApparenceStatut> = {
  planifiee: neutre(LIBELLE_STATUT_TOURNEE.planifiee, CircleDashed),
  en_cours: attention(LIBELLE_STATUT_TOURNEE.en_cours),
  collectee: attention(LIBELLE_STATUT_TOURNEE.collectee),
  triee: ok(LIBELLE_STATUT_TOURNEE.triee),
};

export const STATUT_CONTROLE: Record<StatutControle, ApparenceStatut> = {
  normal: ok(LIBELLE_STATUT_CONTROLE.normal),
  a_verifier: attention(LIBELLE_STATUT_CONTROLE.a_verifier),
  points_valides: ok(LIBELLE_STATUT_CONTROLE.points_valides),
  points_annules: neutre(LIBELLE_STATUT_CONTROLE.points_annules),
};

export const STATUT_ALERTE: Record<StatutAlerte, ApparenceStatut> = {
  ouverte: alerte(LIBELLE_STATUT_ALERTE.ouverte),
  resolue: ok(LIBELLE_STATUT_ALERTE.resolue),
};

export const STATUT_TRANSACTION: Record<StatutTransaction, ApparenceStatut> = {
  creditee: ok(LIBELLE_STATUT_TRANSACTION.creditee),
  en_attente: attention(LIBELLE_STATUT_TRANSACTION.en_attente),
  annulee: neutre(LIBELLE_STATUT_TRANSACTION.annulee),
};

export const STATUT_VALIDATION: Record<StatutValidation, ApparenceStatut> = {
  valide: ok(LIBELLE_STATUT_VALIDATION.valide),
  en_attente: attention(LIBELLE_STATUT_VALIDATION.en_attente),
  refuse: neutre(LIBELLE_STATUT_VALIDATION.refuse),
};

export const STATUT_BAC: Record<StatutBac, ApparenceStatut> = {
  actif: ok(LIBELLE_STATUT_BAC.actif),
  inactif: neutre(LIBELLE_STATUT_BAC.inactif),
};

export const STATUT_JOURNEE: Record<StatutJournee, ApparenceStatut> = {
  ouverte: attention(LIBELLE_STATUT_JOURNEE.ouverte),
  cloturee: neutre(LIBELLE_STATUT_JOURNEE.cloturee),
};

export const STATUT_PARAMETRE: Record<StatutParametre, ApparenceStatut> = {
  aligne: ok(LIBELLE_STATUT_PARAMETRE.aligne),
  illustratif: attention(LIBELLE_STATUT_PARAMETRE.illustratif),
  a_sourcer: attention(LIBELLE_STATUT_PARAMETRE.a_sourcer),
  a_calibrer: attention(LIBELLE_STATUT_PARAMETRE.a_calibrer),
  v2: neutre(LIBELLE_STATUT_PARAMETRE.v2, CircleDashed),
};

/** Compte actif / désactivé (champ booléen `actif`). */
export const STATUT_COMPTE = {
  actif: ok('Actif'),
  desactive: neutre('Désactivé'),
} as const;

/** Variantes construites à l'écran à partir d'un statut du contrat (ex. « Surinscrit »). */
export const apparence = (ton: Ton, libelle: string): ApparenceStatut =>
  ({ ok, alerte, attention, neutre })[ton](libelle);
