/**
 * Menus, pages d'arrivée et droits d'accès aux écrans par rôle (docs/ROUTES.md).
 * La vraie sécurité reste côté backend : un 403 affiche « Action non autorisée pour votre rôle ».
 */
import {
  Activity,
  BookOpen,
  ClipboardCheck,
  Factory,
  History,
  LayoutGrid,
  Radio,
  Route,
  Trash2,
  Truck,
  TriangleAlert,
  Users,
  Waypoints,
  type LucideIcon,
} from 'lucide-react';
import type { RoleControlCenter } from '@/api/types';

export type CleCompteur = 'alertes' | 'verifications' | 'tournees';

export interface EntreeMenu {
  chemin: string;
  libelle: string;
  icone: LucideIcon;
  compteur?: CleCompteur;
  /** Préfixes de route qui gardent l'entrée active (ex. la fiche d'un bac pour « Bacs »). */
  actifSur?: string[];
}

export interface GroupeMenu {
  titre?: string;
  entrees: EntreeMenu[];
}

export const MENUS: Record<RoleControlCenter, GroupeMenu[]> = {
  operateur_tri: [
    {
      entrees: [
        { chemin: '/tri', libelle: 'Tournées à trier', icone: Truck, compteur: 'tournees', actifSur: ['/tri/'] },
        { chemin: '/tri/historique', libelle: 'Historique des tris', icone: History },
      ],
    },
  ],
  responsable_methanisation: [
    {
      entrees: [
        { chemin: '/methanisation', libelle: 'Vue globale', icone: LayoutGrid },
        { chemin: '/methanisation/sites', libelle: 'Sites', icone: Factory, actifSur: ['/methanisation/sites/'] },
        { chemin: '/methanisation/alertes', libelle: 'Alertes', icone: TriangleAlert, compteur: 'alertes' },
      ],
    },
  ],
  referent: [
    {
      entrees: [
        { chemin: '/admin/verifications', libelle: 'Vérifications', icone: ClipboardCheck, compteur: 'verifications' },
      ],
    },
  ],
  administrateur: [
    {
      entrees: [
        { chemin: '/methanisation', libelle: 'Vue globale', icone: LayoutGrid, actifSur: ['/methanisation/'] },
        { chemin: '/admin', libelle: 'Supervision', icone: Activity },
        { chemin: '/admin/tracabilite', libelle: 'Traçabilité', icone: Waypoints },
        { chemin: '/admin/verifications', libelle: 'Vérifications', icone: ClipboardCheck, compteur: 'verifications' },
      ],
    },
    {
      titre: 'Gestion',
      entrees: [
        { chemin: '/admin/bacs', libelle: 'Bacs', icone: Trash2, actifSur: ['/admin/bacs/'] },
        { chemin: '/admin/utilisateurs', libelle: 'Utilisateurs', icone: Users },
        { chemin: '/admin/tournees', libelle: 'Tournées', icone: Route, actifSur: ['/tri'] },
      ],
    },
    {
      titre: 'Système',
      entrees: [
        { chemin: '/admin/journal', libelle: 'Journal', icone: BookOpen },
        { chemin: '/admin/capteurs', libelle: 'Capteurs', icone: Radio },
      ],
    },
  ],
};

export const PAGE_ACCUEIL: Record<RoleControlCenter, string> = {
  operateur_tri: '/tri',
  responsable_methanisation: '/methanisation',
  administrateur: '/methanisation',
  referent: '/admin/verifications',
};

/**
 * Bouton « Paramètres » du bas de la barre latérale : paramètres système pour l'administrateur,
 * préférences personnelles pour les autres rôles.
 */
export const PAGE_PARAMETRES: Record<RoleControlCenter, string> = {
  operateur_tri: '/preferences',
  responsable_methanisation: '/preferences',
  administrateur: '/admin/parametres',
  referent: '/preferences',
};

/** Rôles autorisés par groupe d'écrans. */
export const ACCES = {
  triLecture: ['operateur_tri', 'administrateur'],
  triSaisie: ['operateur_tri'],
  methanisation: ['responsable_methanisation', 'administrateur'],
  verifications: ['administrateur', 'referent'],
  administration: ['administrateur'],
} as const satisfies Record<string, readonly RoleControlCenter[]>;
