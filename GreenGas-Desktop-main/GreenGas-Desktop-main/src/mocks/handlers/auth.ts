import type { ConnexionRequete, InscriptionPersonnelRequete, RoleInscription } from '@/api/types';
import { journaliser } from '../calculs';
import { ErreurMock, validation } from '../erreurs';
import { nouvelUuid, validationPersonnelActive, type Etat, type UtilisateurDB } from '../etat';
import { maintenant } from '../horloge';
import { emettreJetons, lireJetonRafraichissement, reponse, route } from '../http';
import { contenuCompteAValider, destinatairesRoles, notifier } from '../notifications';
import { utilisateurApi } from '../serialiseurs';
import { controlerNouveauCompte } from './utilisateurs';

/** Rôles ouverts à l'inscription dans le Control Center (contrat 1.1.0). */
const ROLES_INSCRIPTION: RoleInscription[] = ['operateur_tri', 'responsable_methanisation'];

/**
 * Compte qui ne peut pas se connecter (contrat 1.3.0) : personnel en attente ou refusé, compte désactivé.
 * En attente seulement si la validation est activée (contrat 1.5.0). Le mot de passe a déjà été vérifié.
 */
function controlerEtatDuCompte(etat: Etat, u: UtilisateurDB) {
  if (u.statut_validation === 'en_attente' && validationPersonnelActive(etat)) {
    throw new ErreurMock(403, 'COMPTE_NON_VALIDE', "Votre compte attend la validation d'un administrateur.", {
      statut_validation: 'en_attente',
    });
  }
  if (u.statut_validation === 'refuse') {
    throw new ErreurMock(403, 'COMPTE_NON_VALIDE', "Votre demande d'accès a été refusée.", {
      statut_validation: 'refuse',
    });
  }
  if (!u.actif) throw new ErreurMock(403, 'COMPTE_NON_VALIDE', 'Ce compte est désactivé.', { actif: false });
}

export const handlersAuth = [
  route('post', '/auth/token/', async (ctx) => {
    // Identifiant au choix : téléphone ou e-mail, exactement un des deux (contrat 1.2.0).
    const corps = await ctx.corps<Partial<ConnexionRequete>>();
    const telephone = String(corps.telephone ?? '').replace(/\s+/g, '');
    const email = String(corps.email ?? '')
      .trim()
      .toLowerCase();
    if (!telephone === !email) throw validation('telephone', 'Indiquez un téléphone ou un e-mail.');
    const u = telephone
      ? ctx.etat.utilisateurs.find((x) => x.telephone === telephone)
      : ctx.etat.utilisateurs.find((x) => x.email?.toLowerCase() === email);
    if (!u || corps.mot_de_passe !== u.mot_de_passe) {
      const identifiant = telephone ? 'Téléphone' : 'E-mail';
      throw new ErreurMock(401, 'NON_AUTHENTIFIE', `${identifiant} ou mot de passe incorrect`);
    }
    controlerEtatDuCompte(ctx.etat, u);
    return { ...emettreJetons(u), utilisateur: utilisateurApi(ctx.etat, u) };
  }),

  // Inscription du personnel, aucun jeton émis : en attente d'un administrateur si la validation est activée,
  // compte valide aussitôt sinon (contrat 1.5.0).
  route('post', '/auth/inscription/personnel/', async (ctx) => {
    const corps = await ctx.corps<Partial<InscriptionPersonnelRequete>>();
    if (!corps.role || !ROLES_INSCRIPTION.includes(corps.role)) {
      throw validation('role', 'Choisissez « Opérateur de tri » ou « Responsable méthanisation ».');
    }
    const { telephone, email } = controlerNouveauCompte(ctx.etat, corps, true);
    const u: UtilisateurDB = {
      id: nouvelUuid(ctx.etat, 'a0000000', 900),
      nom: (corps.nom as string).trim(),
      telephone,
      email,
      role: corps.role,
      actif: true,
      statut_validation: validationPersonnelActive(ctx.etat) ? 'en_attente' : 'valide',
      date_creation: maintenant(),
      mot_de_passe: corps.mot_de_passe as string,
      profil_citoyen: null,
      bac_id_referent: null,
    };
    ctx.etat.utilisateurs.push(u);
    journaliser(ctx.etat, u.id, 'utilisateur.inscrire', 'utilisateur', u.id, null, {
      nom: u.nom,
      role: u.role,
      statut_validation: u.statut_validation,
    });
    if (u.statut_validation === 'en_attente') {
      notifier(ctx.etat, destinatairesRoles(ctx.etat, 'administrateur'), contenuCompteAValider(u));
    }
    return reponse(utilisateurApi(ctx.etat, u), 201);
  }),

  route('post', '/auth/token/rafraichir/', async (ctx) => {
    const { refresh } = await ctx.corps<{ refresh: string }>();
    const u = lireJetonRafraichissement(ctx.etat, refresh);
    if (!u) throw new ErreurMock(401, 'NON_AUTHENTIFIE', 'Session expirée, reconnectez-vous');
    return { access: emettreJetons(u).access };
  }),

  route('get', '/auth/moi/', (ctx) => utilisateurApi(ctx.etat, ctx.moi())),
];
