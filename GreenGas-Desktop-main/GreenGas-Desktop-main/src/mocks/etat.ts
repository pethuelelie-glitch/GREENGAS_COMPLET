/**
 * État en mémoire du faux backend, construit depuis docs/reference/seed.json.
 * Les objets sont stockés au plus près des modèles du Guide commun (§7) ;
 * les champs calculés sont ajoutés à la lecture par serialiseurs.ts.
 */
import seedJson from '../../docs/reference/seed.json';
import type { NotificationDB } from './notifications';
import type {
  Alerte,
  Bac,
  Categorie,
  CleParametre,
  Collecte,
  EntreeJournal,
  GreenPointsTransaction,
  LotTrie,
  MotifAffectation,
  NiveauContamination,
  Parametre,
  ProductionEnergie,
  ProfilCitoyen,
  Recompense,
  ResultatTri,
  Role,
  Scan,
  Secteur,
  Site,
  StatutScan,
  StatutTournee,
  StatutValidation,
  Utilisateur,
} from '@/api/types';

export type UtilisateurDB = Omit<Utilisateur, 'profil_citoyen'> & {
  mot_de_passe: string;
  profil_citoyen: Omit<ProfilCitoyen, 'code_bac'> | null;
  /** Bac de la résidence d'un référent (non exposé par le contrat, utilisé pour filtrer ses droits). */
  bac_id_referent: string | null;
};
export type SiteDB = Omit<Site, 'alertes_ouvertes'> & {
  /** Facteur de mesure du simulateur en fonctionnement normal (0,95 à 1,05). */
  facteur_nominal: number;
};
export type BacDB = Omit<Bac, 'scans_valides_periode' | 'nb_citoyens_valides' | 'date_derniere_collecte'>;
export type ScanDB = Omit<Scan, 'code_bac'>;
export interface TourneeDB {
  id: string;
  code: string;
  date: string;
  secteur_id: string;
  site_id: string;
  motif_affectation: MotifAffectation;
  collecteur_id: string;
  statut: StatutTournee;
  niveau_contamination: NiveauContamination | null;
  bac_ids: string[];
}
export type CollecteDB = Omit<Collecte, 'code_bac'>;
export type LotDB = LotTrie;
export type TriDB = Omit<ResultatTri, 'lots' | 'code_tournee'> & {
  /** Points du bac avant arrondi par citoyen, par collecte. */
  points_bac: Record<string, number>;
};
export type TransactionDB = Omit<GreenPointsTransaction, 'code_tournee'>;
export type ProductionDB = Omit<ProductionEnergie, 'code_site'>;
export type AlerteDB = Omit<Alerte, 'code_site'>;
export type JournalDB = Omit<EntreeJournal, 'nom_auteur'>;

export interface Etat {
  /** Incrémenté à chaque réinitialisation : les tâches différées d'un ancien état sont ignorées. */
  generation: number;
  secteurs: Secteur[];
  sites: SiteDB[];
  bacs: BacDB[];
  utilisateurs: UtilisateurDB[];
  scans: ScanDB[];
  tournees: TourneeDB[];
  collectes: CollecteDB[];
  lots: LotDB[];
  tris: Map<string, TriDB>;
  transactions: TransactionDB[];
  productions: ProductionDB[];
  alertes: AlerteDB[];
  parametres: Map<CleParametre, Parametre>;
  journal: JournalDB[];
  /** Notifications par destinataire (contrat 1.4.0), de la plus récente à la plus ancienne. */
  notifications: NotificationDB[];
  recompenses: Recompense[];
  /** Scénarios de simulation actifs : site_id → facteur_mesure. */
  scenarios: Map<string, number>;
  compteurs: { lots: Record<string, number>; uuid: Record<string, number> };
}

/* ---------- Lecture typée du seed ---------- */

interface SeedUtilisateur {
  id: string;
  nom: string;
  telephone: string;
  email: string | null;
  role: string;
  actif: boolean;
  /** État du compte (contrat 1.3.0) : valide, sauf le personnel inscrit lui-même avant décision. */
  statut_validation: string;
  mot_de_passe: string;
  date_creation: string;
  profil_citoyen: Omit<ProfilCitoyen, 'code_bac'> | null;
  /** Bac de la résidence d'un référent. */
  bac_id?: string | null;
}
interface SeedScan extends Omit<ScanDB, 'statut'> {
  statut: string;
}
interface SeedTournee extends Omit<TourneeDB, 'statut' | 'motif_affectation' | 'niveau_contamination'> {
  statut: string;
  motif_affectation: string;
  niveau_contamination: string | null;
}
interface SeedParametre {
  cle: string;
  valeur: number;
  unite: string;
  statut: string;
  description: string;
  source: string | null;
}

interface SeedLot extends Omit<LotDB, 'categorie' | 'destination'> {
  categorie: string;
  destination: string;
}
interface SeedTri extends Omit<TriDB, 'niveau_contamination'> {
  niveau_contamination: string;
}
interface SeedTransaction extends Omit<TransactionDB, 'statut'> {
  statut: string;
}
interface SeedCollecte extends Omit<CollecteDB, 'statut' | 'source' | 'statut_controle'> {
  code_bac?: string;
  statut: string;
  source: string;
  statut_controle: string;
}
interface SeedProduction extends Omit<ProductionDB, 'statut_journee' | 'destination_digestat' | 'statuts_donnees'> {
  code_site?: string;
  statut_journee: string;
  destination_digestat: string | null;
}

