import { client, executer } from './client';
import type { InscriptionPersonnelRequete } from './types';

/** Identifiant de connexion : téléphone ou e-mail (contrat 1.2.0). */
export type Identifiant = { telephone: string } | { email: string };

export const apiAuth = {
  connexion: (identifiant: Identifiant, mot_de_passe: string) =>
    executer(client.POST('/auth/token/', { body: { ...identifiant, mot_de_passe } })),
  /** Demande d'inscription d'un opérateur de tri ou d'un responsable méthanisation : compte en attente, sans jetons. */
  inscrirePersonnel: (corps: InscriptionPersonnelRequete) =>
    executer(client.POST('/auth/inscription/personnel/', { body: corps })),
  moi: () => executer(client.GET('/auth/moi/')),
};
