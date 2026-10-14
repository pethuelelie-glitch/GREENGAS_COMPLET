/**
 * Calculs du faux backend : reproduction fidèle du Guide commun §3 et §8.
 * Ce fichier remplace le backend Django ; aucun écran ne doit l'importer.
 */
import type {
  Categorie,
  CleParametre,
  Destination,
  MesureSite,
  NiveauContamination,
  StatutDonnee,
  StatutTransaction,
  TriRequete,
  TypeAlerte,
  TypeObjet,
} from '@/api/types';
import { nombre } from '@/lib/format';
import { ErreurMock, introuvable, validation } from './erreurs';
import { destinatairesRoles, notifier } from './notifications';
import {
  nouvelUuid,
  PREFIXE_LOT,
  type CollecteDB,
  type Etat,
  type LotDB,
  type ProductionDB,
  type SiteDB,
  type TourneeDB,
  type TransactionDB,
  type TriDB,
} from './etat';
import { maintenant } from './horloge';

export const ID_SIMULATEUR = 'a0000000-0000-4000-8000-000000000006';

export function arrondi(valeur: number, decimales = 2): number {
  const f = 10 ** decimales;
  return Math.round((valeur + Math.sign(valeur) * Number.EPSILON) * f) / f;
}

export function param(etat: Etat, cle: CleParametre): number {
  const p = etat.parametres.get(cle);
  if (!p) throw new ErreurMock(500, 'ERREUR_SERVEUR', `Paramètre manquant : ${cle}`);
  return p.valeur;
}

export const CATEGORIES: Categorie[] = [
  'organique',
  'biomasse',
  'plastique',
  'metal',
  'carton_papier',
  'verre',
  'refus',
];
const NIVEAUX: NiveauContamination[] = ['faible', 'moyen', 'eleve'];

export const DESTINATION: Record<Categorie, Destination> = {
  organique: 'digesteur',
  biomasse: 'unite_biomasse',
  plastique: 'recycleur',
  metal: 'recycleur',
  carton_papier: 'recycleur',
  verre: 'recycleur',
  refus: 'enfouissement',
};

/* ------------------------------------------------------------------ Journal */

export function journaliser(
  etat: Etat,
  auteurId: string,
  action: string,
  objetType: TypeObjet,
  objetId: string,
  ancienne: unknown,
  nouvelle: unknown,
  motif: string | null = null,
): void {
  etat.journal.unshift({
    id: nouvelUuid(etat, 'b0c00000'),
    date: maintenant(),
    auteur_id: auteurId,
    action,
    objet_type: objetType,
    objet_id: objetId,
    ancienne_valeur: ancienne === undefined || ancienne === null ? null : JSON.stringify(ancienne),
    nouvelle_valeur: nouvelle === undefined || nouvelle === null ? null : JSON.stringify(nouvelle),
    motif: motif?.trim() || null,
  });
}

/* ------------------------------------------------------------------ Scans */

/** Scans qui comptent, par citoyen, pour un bac sur la période ]debut, fin]. */
export function scansParCitoyen(etat: Etat, bacId: string, debut: string | null, fin: string): Map<string, number> {
  const parCitoyen = new Map<string, number>();
  for (const scan of etat.scans) {
    if (scan.bac_id !== bacId || !scan.compte) continue;
    if (scan.horodatage > fin || (debut && scan.horodatage <= debut)) continue;
    parCitoyen.set(scan.citoyen_id, (parCitoyen.get(scan.citoyen_id) ?? 0) + 1);
  }
  return parCitoyen;
}

/** Date de validation de la collecte précédente du même bac (début de la période de scans). */
export function debutPeriode(etat: Etat, collecte: CollecteDB): string | null {
  const precedentes = etat.collectes
    .filter(
      (c) =>
        c.bac_id === collecte.bac_id &&
        c.id !== collecte.id &&
        c.statut === 'validee' &&
        c.date_validation != null &&
        collecte.date_validation != null &&
        c.date_validation < collecte.date_validation,
    )
    .map((c) => c.date_validation as string)
    .sort();
  return precedentes.at(-1) ?? null;
}

/* ------------------------------------------------------------------ Énergie */

