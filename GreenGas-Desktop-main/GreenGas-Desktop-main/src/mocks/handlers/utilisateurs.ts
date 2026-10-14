import type { Role, UtilisateurCreation, UtilisateurModification } from '@/api/types';
import { journaliser } from '../calculs';
import { accesRefuse, ErreurMock, introuvable, validation } from '../erreurs';
import { nouvelUuid, type Etat, type UtilisateurDB } from '../etat';
import { maintenant } from '../horloge';
import { paginer, reponse, route } from '../http';
import { solde } from '../lectures';
import { notifierBacSurinscrit } from '../notifications';
import { utilisateurApi } from '../serialiseurs';

const ROLES: Role[] = [
  'citoyen',
  'collecteur',
  'operateur_tri',
  'responsable_methanisation',
  'referent',
  'administrateur',
  'capteur',
];
const RE_TELEPHONE = /^\+225\d{10}$/;
/** Seul le personnel inscrit lui-même passe par la validation d'un administrateur (contrat 1.3.0). */
const ROLES_PERSONNEL: Role[] = ['operateur_tri', 'responsable_methanisation'];

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * E-mail normalisé (minuscules), unique parmi les comptes (contrat 1.2.0).
 * Vide ou absent : null, sauf si l'e-mail est obligatoire (inscription du personnel).
 */
export function controlerEmail(
  etat: Etat,
  valeur: string | null | undefined,
  obligatoire: boolean,
  exclureId?: string,
) {
  const email = String(valeur ?? '')
    .trim()
    .toLowerCase();
  if (!email) {
    if (obligatoire) throw validation('email', "L'e-mail est obligatoire.");
    return null;
  }
  if (!RE_EMAIL.test(email)) throw validation('email', 'Adresse e-mail invalide.');
  if (etat.utilisateurs.some((u) => u.id !== exclureId && u.email?.toLowerCase() === email)) {
    throw new ErreurMock(409, 'EMAIL_DEJA_UTILISE', 'Cette adresse e-mail est déjà utilisée par un autre compte.');
  }
  return email;
}

/** Contrôles communs à toute création de compte (par l'admin ou par inscription) ; renvoie le téléphone et l'e-mail normalisés. */
export function controlerNouveauCompte(
  etat: Etat,
  corps: { nom?: string; telephone?: string; email?: string | null; mot_de_passe?: string },
  emailObligatoire = false,
): { telephone: string; email: string | null } {
  const telephone = String(corps.telephone ?? '').replace(/\s+/g, '');
  if (!corps.nom?.trim()) throw validation('nom', 'Le nom est obligatoire.');
  if (!RE_TELEPHONE.test(telephone)) {
    throw validation('telephone', 'Téléphone attendu au format +225 suivi de 10 chiffres.');
  }
  if ((corps.mot_de_passe ?? '').length < 8) {
    throw validation('mot_de_passe', 'Mot de passe de 8 caractères minimum.');
  }
  if (etat.utilisateurs.some((u) => u.telephone === telephone)) {
    throw new ErreurMock(409, 'TELEPHONE_DEJA_UTILISE', 'Ce numéro est déjà utilisé par un autre compte.');
  }
  return { telephone, email: controlerEmail(etat, corps.email, emailObligatoire) };
}

