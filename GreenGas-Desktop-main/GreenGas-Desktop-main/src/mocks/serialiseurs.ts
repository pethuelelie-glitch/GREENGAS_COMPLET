/**
 * Mise au format du contrat (openapi.yaml) des objets de l'état en mémoire,
 * avec les champs calculés par le serveur (`alertes_ouvertes`, `code_site`, `poids_collecte_kg`…).
 */
import type {
  Alerte,
  Bac,
  Collecte,
  EntreeJournal,
  GreenPointsTransaction,
  LotTrie,
  ProductionEnergie,
  ResultatTri,
  Scan,
  Site,
  Tournee,
  TourneeDetail,
  Utilisateur,
} from '@/api/types';
import { arrondi } from './calculs';
import type {
  AlerteDB,
  BacDB,
  CollecteDB,
  Etat,
  JournalDB,
  ProductionDB,
  ScanDB,
  SiteDB,
  TourneeDB,
  TransactionDB,
  TriDB,
  UtilisateurDB,
} from './etat';

const codeBac = (etat: Etat, bacId: string) => etat.bacs.find((b) => b.id === bacId)?.code ?? '';
const codeSite = (etat: Etat, siteId: string) => etat.sites.find((s) => s.id === siteId)?.code ?? '';

export function utilisateurApi(etat: Etat, u: UtilisateurDB): Utilisateur {
  return {
    id: u.id,
    nom: u.nom,
    telephone: u.telephone,
    email: u.email ?? null,
    role: u.role,
    actif: u.actif,
    statut_validation: u.statut_validation,
    date_creation: u.date_creation,
    profil_citoyen: u.profil_citoyen ? { ...u.profil_citoyen, code_bac: codeBac(etat, u.profil_citoyen.bac_id) } : null,
  };
}

export function siteApi(etat: Etat, s: SiteDB): Site {
  const { facteur_nominal: _f, ...site } = s;
  return {
    ...site,
    alertes_ouvertes: etat.alertes.filter((a) => a.site_id === s.id && a.statut === 'ouverte').length,
  };
}

export function dateDerniereCollecte(etat: Etat, bacId: string): string | null {
  const dates = etat.collectes
    .filter((c) => c.bac_id === bacId && c.statut === 'validee' && c.date_validation)
    .map((c) => c.date_validation as string)
    .sort();
  return dates.at(-1) ?? null;
}

export function bacApi(etat: Etat, b: BacDB): Bac {
  const derniere = dateDerniereCollecte(etat, b.id);
  return {
    ...b,
    scans_valides_periode: etat.scans.filter(
      (s) => s.bac_id === b.id && s.compte && (!derniere || s.horodatage > derniere),
    ).length,
    nb_citoyens_valides: etat.utilisateurs.filter(
      (u) => u.actif && u.profil_citoyen?.bac_id === b.id && u.profil_citoyen.statut_validation === 'valide',
    ).length,
    date_derniere_collecte: derniere,
  };
}

export function scanApi(etat: Etat, s: ScanDB): Scan {
  return { ...s, code_bac: codeBac(etat, s.bac_id) };
}

export function collecteApi(etat: Etat, c: CollecteDB): Collecte {
  return { ...c, code_bac: codeBac(etat, c.bac_id) };
}

export function tourneeApi(etat: Etat, t: TourneeDB): Tournee {
  const validees = etat.collectes.filter((c) => c.tournee_id === t.id && c.statut === 'validee');
  return {
    id: t.id,
    code: t.code,
    date: t.date,
    secteur_id: t.secteur_id,
    site_id: t.site_id,
    code_site: codeSite(etat, t.site_id),
    motif_affectation: t.motif_affectation,
    collecteur_id: t.collecteur_id,
    statut: t.statut,
    niveau_contamination: t.niveau_contamination,
    nb_bacs: t.bac_ids.length,
    nb_bacs_collectes: validees.length,
    poids_collecte_kg: arrondi(validees.reduce((s, c) => s + (c.poids_net_kg ?? 0), 0)),
  };
}

export function tourneeDetailApi(etat: Etat, t: TourneeDB): TourneeDetail {
  return {
    ...tourneeApi(etat, t),
    bacs: t.bac_ids.flatMap((id) => {
      const b = etat.bacs.find((x) => x.id === id);
      return b ? [bacApi(etat, b)] : [];
    }),
    collectes: etat.collectes.filter((c) => c.tournee_id === t.id).map((c) => collecteApi(etat, c)),
  };
}

export function lotsDeTournee(etat: Etat, tourneeId: string): LotTrie[] {
  return etat.lots.filter((l) => l.tournee_id === tourneeId);
}

export function resultatTriApi(etat: Etat, tri: TriDB): ResultatTri {
  const { points_bac: _p, ...resultat } = tri;
  const tournee = etat.tournees.find((t) => t.id === tri.tournee_id);
  return { ...resultat, code_tournee: tournee?.code ?? '', lots: lotsDeTournee(etat, tri.tournee_id) };
}

export function transactionApi(etat: Etat, t: TransactionDB): GreenPointsTransaction {
  return { ...t, code_tournee: etat.tournees.find((x) => x.id === t.tournee_id)?.code ?? '' };
}

export function productionApi(etat: Etat, p: ProductionDB): ProductionEnergie {
  return { ...p, code_site: codeSite(etat, p.site_id) };
}

export function alerteApi(etat: Etat, a: AlerteDB): Alerte {
  return { ...a, code_site: codeSite(etat, a.site_id) };
}

export function journalApi(etat: Etat, j: JournalDB): EntreeJournal {
  return { ...j, nom_auteur: etat.utilisateurs.find((u) => u.id === j.auteur_id)?.nom ?? 'Système' };
}