/** Formules du Guide commun §8.4, avec les paramètres en vigueur. */
export function calculerProduction(etat: Etat, p: ProductionDB): ProductionDB {
  const v = (cle: CleParametre) => param(etat, cle);
  p.biogaz_attendu_m3 = arrondi(p.poids_organique_recu_kg * v('coefficient_biogaz_m3_par_kg'));
  p.digestat_kg = arrondi(p.poids_organique_recu_kg * v('coefficient_digestat'));
  const mesure = p.biogaz_mesure_m3;
  if (mesure == null) {
    Object.assign(p, {
      ecart_pct: null,
      biogaz_cuisson_m3: null,
      biogaz_perte_m3: null,
      biogaz_valorise_m3: null,
      electricite_kwh: null,
      chaleur_kwh: null,
      foyers_equivalents: null,
      foyers_cuisson: null,
    });
  } else {
    const attendu = p.biogaz_attendu_m3;
    p.ecart_pct = attendu > 0 ? arrondi(((mesure - attendu) / attendu) * 100, 1) : null;
    p.biogaz_cuisson_m3 = arrondi((mesure * v('part_cuisson_pct')) / 100);
    p.biogaz_perte_m3 = arrondi((mesure * v('part_perte_pct')) / 100);
    p.biogaz_valorise_m3 = arrondi(mesure - p.biogaz_cuisson_m3 - p.biogaz_perte_m3);
    p.electricite_kwh = arrondi(p.biogaz_valorise_m3 * v('coefficient_electricite_kwh_par_m3'));
    p.chaleur_kwh = arrondi(p.biogaz_valorise_m3 * v('coefficient_chaleur_kwh_par_m3'));
    p.foyers_equivalents = arrondi((p.electricite_kwh * 365) / v('conso_electrique_foyer_kwh_an'), 1);
    p.foyers_cuisson = arrondi(p.biogaz_cuisson_m3 / v('conso_cuisson_foyer_m3_jour'), 1);
  }
  p.statuts_donnees = statutsProduction(p);
  return p;
}

/** Provenance de chaque valeur d'une production (badges Mesuré / Estimé / Simulé). */
export function statutsProduction(p: ProductionDB): Record<string, StatutDonnee> {
  const statuts: Record<string, StatutDonnee> = {
    poids_organique_recu_kg: 'mesure',
    biogaz_attendu_m3: 'estime',
    digestat_kg: 'estime',
  };
  if (p.biogaz_mesure_m3 != null) {
    for (const champ of ['biogaz_mesure_m3', 'ch4_pct', 'temperature_c', 'ph'] as const) statuts[champ] = 'simule';
    for (const champ of [
      'ecart_pct',
      'biogaz_cuisson_m3',
      'biogaz_perte_m3',
      'biogaz_valorise_m3',
      'electricite_kwh',
      'chaleur_kwh',
      'foyers_equivalents',
      'foyers_cuisson',
    ] as const)
      statuts[champ] = 'estime';
  }
  return statuts;
}

/** Production journalière d'un site, créée (ouverte, vide) si elle n'existe pas encore. */
export function productionDuJour(etat: Etat, siteId: string, date: string): ProductionDB {
  let p = etat.productions.find((x) => x.site_id === siteId && x.date === date);
  if (!p) {
    p = calculerProduction(etat, {
      id: nouvelUuid(etat, '9d000000', 21),
      site_id: siteId,
      date,
      statut_journee: 'ouverte',
      poids_organique_recu_kg: 0,
      biogaz_attendu_m3: 0,
      biogaz_mesure_m3: null,
      ch4_pct: null,
      temperature_c: null,
      ph: null,
      ecart_pct: null,
      biogaz_cuisson_m3: null,
      biogaz_perte_m3: null,
      biogaz_valorise_m3: null,
      electricite_kwh: null,
      chaleur_kwh: null,
      digestat_kg: 0,
      destination_digestat: null,
      foyers_equivalents: null,
      foyers_cuisson: null,
      statuts_donnees: {},
    });
    etat.productions.push(p);
  }
  return p;
}

/* ------------------------------------------------------------------ Alertes */

export function majStatutSite(etat: Etat, site: SiteDB): void {
  if (site.statut === 'maintenance') return;
  site.statut = etat.alertes.some((a) => a.site_id === site.id && a.statut === 'ouverte') ? 'alerte' : 'nominal';
}