export const handlersUtilisateurs = [
  route('get', '/utilisateurs/', (ctx) => {
    const moi = ctx.exiger('administrateur', 'referent');
    const role = ctx.query.get('role');
    const statut = ctx.query.get('statut_validation');
    const bacId = ctx.query.get('bac_id');
    const recherche = ctx.query.get('recherche')?.toLowerCase().trim();
    const appartientAuBac = (u: UtilisateurDB, id: string) =>
      u.profil_citoyen?.bac_id === id || u.bac_id_referent === id;
    const liste = ctx.etat.utilisateurs
      // Le référent ne voit que les citoyens de sa résidence.
      .filter(
        (u) => moi.role !== 'referent' || (u.role === 'citoyen' && u.profil_citoyen?.bac_id === moi.bac_id_referent),
      )
      .filter((u) => !role || u.role === role)
      .filter((u) => !statut || u.statut_validation === statut)
      .filter((u) => !bacId || appartientAuBac(u, bacId))
      .filter((u) => !recherche || `${u.nom} ${u.telephone}`.toLowerCase().includes(recherche))
      .sort((a, b) => b.date_creation.localeCompare(a.date_creation))
      .map((u) => utilisateurApi(ctx.etat, u));
    return paginer(ctx, liste);
  }),

  route('get', '/utilisateurs/:id/', (ctx) => {
    ctx.exiger('administrateur', 'referent');
    const u = ctx.etat.utilisateurs.find((x) => x.id === ctx.params.id);
    if (!u) throw introuvable('Utilisateur');
    return utilisateurApi(ctx.etat, u);
  }),

  route('post', '/utilisateurs/', async (ctx) => {
    const auteur = ctx.exiger('administrateur');
    const corps = await ctx.corps<UtilisateurCreation>();
    if (!corps.role || !ROLES.includes(corps.role)) throw validation('role', 'Choisissez un rôle.');
    const avecBac = corps.role === 'citoyen' || corps.role === 'referent';
    if (avecBac && !ctx.etat.bacs.some((b) => b.id === corps.bac_id)) {
      throw validation('bac_id', 'Un bac est obligatoire pour ce rôle.');
    }
    const { telephone, email } = controlerNouveauCompte(ctx.etat, corps);
    const instant = maintenant();
    const u: UtilisateurDB = {
      id: nouvelUuid(ctx.etat, 'a0000000', 900),
      nom: (corps.nom as string).trim(),
      telephone,
      email,
      role: corps.role,
      actif: true,
      // Un compte créé par l'administrateur est validé d'office (contrat 1.3.0).
      statut_validation: 'valide',
      date_creation: instant,
      mot_de_passe: corps.mot_de_passe as string,
      profil_citoyen:
        corps.role === 'citoyen'
          ? {
              bac_id: corps.bac_id as string,
              telephone_verifie: true,
              statut_validation: 'valide',
              date_inscription: instant,
            }
          : null,
      bac_id_referent: corps.role === 'referent' ? (corps.bac_id ?? null) : null,
    };
    ctx.etat.utilisateurs.push(u);
    journaliser(ctx.etat, auteur.id, 'utilisateur.creer', 'utilisateur', u.id, null, { nom: u.nom, role: u.role });
    if (u.profil_citoyen) notifierBacSurinscrit(ctx.etat, u.profil_citoyen.bac_id, auteur.id);
    return reponse(utilisateurApi(ctx.etat, u), 201);
  }),

  route('patch', '/utilisateurs/:id/', async (ctx) => {
    const auteur = ctx.exiger('administrateur');
    const u = ctx.etat.utilisateurs.find((x) => x.id === ctx.params.id);
    if (!u) throw introuvable('Utilisateur');
    const corps = await ctx.corps<UtilisateurModification>();
    if (corps.role !== undefined && !ROLES.includes(corps.role)) throw validation('role', 'Rôle inconnu');
    if (corps.bac_id && !ctx.etat.bacs.some((b) => b.id === corps.bac_id)) throw validation('bac_id', 'Bac inconnu');
    if (u.id === auteur.id && (corps.actif === false || (corps.role && corps.role !== 'administrateur'))) {
      throw new ErreurMock(422, 'VALIDATION', 'Vous ne pouvez pas désactiver ni rétrograder votre propre compte.');
    }
    const email = corps.email !== undefined ? controlerEmail(ctx.etat, corps.email, false, u.id) : u.email;
    const avant = { nom: u.nom, role: u.role, actif: u.actif };
    if (corps.nom?.trim()) u.nom = corps.nom.trim();
    u.email = email;
    if (corps.actif !== undefined) u.actif = corps.actif;
    if (corps.role !== undefined) u.role = corps.role;
    const bacId = corps.bac_id !== undefined ? corps.bac_id : (u.profil_citoyen?.bac_id ?? u.bac_id_referent);
    if (u.role === 'citoyen') {
      if (!bacId) throw validation('bac_id', 'Un citoyen est rattaché à un bac.');
      u.profil_citoyen = u.profil_citoyen
        ? { ...u.profil_citoyen, bac_id: bacId }
        : { bac_id: bacId, telephone_verifie: true, statut_validation: 'valide', date_inscription: maintenant() };
    } else {
      u.profil_citoyen = null;
    }
    u.bac_id_referent = u.role === 'referent' ? (bacId ?? null) : null;
    journaliser(ctx.etat, auteur.id, 'utilisateur.modifier', 'utilisateur', u.id, avant, {
      nom: u.nom,
      role: u.role,
      actif: u.actif,
    });
    return utilisateurApi(ctx.etat, u);
  }),

  // Validation d'un compte du personnel inscrit lui-même (contrat 1.3.0) : administrateur seulement.
  route('post', '/utilisateurs/:id/validation/', async (ctx) => {
    const auteur = ctx.exiger('administrateur');
    const u = ctx.etat.utilisateurs.find((x) => x.id === ctx.params.id);
    if (!u) throw introuvable('Utilisateur');
    const { decision, commentaire } = await ctx.corps<{ decision: 'valider' | 'refuser'; commentaire: string }>();
    if (decision !== 'valider' && decision !== 'refuser') throw validation('decision', 'Décision inconnue');
    if (u.statut_validation !== 'en_attente' || !ROLES_PERSONNEL.includes(u.role)) {
      throw new ErreurMock(409, 'CONFLIT', "Ce compte n'attend pas de validation.");
    }
    u.statut_validation = decision === 'valider' ? 'valide' : 'refuse';
    journaliser(
      ctx.etat,
      auteur.id,
      'utilisateur.valider',
      'utilisateur',
      u.id,
      'en_attente',
      u.statut_validation,
      commentaire ?? null,
    );
    return utilisateurApi(ctx.etat, u);
  }),

  route('get', '/greenpoints/solde/', (ctx) => {
    const moi = ctx.moi();
    const citoyen = ctx.query.get('citoyen_id');
    if (citoyen && moi.role !== 'administrateur') throw accesRefuse();
    return solde(ctx.etat, citoyen ?? moi.id);
  }),
];
