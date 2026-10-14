/** E0 · Connexion : téléphone ou e-mail, refus des comptes mobiles, page d'arrivée après une déconnexion volontaire. */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { creerClientRequetes, Fournisseurs } from '@/app/Fournisseurs';
import { RoutesApp } from '@/app/Routes';
import { nouvelEtat, ouvrir, TELEPHONES } from '@/test/rendu';
import { MESSAGE_APP_MOBILE } from './session';

beforeEach(nouvelEtat);

describe('Connexion', () => {
  it('refuse un compte collecteur avec le message de l’application mobile', async () => {
    await ouvrir('/connexion', '+2250700000002');
    expect(await screen.findByText(MESSAGE_APP_MOBILE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });

  it('connecte avec l’onglet E-mail', async () => {
    render(
      <MemoryRouter initialEntries={['/connexion']}>
        <Fournisseurs client={creerClientRequetes()}>
          <RoutesApp />
        </Fournisseurs>
      </MemoryRouter>,
    );
    const u = userEvent.setup();
    expect(await screen.findByText('+225')).toBeInTheDocument();
    await u.click(await screen.findByRole('radio', { name: 'E-mail' }));
    await u.type(await screen.findByLabelText('E-mail'), 'Aya.Operatrice@greengas.ci');
    await u.type(screen.getByLabelText('Mot de passe'), 'greengas2026');
    await u.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByText('Aya Opératrice')).toBeInTheDocument();
  });

  it('indique un e-mail inconnu', async () => {
    render(
      <MemoryRouter initialEntries={['/connexion']}>
        <Fournisseurs client={creerClientRequetes()}>
          <RoutesApp />
        </Fournisseurs>
      </MemoryRouter>,
    );
    const u = userEvent.setup();
    await u.click(await screen.findByRole('radio', { name: 'E-mail' }));
    await u.type(await screen.findByLabelText('E-mail'), 'inconnu@greengas.ci');
    await u.type(screen.getByLabelText('Mot de passe'), 'greengas2026');
    await u.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByText('E-mail ou mot de passe incorrect')).toBeInTheDocument();
  });

  it('après une déconnexion, le compte suivant arrive sur sa propre page d’accueil', async () => {
    const u = await ouvrir('/tri/historique', TELEPHONES.operatrice);
    expect(await screen.findByRole('heading', { name: 'Historique des tris' })).toBeInTheDocument();

    await u.click(screen.getByRole('button', { name: 'Déconnexion' }));
    await u.type(await screen.findByLabelText('Téléphone'), TELEPHONES.administrateur);
    await u.type(screen.getByLabelText('Mot de passe'), 'greengas2026');
    await u.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Organique reçu')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Historique des tris' })).not.toBeInTheDocument();
  });
});