function ouvrirOuCompleterAlerte(
  etat: Etat,
  site: SiteDB,
  type: TypeAlerte,
  valeurs: { valeur_attendue: number; valeur_mesuree: number; ecart_pct: number; description: string },
  jour: string,
): void {
  const instant = maintenant();
  const ouverte = etat.alertes.find((a) => a.site_id === site.id && a.type === type && a.statut === 'ouverte');
  if (ouverte) {
    const memeJour = ouverte.date_derniere_occurrence.slice(0, 10) === jour;
    Object.assign(ouverte, valeurs, { date_derniere_occurrence: instant });
    if (!memeJour) {
      ouverte.nb_occurrences += 1;
      notifier(etat, destinatairesRoles(etat, 'responsable_methanisation'), {
        type: 'alerte_repetee',
        niveau: 'attention',
        titre: 'Alerte toujours ouverte',
        message: `${site.code} : l'écart continue (${ouverte.nb_occurrences} jours).`,
        objet_type: 'alerte',
        objet_id: ouverte.id,
      });
    }
    return;
  }
  const alerte = {
    id: nouvelUuid(etat, 'a1e00000'),
    site_id: site.id,
    type,
    statut: 'ouverte' as const,
    ...valeurs,
    nb_occurrences: 1,
    date_creation: instant,
    date_derniere_occurrence: instant,
    date_resolution: null,
    commentaire_resolution: null,
    resolue_par_id: null,
  };
  etat.alertes.unshift(alerte);
  journaliser(etat, ID_SIMULATEUR, 'alerte.creer', 'alerte', alerte.id, null, 'ouverte', valeurs.description);
  const chiffre = (v: number) => nombre(v, Number.isInteger(v) ? 0 : 1);
  notifier(etat, destinatairesRoles(etat, 'responsable_methanisation', 'administrateur'), {
    type: 'alerte_ouverte',
    niveau: 'critique',
    titre: `Alerte ${site.code}`,
    message:
      type === 'production'
        ? `${site.code} : biogaz ${nombre(valeurs.ecart_pct, 0, true)} % (${chiffre(valeurs.valeur_mesuree)} m³ pour ${chiffre(valeurs.valeur_attendue)} m³ attendus).`
        : `${site.code} : ${valeurs.description}`,
    objet_type: 'alerte',
    objet_id: alerte.id,
  });
}

/** Règles d'alerte du Guide commun §8.5 (seuil inclus, à la baisse comme à la hausse). */
export function verifierAlertes(etat: Etat, site: SiteDB, p: ProductionDB): void {
  const seuil = param(etat, 'seuil_alerte_production_pct');
  if (p.ecart_pct != null && p.biogaz_mesure_m3 != null && Math.abs(p.ecart_pct) >= seuil) {
    const ecart = Math.abs(p.ecart_pct);
    ouvrirOuCompleterAlerte(
      etat,
      site,
      'production',
      {
        valeur_attendue: p.biogaz_attendu_m3,
        valeur_mesuree: p.biogaz_mesure_m3,
        ecart_pct: p.ecart_pct,
        description: `Production de biogaz ${p.ecart_pct < 0 ? 'inférieure' : 'supérieure'} de ${nombre(ecart, ecart % 1 ? 1 : 0)} % à l'attendu`,
      },
      p.date,
    );
  }
  const ch4Min = param(etat, 'ch4_min_pct');
  if (p.ch4_pct != null && p.ch4_pct < ch4Min) {
    ouvrirOuCompleterAlerte(
      etat,
      site,
      'composition',
      {
        valeur_attendue: ch4Min,
        valeur_mesuree: p.ch4_pct,
        ecart_pct: arrondi(((p.ch4_pct - ch4Min) / ch4Min) * 100, 1),
        description: `Teneur en méthane de ${nombre(p.ch4_pct)} %, sous le minimum de ${nombre(ch4Min)} %`,
      },
      p.date,
    );
  }
  majStatutSite(etat, site);
}

/** Réception d'une mesure de gaz (endpoint capteur `POST /sites/{id}/mesures/`). */
export function recevoirMesure(etat: Etat, siteId: string, mesure: MesureSite): ProductionDB {
  const site = etat.sites.find((s) => s.id === siteId);
  if (!site) throw introuvable('Site');
  const p = productionDuJour(etat, siteId, mesure.date);
  if (p.statut_journee === 'cloturee') {
    throw new ErreurMock(422, 'JOURNEE_CLOTUREE', 'Cette journée est déjà clôturée : la mesure est refusée.');
  }
  Object.assign(p, {
    biogaz_mesure_m3: mesure.biogaz_mesure_m3,
    ch4_pct: mesure.ch4_pct,
    temperature_c: mesure.temperature_c ?? null,
    ph: mesure.ph ?? null,
  });
  calculerProduction(etat, p);
  verifierAlertes(etat, site, p);
  return p;
}

