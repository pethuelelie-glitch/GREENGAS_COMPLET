/** Lectures composées du faux backend : vue globale, file de vérification, traçabilité, solde. */
import type {
  ElementVerification,
  ProductionGlobale,
  Solde,
  TracabiliteBac,
  TypeVerification,
} from '@/api/types';
import { nombre } from '@/lib/format';
import { LIBELLE_ROLE } from '@/lib/libelles';
import { arrondi, param, productionDuJour } from './calculs';
import type { Etat, UtilisateurDB } from './etat';
import {
  bacApi,
  collecteApi,
  lotsDeTournee,
  productionApi,
  tourneeApi,
  transactionApi,
} from './serialiseurs';

export function productionGlobale(etat: Etat, date: string): ProductionGlobale {
  const parSite = etat.sites.map((s) => productionDuJour(etat, s.id, date));
  const somme = (cle: 'poids_organique_recu_kg' | 'biogaz_attendu_m3' | 'biogaz_mesure_m3' | 'electricite_kwh' | 'chaleur_kwh' | 'digestat_kg') =>
    arrondi(parSite.reduce((s, p) => s + (p[cle] ?? 0), 0));
  const electricite = somme('electricite_kwh');
  return {
    date,
    nb_sites: etat.sites.length,
    poids_organique_recu_kg: somme('poids_organique_recu_kg'),
    biogaz_attendu_m3: somme('biogaz_attendu_m3'),
    biogaz_mesure_m3: somme('biogaz_mesure_m3'),
    electricite_kwh: electricite,
    chaleur_kwh: somme('chaleur_kwh'),
    digestat_kg: somme('digestat_kg'),
    foyers_equivalents: arrondi((electricite * 365) / param(etat, 'conso_electrique_foyer_kwh_an'), 1),
    alertes_ouvertes: etat.alertes.filter((a) => a.statut === 'ouverte').length,
    par_site: parSite.map((p) => productionApi(etat, p)),
  };
}

