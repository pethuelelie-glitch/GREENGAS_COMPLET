/**
 * Session de l'utilisateur connecté : connexion, inscription du personnel, restauration (Electron), expiration et déconnexion.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiAuth, type Identifiant } from '@/api/auth';
import { rafraichirJeton, surSessionExpiree } from '@/api/client';
import { ErreurApi } from '@/api/erreurs';
import { jetons } from '@/api/jetons';
import {
  estRoleControlCenter,
  type InscriptionPersonnelRequete,
  type Jetons,
  type RoleControlCenter,
  type Utilisateur,
} from '@/api/types';

export type UtilisateurConnecte = Utilisateur & { role: RoleControlCenter };

type EtatSession =
  | { statut: 'chargement' }
  /** `volontaire` : déconnexion demandée par l'utilisateur (le compte suivant repart de sa page d'accueil). */
  | { statut: 'deconnecte'; motif?: string; volontaire?: boolean }
  | { statut: 'connecte'; utilisateur: UtilisateurConnecte };

interface ContexteSession {
  etat: EtatSession;
  connecter: (identifiant: Identifiant, motDePasse: string) => Promise<UtilisateurConnecte>;
  /** Demande d'inscription d'un opérateur de tri ou d'un responsable méthanisation, en attente d'un administrateur. */
  inscrire: (corps: InscriptionPersonnelRequete) => Promise<Utilisateur>;
  deconnecter: (motif?: string) => Promise<void>;
}

export const MESSAGE_APP_MOBILE = "Ce compte s'utilise dans l'application mobile GREENGAS.";

const Contexte = createContext<ContexteSession | null>(null);

export function FournisseurSession({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [etat, setEtat] = useState<EtatSession>({ statut: 'chargement' });

  const deconnecter = useCallback(
    async (motif?: string) => {
      await jetons.effacer();
      queryClient.clear();
      setEtat({ statut: 'deconnecte', motif, volontaire: motif === undefined });
    },
    [queryClient],
  );

  /** Ouvre la session à partir des jetons renvoyés par la connexion. */
  const ouvrirSession = useCallback(
    async (reponse: Jetons) => {
      const { utilisateur } = reponse;
      if (!estRoleControlCenter(utilisateur.role)) {
        // Les jetons d'un compte mobile ne sont jamais conservés par le Control Center.
        throw new ErreurApi(403, 'COMPTE_MOBILE', MESSAGE_APP_MOBILE);
      }
      queryClient.clear();
      await jetons.definir(reponse);
      const connecte = utilisateur as UtilisateurConnecte;
      setEtat({ statut: 'connecte', utilisateur: connecte });
      return connecte;
    },
    [queryClient],
  );

  const connecter = useCallback(
    async (identifiant: Identifiant, motDePasse: string) =>
      ouvrirSession(
        await apiAuth.connexion(
          'telephone' in identifiant
            ? { telephone: identifiant.telephone.replace(/\s+/g, '') }
            : { email: identifiant.email.trim().toLowerCase() },
          motDePasse,
        ),
      ),
    [ouvrirSession],
  );

  // Contrat 1.3.0 : la demande est enregistrée en attente d'un administrateur, sans jetons ni session.
  const inscrire = useCallback(
    (corps: InscriptionPersonnelRequete) =>
      apiAuth.inscrirePersonnel({
        ...corps,
        nom: corps.nom.trim(),
        telephone: corps.telephone.replace(/\s+/g, ''),
        email: corps.email.trim().toLowerCase(),
      }),
    [],
  );

  // Au démarrage : Electron relit le jeton chiffré ; le navigateur repart toujours de la connexion.
  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        if ((await jetons.restaurer()) && (await rafraichirJeton())) {
          const u = await apiAuth.moi();
          if (!annule && estRoleControlCenter(u.role)) {
            setEtat({ statut: 'connecte', utilisateur: u as UtilisateurConnecte });
            return;
          }
        }
      } catch {
        await jetons.effacer();
      }
      if (!annule) setEtat({ statut: 'deconnecte' });
    })();
    return () => {
      annule = true;
    };
  }, []);

  useEffect(
    () => surSessionExpiree(() => void deconnecter('Votre session a expiré. Reconnectez-vous pour continuer.')),
    [deconnecter],
  );

  const valeur = useMemo(() => ({ etat, connecter, inscrire, deconnecter }), [etat, connecter, inscrire, deconnecter]);
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useSession(): ContexteSession {
  const c = useContext(Contexte);
  if (!c) throw new Error('useSession doit être utilisé dans <FournisseurSession>');
  return c;
}

/** Utilisateur connecté (à utiliser sous une route protégée). */
export function useUtilisateur(): UtilisateurConnecte {
  const { etat } = useSession();
  if (etat.statut !== 'connecte') throw new Error('Aucun utilisateur connecté');
  return etat.utilisateur;
}