/**
 * Simulateur IoT (Guide commun §3) : mesure du compteur de gaz = attendu × facteur.
 * Le facteur vaut celui du scénario actif, sinon le facteur nominal du site.
 * Rien n'est envoyé si le site n'a reçu aucune matière ou si la journée est clôturée.
 */
export function mesureSimulee(etat: Etat, siteId: string, date: string): ProductionDB | null {
  const site = etat.sites.find((s) => s.id === siteId);
  const p = etat.productions.find((x) => x.site_id === siteId && x.date === date);
  if (!site || !p || p.poids_organique_recu_kg <= 0 || p.statut_journee === 'cloturee') return null;
  const facteur = etat.scenarios.get(siteId) ?? site.facteur_nominal;
  return recevoirMesure(etat, siteId, {
    date,
    biogaz_mesure_m3: arrondi(p.biogaz_attendu_m3 * facteur),
    ch4_pct: 61,
    temperature_c: 36.2,
    ph: 7.1,
    source: 'simule',
  });
}

/* ------------------------------------------------------------------ Tri */

function validerRequeteTri(requete: Partial<TriRequete>): {
  lots: { categorie: Categorie; poids_kg: number }[];
  niveau: NiveauContamination;
} {
  if (!requete.niveau_contamination || !NIVEAUX.includes(requete.niveau_contamination)) {
    throw validation('niveau_contamination', 'Choisissez un niveau de contamination.');
  }
  if (!Array.isArray(requete.lots) || requete.lots.length === 0) {
    throw validation('lots', 'Saisissez au moins une catégorie.');
  }
  const vues = new Set<Categorie>();
  for (const lot of requete.lots) {
    if (!CATEGORIES.includes(lot.categorie)) throw validation('lots', `Catégorie inconnue : ${String(lot.categorie)}`);
    if (vues.has(lot.categorie)) throw validation('lots', 'Chaque catégorie ne peut apparaître qu’une fois.');
    vues.add(lot.categorie);
    if (typeof lot.poids_kg !== 'number' || !Number.isFinite(lot.poids_kg) || lot.poids_kg < 0) {
      throw validation('lots', 'Chaque poids doit être un nombre positif ou nul.');
    }
  }
  return { lots: requete.lots.filter((l) => l.poids_kg > 0), niveau: requete.niveau_contamination };
}

export interface OptionsTri {
  /** Ajoute l'organique à la production du jour du site (faux pour l'historique de la maquette). */
  majProduction?: boolean;
  instant?: string;
}

