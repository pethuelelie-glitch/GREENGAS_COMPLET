/**
 * E1 · Inscription du personnel : compte actif aussitôt (validation désactivée, seed) ou en attente d'un administrateur
 * (validation activée, contrat 1.5.0) ; numéro ou e-mail déjà utilisé refusé.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { apiParametres } from '@/api/administration';
import { jetons } from '@/api/jetons';
import { creerClientRequetes, Fournisseurs } from '@/app/Fournisseurs';
import { RoutesApp } from '@/app/Routes';
import { enTantQue, nouvelEtat, TELEPHONES } from '@/test/rendu';

beforeEach(nouvelEtat);

function ouvrirInscription() {
  render(
    <MemoryRouter initialEntries={['/inscription']}>
      <Fournisseurs client={creerClientRequetes()}>
        <RoutesApp />
      </Fournisseurs>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

async function remplir(
  u: ReturnType<typeof userEvent.setup>,
  { telephone = '07 11 22 33 44', email = 'mamadou.bamba@greengas.ci', confirmation = 'motdepasse1' } = {},
) {
  await u.click(await screen.findByRole('radio', { name: 'Responsable méthanisation' }));
  await u.type(screen.getByLabelText('Nom complet'), 'Mamadou Bamba');
  await u.type(screen.getByLabelText('Téléphone'), telephone);
  await u.type(screen.getByLabelText('E-mail'), email);
  await u.type(screen.getByLabelText('Mot de passe'), 'motdepasse1');
  await u.type(screen.getByLabelText('Confirmer le mot de passe'), confirmation);
  await u.click(screen.getByRole('button', { name: 'Créer mon compte' }));
}

describe('Inscription du personnel', () => {
  it('validation désactivée : compte créé, puis connexion directe', async () => {
    const u = ouvrirInscription();
    await remplir(u);
    expect(await screen.findByRole('heading', { name: 'Compte créé' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Votre compte est actif.');

    await u.click(screen.getByRole('button', { name: 'Se connecter' }));
    await u.type(await screen.findByLabelText('Téléphone'), '0711223344');
    await u.type(screen.getByLabelText('Mot de passe'), 'motdepasse1');
    await u.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByTestId('zone-utilisateur', {}, { timeout: 5000 })).toHaveTextContent('Mamadou Bamba');
  });

  it('validation activée : envoie la demande sans connecter, confirme l’attente, puis la connexion est refusée', async () => {
    await enTantQue(TELEPHONES.administrateur);
    await apiParametres.modifier('validation_comptes_personnel', 1);
    await jetons.effacer();
    const u = ouvrirInscription();
    await remplir(u, { confirmation: 'autre-mot' });
    expect(await screen.findByText('Les deux mots de passe sont différents')).toBeInTheDocument();

    const confirmation = screen.getByLabelText('Confirmer le mot de passe');
    await u.clear(confirmation);
    await u.type(confirmation, 'motdepasse1');
    await u.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    expect(await screen.findByRole('heading', { name: 'Demande envoyée' })).toBeInTheDocument();
    expect(
      screen.getByText('Un administrateur doit valider votre compte avant votre première connexion.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Organique reçu')).not.toBeInTheDocument();

    await u.click(screen.getByRole('button', { name: 'Retour à la connexion' }));
    await u.type(await screen.findByLabelText('Téléphone'), '0711223344');
    await u.type(screen.getByLabelText('Mot de passe'), 'motdepasse1');
    await u.click(screen.getByRole('button', { name: 'Se connecter' }));
    // Message du serveur affiché dans le formulaire (pas une notification qui disparaît).
    expect(await screen.findByRole('alert')).toHaveTextContent("Votre compte attend la validation d'un administrateur.");
  });

  it('contrôle le téléphone (10 chiffres après +225) et l’e-mail avant l’envoi', async () => {
    const u = ouvrirInscription();
    await remplir(u, { telephone: '07 11 22', email: 'mamadou' });
    expect(await screen.findByText('Saisissez les 10 chiffres du numéro')).toBeInTheDocument();
    expect(screen.getByText('Saisissez une adresse e-mail valide')).toBeInTheDocument();
  });

  it('refuse un numéro déjà utilisé et l’indique sous le téléphone', async () => {
    const u = ouvrirInscription();
    await remplir(u, { telephone: '0700000003' });
    expect(await screen.findByText('Ce numéro est déjà utilisé par un autre compte.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer mon compte' })).toBeInTheDocument();
  });

  it('refuse un e-mail déjà utilisé et l’indique sous l’e-mail', async () => {
    const u = ouvrirInscription();
    await remplir(u, { email: 'aya.operatrice@greengas.ci' });
    expect(await screen.findByText('Cette adresse e-mail est déjà utilisée par un autre compte.')).toBeInTheDocument();
  });
});