interface Seed {
  secteurs: Secteur[];
  sites: Omit<Site, 'alertes_ouvertes'>[];
  bacs: BacDB[];
  utilisateurs: SeedUtilisateur[];
  parametres: SeedParametre[];
  recompenses: Recompense[];
  scans: SeedScan[];
  tournees: SeedTournee[];
  collectes: SeedCollecte[];
  lots: SeedLot[];
  resultats_tri: SeedTri[];
  transactions: SeedTransaction[];
  productions: SeedProduction[];
  /** Dernier numéro de lot utilisé par préfixe : le prochain lot organique est ORG-0258. */
  compteurs_codes: { lots: Record<string, number> };
  /** Facteurs de mesure nominaux du simulateur, par code de site. */
  simulateur: { facteurs_nominaux: Record<string, number> };
}

const seed = seedJson as unknown as Seed;

/** Copie profonde : l'état modifiable ne touche jamais au seed importé. */
const copie = <T>(valeur: T): T => structuredClone(valeur);

export const PREFIXE_LOT: Record<Categorie, string> = {
  organique: 'ORG',
  biomasse: 'BIO',
  plastique: 'PLA',
  metal: 'MET',
  carton_papier: 'CAR',
  verre: 'VER',
  refus: 'REF',
};

export function creerEtat(generation = 0): Etat {
  const s = copie(seed);
  const etat: Etat = {
    generation,
    secteurs: s.secteurs,
    sites: s.sites.map((site) => ({ ...site, facteur_nominal: s.simulateur.facteurs_nominaux[site.code] ?? 1 })),
    bacs: s.bacs,
    utilisateurs: s.utilisateurs.map(({ bac_id, ...u }) => ({
      ...u,
      role: u.role as Role,
      statut_validation: u.statut_validation as StatutValidation,
      bac_id_referent: u.role === 'referent' ? (bac_id ?? null) : null,
    })),
    scans: s.scans.map((scan) => ({ ...scan, statut: scan.statut as StatutScan })),
    tournees: s.tournees.map((t) => ({
      ...t,
      statut: t.statut as StatutTournee,
      motif_affectation: t.motif_affectation as MotifAffectation,
      niveau_contamination: t.niveau_contamination as NiveauContamination | null,
    })),
    // Les champs dérivés du seed (code_bac, code_site) sont recalculés à la lecture par serialiseurs.ts.
    collectes: s.collectes.map(({ code_bac: _c, ...c }) => c as CollecteDB),
    lots: s.lots as LotDB[],
    tris: new Map(s.resultats_tri.map((r) => [r.tournee_id, r as TriDB])),
    transactions: s.transactions as TransactionDB[],
    productions: s.productions.map(({ code_site: _c, ...p }) => ({
      ...(p as Omit<ProductionDB, 'statuts_donnees'>),
      statuts_donnees: {},
    })),
    alertes: [],
    parametres: new Map(
      s.parametres.map((p) => [
        p.cle as CleParametre,
        {
          ...p,
          cle: p.cle as CleParametre,
          statut: p.statut as Parametre['statut'],
          date_modification: '2026-09-01T08:00:00Z',
        },
      ]),
    ),
    journal: [],
    notifications: [],
    recompenses: s.recompenses,
    scenarios: new Map(),
    compteurs: { lots: { ...s.compteurs_codes.lots }, uuid: {} },
  };
  etat.compteurs.uuid = derniersNumeros(etat);
  return etat;
}

const FORMAT_UUID = /^([0-9a-f]{8})-0000-4000-8000-(\d{12})$/;

/** Dernier numéro utilisé par préfixe d'UUID dans le seed : les nouveaux objets ne le réutilisent jamais. */
function derniersNumeros(etat: Etat): Record<string, number> {
  const numeros: Record<string, number> = {};
  const collections: { id: string }[][] = [
    etat.secteurs,
    etat.sites,
    etat.bacs,
    etat.utilisateurs,
    etat.scans,
    etat.tournees,
    etat.collectes,
    etat.lots,
    etat.transactions,
    etat.productions,
    etat.recompenses,
  ];
  for (const { id } of collections.flat()) {
    const m = FORMAT_UUID.exec(id);
    if (m) numeros[m[1]] = Math.max(numeros[m[1]] ?? 0, Number(m[2]));
  }
  return numeros;
}

/** Identifiant UUID lisible, sur le modèle du seed (`9d000000-0000-4000-8000-000000000022`). */
export function nouvelUuid(etat: Etat, prefixe: string, depart = 0): string {
  const n = Math.max(etat.compteurs.uuid[prefixe] ?? 0, depart) + 1;
  etat.compteurs.uuid[prefixe] = n;
  return `${prefixe}-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

/** Validation du personnel par un administrateur (contrat 1.5.0) : paramètre `validation_comptes_personnel`, 1 = activée. */
export function validationPersonnelActive(etat: Etat): boolean {
  return etat.parametres.get('validation_comptes_personnel')?.valeur === 1;
}

/** Compte qui peut se connecter : actif, et validé (ou en attente quand la validation est désactivée). */
export function peutSeConnecter(etat: Etat, u: UtilisateurDB): boolean {
  if (!u.actif || u.statut_validation === 'refuse') return false;
  return u.statut_validation === 'valide' || !validationPersonnelActive(etat);
}