/** Pipeline de tri (Guide commun §3, point 2) : tout passe ou rien n'est écrit. */
export function validerTri(
  etat: Etat,
  tournee: TourneeDB,
  requete: Partial<TriRequete>,
  auteurId: string,
  options: OptionsTri = {},
): TriDB {
  const { majProduction = true, instant = maintenant() } = options;
  if (tournee.statut === 'triee') throw new ErreurMock(409, 'CONFLIT', 'Cette tournée a déjà été triée');
  if (tournee.statut !== 'collectee') {
    throw new ErreurMock(422, 'TOURNEE_STATUT_INVALIDE', 'Seule une tournée collectée peut être triée.');
  }
  const { lots, niveau } = validerRequeteTri(requete);
  const collectes = etat.collectes.filter((c) => c.tournee_id === tournee.id && c.statut === 'validee');
  const poidsCollecte = arrondi(collectes.reduce((s, c) => s + (c.poids_net_kg ?? 0), 0));
  const poidsTrie = arrondi(lots.reduce((s, l) => s + l.poids_kg, 0));
  if (poidsTrie <= 0) throw validation('lots', 'Le poids trié total doit être supérieur à 0 kg.');

  // 1. Cohérence avec le poids collecté
  const ecart = poidsCollecte > 0 ? arrondi(((poidsTrie - poidsCollecte) / poidsCollecte) * 100, 1) : 0;
  const tolerance = param(etat, 'tolerance_tri_pct');
  const motif = requete.motif_ecart?.trim() || null;
  if (Math.abs(ecart) > tolerance && !motif) {
    throw new ErreurMock(
      422,
      'ECART_TOLERANCE',
      `Le poids trié s'écarte de ${nombre(ecart, 1, true)} % du poids collecté (tolérance ${nombre(tolerance)} %) : saisissez un motif.`,
      { ecart_pct: ecart, tolerance_pct: tolerance },
    );
  }

  // Production du site (vérifiée avant toute écriture)
  const site = etat.sites.find((s) => s.id === tournee.site_id);
  if (!site) throw introuvable('Site');
  const production = majProduction ? productionDuJour(etat, site.id, tournee.date) : null;
  if (production?.statut_journee === 'cloturee') {
    throw new ErreurMock(422, 'JOURNEE_CLOTUREE', `La journée du ${tournee.date} est clôturée sur ${site.code}.`);
  }

  // 2. Lots et valeur de la tournée
  const coefQualite = param(etat, `coefficient_qualite_${niveau}`);
  const valeurKg = arrondi(
    lots.reduce((s, l) => s + (l.poids_kg / poidsTrie) * param(etat, `coefficient_filiere_${l.categorie}`), 0),
  );
  const nouveauxLots: LotDB[] = lots.map((l) => {
    const prefixe = PREFIXE_LOT[l.categorie];
    etat.compteurs.lots[prefixe] = (etat.compteurs.lots[prefixe] ?? 0) + 1;
    return {
      id: nouvelUuid(etat, '107e0000'),
      code_lot: `${prefixe}-${String(etat.compteurs.lots[prefixe]).padStart(4, '0')}`,
      tournee_id: tournee.id,
      categorie: l.categorie,
      poids_kg: arrondi(l.poids_kg),
      part_pct: arrondi((l.poids_kg / poidsTrie) * 100, 1),
      destination: DESTINATION[l.categorie],
      site_id: l.categorie === 'organique' ? site.id : null,
    };
  });

  // 3-4. Points par bac, puis par citoyen
  const pointsBac: Record<string, number> = {};
  const transactions: TransactionDB[] = [];
  for (const c of collectes) {
    const pb = arrondi((c.poids_net_kg ?? 0) * valeurKg * coefQualite);
    const scansBac = c.scans_valides ?? 0;
    // Un bac sans scan : son poids compte dans la tournée, mais aucun point n'est généré (Guide §8.3).
    pointsBac[c.id] = scansBac > 0 ? pb : 0;
    if (scansBac <= 0 || !c.date_validation) continue;
    const statut: StatutTransaction =
      c.statut_controle === 'a_verifier'
        ? 'en_attente'
        : c.statut_controle === 'points_annules'
          ? 'annulee'
          : 'creditee';
    for (const [citoyenId, scansCitoyen] of scansParCitoyen(etat, c.bac_id, debutPeriode(etat, c), c.date_validation)) {
      transactions.push({
        id: nouvelUuid(etat, '9b000000'),
        citoyen_id: citoyenId,
        bac_id: c.bac_id,
        tournee_id: tournee.id,
        collecte_id: c.id,
        scans_citoyen: scansCitoyen,
        scans_bac: scansBac,
        poids_attribue_kg: arrondi(((c.poids_net_kg ?? 0) * scansCitoyen) / scansBac),
        valeur_kg: valeurKg,
        coef_qualite: coefQualite,
        points: Math.floor((pb * scansCitoyen) / scansBac + 1e-9),
        statut,
        date: instant,
      });
    }
  }

  // 5. Organique envoyé au site
  const organique = nouveauxLots.find((l) => l.categorie === 'organique');
  if (production) {
    production.poids_organique_recu_kg = arrondi(production.poids_organique_recu_kg + (organique?.poids_kg ?? 0));
    calculerProduction(etat, production);
  }

  const somme = (statut: StatutTransaction) =>
    transactions.filter((t) => t.statut === statut).reduce((s, t) => s + t.points, 0);
  const tri: TriDB = {
    tournee_id: tournee.id,
    niveau_contamination: niveau,
    coef_qualite: coefQualite,
    poids_collecte_kg: poidsCollecte,
    poids_trie_kg: poidsTrie,
    ecart_pct: ecart,
    motif_ecart: motif,
    valeur_kg: valeurKg,
    nb_transactions: transactions.length,
    points_credites: somme('creditee'),
    points_en_attente: somme('en_attente'),
    production_id:
      production?.id ?? etat.productions.find((p) => p.site_id === site.id && p.date === tournee.date)?.id ?? null,
    date_validation: instant,
    valide_par_id: auteurId,
    points_bac: pointsBac,
  };

  etat.lots.push(...nouveauxLots);
  etat.transactions.push(...transactions);
  etat.tris.set(tournee.id, tri);
  tournee.statut = 'triee';
  tournee.niveau_contamination = niveau;
  journaliser(etat, auteurId, 'tri.valider', 'tournee', tournee.id, 'collectee', 'triee', motif);
  return tri;
}
