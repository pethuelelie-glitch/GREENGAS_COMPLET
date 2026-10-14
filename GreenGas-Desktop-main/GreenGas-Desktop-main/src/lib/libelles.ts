/**
 * Libellé affiché pour chaque valeur d'énumération du contrat.
 * Les `Record<…>` garantissent qu'aucune valeur n'est oubliée quand le contrat évolue.
 */
import type {
  Categorie,
  CleParametre,
  CodeSecteur,
  Destination,
  DestinationDigestat,
  MotifAffectation,
  NiveauContamination,
  Role,
  SourceMesure,
  StatutAlerte,
  StatutBac,
  StatutCollecte,
  StatutControle,
  StatutDonnee,
  StatutJournee,
  StatutParametre,
  StatutScan,
  StatutSite,
  StatutTournee,
  StatutTransaction,
  StatutValidation,
  TypeAlerte,
  TypeObjet,
  TypeVerification,
} from '@/api/types';

export const LIBELLE_ROLE: Record<Role, string> = {
  citoyen: 'Citoyen',
  collecteur: 'Collecteur',
  operateur_tri: 'Opérateur de tri',
  responsable_methanisation: 'Responsable méthanisation',
  referent: 'Référent',
  administrateur: 'Administrateur',
  capteur: 'Capteur (IoT)',
};

export const LIBELLE_ROLE_COURT: Record<Role, string> = {
  ...LIBELLE_ROLE,
  responsable_methanisation: 'Resp. méthanisation',
};

export const LIBELLE_SECTEUR: Record<CodeSecteur, string> = {
  NORD: 'Nord',
  EST: 'Est',
  OUEST: 'Ouest',
};

export const LIBELLE_STATUT_VALIDATION: Record<StatutValidation, string> = {
  en_attente: 'En attente',
  valide: 'Validé',
  refuse: 'Refusé',
};

export const LIBELLE_STATUT_BAC: Record<StatutBac, string> = { actif: 'Actif', inactif: 'Inactif' };

export const LIBELLE_STATUT_SITE: Record<StatutSite, string> = {
  nominal: 'Nominal',
  alerte: 'Alerte',
  maintenance: 'Maintenance',
};

export const LIBELLE_STATUT_SCAN: Record<StatutScan, string> = {
  valide: 'Valide',
  non_localise: 'Non localisé',
  hors_zone: 'Hors zone',
  refuse_plafond: 'Plafond atteint',
};

export const LIBELLE_STATUT_TOURNEE: Record<StatutTournee, string> = {
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  collectee: 'À trier',
  triee: 'Triée',
};

export const LIBELLE_MOTIF_AFFECTATION: Record<MotifAffectation, string> = {
  secteur: 'secteur',
  repli: 'repli',
};

export const LIBELLE_STATUT_COLLECTE: Record<StatutCollecte, string> = {
  en_attente_pesee: 'En attente de pesée',
  pesee: 'Pesée',
  validee: 'Validée',
};

export const LIBELLE_STATUT_CONTROLE: Record<StatutControle, string> = {
  normal: 'Normal',
  a_verifier: 'À vérifier',
  points_valides: 'Points validés',
  points_annules: 'Points annulés',
};

export const LIBELLE_SOURCE: Record<SourceMesure, string> = { simule: 'Simulée', capteur: 'Capteur' };

export const LIBELLE_CONTAMINATION: Record<NiveauContamination, string> = {
  faible: 'Faible',
  moyen: 'Moyen',
  eleve: 'Élevé',
};

/** Ordre d'affichage du formulaire de tri (brief §5 T2). */
export const CATEGORIES: readonly Categorie[] = [
  'organique',
  'biomasse',
  'plastique',
  'metal',
  'carton_papier',
  'verre',
  'refus',
];

export const LIBELLE_CATEGORIE: Record<Categorie, string> = {
  organique: 'Organique',
  biomasse: 'Biomasse',
  plastique: 'Plastique',
  metal: 'Métal',
  carton_papier: 'Carton / papier',
  verre: 'Verre',
  refus: 'Refus',
};

export const LIBELLE_DESTINATION: Record<Destination, string> = {
  digesteur: 'Digesteur',
  unite_biomasse: 'Unité biomasse',
  recycleur: 'Recycleur',
  enfouissement: 'Enfouissement',
};

/**
 * Destination de chaque catégorie, telle que fixée par le Guide commun (§6).
 * Sert uniquement à l'aperçu de la saisie : le serveur renvoie la vraie destination de chaque lot.
 */
export const DESTINATION_CATEGORIE: Record<Categorie, Destination> = {
  organique: 'digesteur',
  biomasse: 'unite_biomasse',
  plastique: 'recycleur',
  metal: 'recycleur',
  carton_papier: 'recycleur',
  verre: 'recycleur',
  refus: 'enfouissement',
};

export const LIBELLE_STATUT_TRANSACTION: Record<StatutTransaction, string> = {
  creditee: 'Créditée',
  en_attente: 'En attente',
  annulee: 'Annulée',
};

export const LIBELLE_STATUT_JOURNEE: Record<StatutJournee, string> = {
  ouverte: 'Ouverte',
  cloturee: 'Clôturée',
};

export const LIBELLE_DESTINATION_DIGESTAT: Record<DestinationDigestat, string> = {
  vente_agricole: 'Vente agricole (biofertilisant)',
  stockage: 'Stockage',
};

export const LIBELLE_TYPE_ALERTE: Record<TypeAlerte, string> = {
  production: 'Production',
  composition: 'Composition',
};