/** File de vérification, du plus ancien au plus récent. Le référent ne voit que les comptes de sa résidence. */
export function verifications(etat: Etat, auteur: UtilisateurDB, type?: TypeVerification): ElementVerification[] {
  const codeBac = (id: string) => etat.bacs.find((b) => b.id === id)?.code ?? '';
  const nomCitoyen = (id: string) => etat.utilisateurs.find((u) => u.id === id)?.nom ?? '';
  const elements: ElementVerification[] = [];

  for (const c of etat.collectes.filter((x) => x.statut_controle === 'a_verifier')) {
    const tournee = etat.tournees.find((t) => t.id === c.tournee_id);
    elements.push({
      type: 'collecte_a_verifier',
      objet_type: 'collecte',
      objet_id: c.id,
      libelle: `${codeBac(c.bac_id)} : ${nombre(c.poids_net_kg)} kg pour ${c.scans_valides} scans (${nombre(c.kg_par_scan, 2)} kg/scan)`,
      details: {
        code_bac: codeBac(c.bac_id),
        bac_id: c.bac_id,
        poids_net_kg: c.poids_net_kg,
        scans_valides: c.scans_valides,
        kg_par_scan: c.kg_par_scan,
        seuil: param(etat, 'seuil_kg_par_scan'),
        code_tournee: tournee?.code ?? null,
        tournee_triee: tournee?.statut === 'triee',
      },
      date: c.date_validation ?? c.date_ouverture,
    });
  }

  // Contrat 1.3.0 : seuls les comptes du personnel inscrit lui-même attendent un administrateur.
  for (const u of etat.utilisateurs.filter((x) => x.actif && x.statut_validation === 'en_attente')) {
    elements.push({
      type: 'compte_en_attente',
      objet_type: 'utilisateur',
      objet_id: u.id,
      libelle: `${u.nom}, ${LIBELLE_ROLE[u.role]}`,
      details: { nom: u.nom, role: u.role, telephone: u.telephone, email: u.email },
      date: u.date_creation,
    });
  }

  for (const s of etat.scans.filter((x) => x.statut === 'hors_zone' || x.statut === 'non_localise')) {
    const horsZone = s.statut === 'hors_zone';
    const distance = s.distance_m ?? 0;
    const loin = distance >= 1000 ? `${nombre(distance / 1000, 1)} km` : `${nombre(distance)} m`;
    elements.push({
      type: horsZone ? 'scan_hors_zone' : 'scan_non_localise',
      objet_type: 'scan',
      objet_id: s.id,
      libelle: horsZone
        ? `${nomCitoyen(s.citoyen_id)}, à ${loin} du bac ${codeBac(s.bac_id)}`
        : `${nomCitoyen(s.citoyen_id)}, scan sans position sur ${codeBac(s.bac_id)}`,
      details: { code_bac: codeBac(s.bac_id), bac_id: s.bac_id, distance_m: s.distance_m, citoyen: nomCitoyen(s.citoyen_id) },
      date: s.horodatage,
    });
  }

  for (const b of etat.bacs) {
    const api = bacApi(etat, b);
    if (api.nb_citoyens_valides > b.nb_foyers_declares) {
      elements.push({
        type: 'bac_surinscrit',
        objet_type: 'bac',
        objet_id: b.id,
        libelle: `${b.code} : ${api.nb_citoyens_valides} comptes pour ${b.nb_foyers_declares} foyers déclarés`,
        details: { code_bac: b.code, bac_id: b.id, nb_comptes: api.nb_citoyens_valides, nb_foyers_declares: b.nb_foyers_declares },
        date: b.date_creation,
      });
    }
  }

  return elements
    .filter((e) => !type || e.type === type)
    // Le référent garde les signaux de sa résidence, jamais les comptes du personnel en attente.
    .filter(
      (e) =>
        auteur.role !== 'referent' || (e.type !== 'compte_en_attente' && e.details.bac_id === auteur.bac_id_referent),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Historique complet d'un bac : une étape par collecte, de la plus récente à la plus ancienne. */
export function tracabilite(etat: Etat, bacId: string): TracabiliteBac | null {
  const bac = etat.bacs.find((b) => b.id === bacId);
  if (!bac) return null;
  const citoyens = etat.utilisateurs
    .filter((u) => u.role === 'citoyen' && u.profil_citoyen?.bac_id === bacId)
    .map((u) => ({ id: u.id, nom: u.nom, statut_validation: u.profil_citoyen?.statut_validation ?? 'en_attente' }));
  const collectes = etat.collectes
    .filter((c) => c.bac_id === bacId)
    .sort((a, b) => (b.date_validation ?? b.date_ouverture).localeCompare(a.date_validation ?? a.date_ouverture));
  const historique = collectes.flatMap((c) => {
    const tournee = etat.tournees.find((t) => t.id === c.tournee_id);
    if (!tournee) return [];
    const tri = etat.tris.get(tournee.id);
    const production = tri ? etat.productions.find((p) => p.site_id === tournee.site_id && p.date === tournee.date) : null;
    return [
      {
        collecte: collecteApi(etat, c),
        tournee: tourneeApi(etat, tournee),
        lots: tri ? lotsDeTournee(etat, tournee.id) : [],
        valeur_kg: tri?.valeur_kg ?? null,
        coef_qualite: tri?.coef_qualite ?? null,
        points_bac: tri ? (tri.points_bac[c.id] ?? null) : null,
        transactions: etat.transactions.filter((t) => t.collecte_id === c.id).map((t) => transactionApi(etat, t)),
        production: production ? productionApi(etat, production) : null,
      },
    ];
  });
  return { bac: bacApi(etat, bac), citoyens, historique };
}

export function solde(etat: Etat, citoyenId: string): Solde {
  const tx = etat.transactions.filter((t) => t.citoyen_id === citoyenId);
  const gagne = tx.filter((t) => t.statut === 'creditee').reduce((s, t) => s + t.points, 0);
  return {
    citoyen_id: citoyenId,
    solde: gagne,
    points_en_attente: tx.filter((t) => t.statut === 'en_attente').reduce((s, t) => s + t.points, 0),
    total_gagne: gagne,
    total_echange: 0,
  };
}
