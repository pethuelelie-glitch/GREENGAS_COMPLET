/**
 * Alias lisibles des types générés depuis openapi.yaml (schema.d.ts n'est jamais modifié à la main).
 */
import type { components } from './schema';

type S = components['schemas'];

// Énumérations
export type Role = S['Role'];
export type StatutValidation = S['StatutValidation'];
export type StatutBac = S['StatutBac'];
export type StatutSite = S['StatutSite'];
export type StatutScan = S['StatutScan'];
export type StatutTournee = S['StatutTournee'];
export type MotifAffectation = S['MotifAffectation'];
export type StatutCollecte = S['StatutCollecte'];
export type StatutControle = S['StatutControle'];
export type SourceMesure = S['SourceMesure'];
export type NiveauContamination = S['NiveauContamination'];
export type Categorie = S['Categorie'];
export type Destination = S['Destination'];
export type StatutTransaction = S['StatutTransaction'];
export type TypeAlerte = S['TypeAlerte'];
export type StatutAlerte = S['StatutAlerte'];
export type StatutJournee = S['StatutJournee'];
export type DestinationDigestat = S['DestinationDigestat'];
export type StatutDonnee = S['StatutDonnee'];
export type TypeVerification = S['TypeVerification'];
export type TypeObjet = S['TypeObjet'];
export type Notification = S['Notification'];
export type TypeNotification = S['TypeNotification'];
export type NiveauNotification = S['NiveauNotification'];
export type StatutParametre = S['StatutParametre'];
export type CleParametre = S['CleParametre'];
export type CodeErreur = S['CodeErreur'];

// Modèles
export type Erreur = S['Erreur'];
export type Utilisateur = S['Utilisateur'];
export type ProfilCitoyen = S['ProfilCitoyen'];
export type UtilisateurCreation = S['UtilisateurCreation'];
export type UtilisateurModification = S['UtilisateurModification'];
export type Jetons = S['Jetons'];
export type Secteur = S['Secteur'];
export type CodeSecteur = Secteur['code'];
export type Site = S['Site'];
export type Bac = S['Bac'];
export type BacEcriture = S['BacEcriture'];
export type Scan = S['Scan'];
export type Tournee = S['Tournee'];
export type TourneeDetail = S['TourneeDetail'];
export type TourneeCreation = S['TourneeCreation'];
export type Collecte = S['Collecte'];
export type TriRequete = S['TriRequete'];
/** Connexion par téléphone ou par e-mail (exactement un des deux). */
export type ConnexionRequete = S['ConnexionRequete'];
export type InscriptionPersonnelRequete = S['InscriptionPersonnelRequete'];
/** Rôles ouverts à l'inscription dans le Control Center. */
export type RoleInscription = InscriptionPersonnelRequete['role'];
export type LotTrie = S['LotTrie'];
export type ResultatTri = S['ResultatTri'];
export type GreenPointsTransaction = S['GreenPointsTransaction'];
export type Solde = S['Solde'];
export type Recompense = S['Recompense'];
export type Echange = S['Echange'];
export type MesureSite = S['MesureSite'];
export type ProductionEnergie = S['ProductionEnergie'];
export type ProductionGlobale = S['ProductionGlobale'];
export type Alerte = S['Alerte'];
export type ElementVerification = S['ElementVerification'];
export type TracabiliteBac = S['TracabiliteBac'];
export type EtapeTracabilite = S['EtapeTracabilite'];
export type CitoyenTracabilite = TracabiliteBac['citoyens'][number];
export type Parametre = S['Parametre'];
export type EntreeJournal = S['EntreeJournal'];
export type ScenarioSimulation = S['ScenarioSimulation'];

/** Rôles qui utilisent le Control Center (les autres utilisent l'application mobile). */
export type RoleControlCenter = Extract<
  Role,
  'operateur_tri' | 'responsable_methanisation' | 'administrateur' | 'referent'
>;

export const ROLES_CONTROL_CENTER: readonly RoleControlCenter[] = [
  'operateur_tri',
  'responsable_methanisation',
  'administrateur',
  'referent',
];

export function estRoleControlCenter(role: Role): role is RoleControlCenter {
  return (ROLES_CONTROL_CENTER as readonly Role[]).includes(role);
}