export const LIBELLE_STATUT_ALERTE: Record<StatutAlerte, string> = {
  ouverte: 'Ouverte',
  resolue: 'Résolue',
};

export const LIBELLE_STATUT_DONNEE: Record<StatutDonnee, string> = {
  mesure: 'Mesuré',
  estime: 'Estimé',
  simule: 'Simulé',
};

export const DEFINITION_STATUT_DONNEE: Record<StatutDonnee, string> = {
  mesure: 'captée ou saisie',
  estime: 'calculée',
  simule: 'produite par le simulateur',
};

export const LIBELLE_TYPE_VERIFICATION: Record<TypeVerification, string> = {
  collecte_a_verifier: 'Collecte à vérifier',
  compte_en_attente: 'Compte en attente',
  scan_hors_zone: 'Scan hors zone',
  scan_non_localise: 'Scan non localisé',
  bac_surinscrit: 'Bac surinscrit',
};

export const LIBELLE_TYPE_OBJET: Record<TypeObjet, string> = {
  utilisateur: 'Utilisateur',
  bac: 'Bac',
  scan: 'Scan',
  tournee: 'Tournée',
  collecte: 'Collecte',
  lot: 'Lot',
  transaction: 'Transaction',
  production: 'Production',
  alerte: 'Alerte',
  parametre: 'Paramètre',
  site: 'Site',
  secteur: 'Secteur',
};

export const LIBELLE_STATUT_PARAMETRE: Record<StatutParametre, string> = {
  aligne: 'Aligné',
  illustratif: 'Illustratif',
  a_sourcer: 'À sourcer',
  a_calibrer: 'À calibrer',
  v2: 'V2',
};

export type FamilleParametre = 'GreenPoints' | 'Collecte' | 'Énergie' | 'Alertes' | 'Comptes';

/** Libellé lisible et famille de chaque paramètre (brief §5 A7). */
export const PARAMETRES: Record<CleParametre, { libelle: string; famille: FamilleParametre }> = {
  coefficient_filiere_organique: { libelle: "Points par kg d'organique", famille: 'GreenPoints' },
  coefficient_filiere_biomasse: { libelle: 'Points par kg de biomasse', famille: 'GreenPoints' },
  coefficient_filiere_plastique: { libelle: 'Points par kg de plastique', famille: 'GreenPoints' },
  coefficient_filiere_metal: { libelle: 'Points par kg de métal', famille: 'GreenPoints' },
  coefficient_filiere_carton_papier: { libelle: 'Points par kg de carton / papier', famille: 'GreenPoints' },
  coefficient_filiere_verre: { libelle: 'Points par kg de verre', famille: 'GreenPoints' },
  coefficient_filiere_refus: { libelle: 'Points par kg de refus', famille: 'GreenPoints' },
  coefficient_qualite_faible: { libelle: 'Coefficient qualité : contamination faible', famille: 'GreenPoints' },
  coefficient_qualite_moyen: { libelle: 'Coefficient qualité : contamination moyenne', famille: 'GreenPoints' },
  coefficient_qualite_eleve: { libelle: 'Coefficient qualité : contamination élevée', famille: 'GreenPoints' },
  max_scans_par_jour: { libelle: 'Scans maximum par jour et par citoyen', famille: 'GreenPoints' },
  rayon_scan_m: { libelle: 'Distance maximale au bac pour un scan', famille: 'GreenPoints' },
  seuil_kg_par_scan: { libelle: 'Seuil de contrôle (kg par scan)', famille: 'Collecte' },
  duree_periode_collecte_jours: { libelle: 'Rythme de collecte', famille: 'Collecte' },
  tolerance_tri_pct: { libelle: 'Tolérance entre poids trié et collecté', famille: 'Collecte' },
  coefficient_biogaz_m3_par_kg: { libelle: "Biogaz par kg d'organique", famille: 'Énergie' },
  coefficient_electricite_kwh_par_m3: { libelle: 'Électricité par m³ de biogaz', famille: 'Énergie' },
  coefficient_chaleur_kwh_par_m3: { libelle: 'Chaleur par m³ de biogaz', famille: 'Énergie' },
  part_cuisson_pct: { libelle: 'Part du biogaz pour la cuisson (V2)', famille: 'Énergie' },
  conso_cuisson_foyer_m3_jour: { libelle: "Consommation de cuisson d'un foyer (V2)", famille: 'Énergie' },
  part_perte_pct: { libelle: 'Part de biogaz perdue', famille: 'Énergie' },
  conso_electrique_foyer_kwh_an: { libelle: "Consommation électrique d'un foyer", famille: 'Énergie' },
  coefficient_digestat: { libelle: "Digestat par kg d'organique", famille: 'Énergie' },
  fenetre_lissage_jours: { libelle: "Lissage de l'attendu", famille: 'Énergie' },
  seuil_alerte_production_pct: { libelle: "Seuil d'alerte de production", famille: 'Alertes' },
  ch4_min_pct: { libelle: 'Teneur minimale en méthane', famille: 'Alertes' },
  validation_comptes_personnel: { libelle: 'Validation des comptes du personnel', famille: 'Comptes' },
};

/** Paramètres oui / non (contrat 1.5.0) : 1 = activé, 0 = désactivé. */
export const PARAMETRES_OUI_NON: ReadonlySet<CleParametre> = new Set<CleParametre>(['validation_comptes_personnel']);

export const FAMILLES_PARAMETRES: readonly FamilleParametre[] = ['GreenPoints', 'Collecte', 'Énergie', 'Alertes', 'Comptes'];
