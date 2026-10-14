/** Rendu de l'application complète dans un test, connectée au faux backend. */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { apiAuth } from '@/api/auth';
import { jetons } from '@/api/jetons';
import { reinitialiserDonnees } from '@/api/simulation';
import { creerClientRequetes, Fournisseurs } from '@/app/Fournisseurs';
import { RoutesApp } from '@/app/Routes';

export const TELEPHONES = {
  operatrice: '+2250700000003',
  responsable: '+2250700000004',
  administrateur: '+2250700000001',
  referent: '+2250700000005',
} as const;

/** Remet le faux backend à zéro et efface toute session. */
export async function nouvelEtat() {
  await reinitialiserDonnees();
  await jetons.effacer();
}

/** Agit directement sur le faux backend avec un compte donné (préparation d'un scénario). */
export async function enTantQue(telephone: string) {
  await jetons.definir(await apiAuth.connexion({ telephone }, 'greengas2026'));
}

/** Ouvre une page protégée : connexion par le formulaire, puis redirection vers la page demandée. */
export async function ouvrir(chemin: string, telephone: string) {
  await jetons.effacer();
  const utilisateur = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[chemin]}>
      <Fournisseurs client={creerClientRequetes()}>
        <RoutesApp />
      </Fournisseurs>
    </MemoryRouter>,
  );
  await utilisateur.type(await screen.findByLabelText('Téléphone'), telephone);
  await utilisateur.type(screen.getByLabelText('Mot de passe'), 'greengas2026');
  await utilisateur.click(screen.getByRole('button', { name: 'Se connecter' }));
  return utilisateur;
}
