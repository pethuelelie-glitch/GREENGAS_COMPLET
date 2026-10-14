/** Barre latérale en icônes et zone utilisateur : navigation par rôle, infobulles, Paramètres et Déconnexion en bas, profil en lecture seule. */
import { beforeEach, describe, expect, it } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import { nouvelEtat, ouvrir, TELEPHONES } from '@/test/rendu';

beforeEach(nouvelEtat);

const CAS = [
  {
    role: 'opérateur de tri',
    telephone: TELEPHONES.operatrice,
    accueil: '/tri',
    nom: 'Aya Opératrice',
    libelleRole: 'Opérateur de tri',
    navigation: ['Tournées à trier', 'Historique des tris'],
    parametres: '/preferences',
  },
  {
    role: 'responsable méthanisation',
    telephone: TELEPHONES.responsable,
    accueil: '/methanisation',
    nom: 'Serge Méthanisation',
    libelleRole: 'Responsable méthanisation',
    navigation: ['Vue globale', 'Sites', 'Alertes'],
    parametres: '/preferences',
  },
  {
    role: 'référent',
    telephone: TELEPHONES.referent,
    accueil: '/admin/verifications',
    nom: 'Référent Atlantic',
    libelleRole: 'Référent',
    navigation: ['Vérifications'],
    parametres: '/preferences',
  },
  {
    role: 'administrateur',
    telephone: TELEPHONES.administrateur,
    accueil: '/methanisation',
    nom: 'Administrateur GreenGas',
    libelleRole: 'Administrateur',
    navigation: [
      'Vue globale',
      'Supervision',
      'Traçabilité',
      'Vérifications',
      'Bacs',
      'Utilisateurs',
      'Tournées',
      'Journal',
      'Capteurs',
    ],
    parametres: '/admin/parametres',
  },
] as const;

/** Nom de l'écran porté par l'`aria-label` (le compteur éventuel est ajouté entre parenthèses). */
const nomEcran = (el: HTMLElement) => el.getAttribute('aria-label')?.replace(/ \(\d+ à traiter\)$/, '');

describe.each(CAS)('Barre latérale · $role', (cas) => {
  it('affiche la navigation du rôle en icônes, puis Paramètres et Déconnexion hors de la navigation', async () => {
    await ouvrir(cas.accueil, cas.telephone);
    const navigation = await screen.findByRole('navigation', { name: 'Navigation principale' });
    const liens = within(navigation).getAllByRole('link');
    expect(liens.map(nomEcran)).toEqual(cas.navigation);
    // Icône seule : aucun texte sous l'icône (seul le compteur éventuel est écrit).
    for (const lien of liens) expect(lien.textContent?.replace(/\d+/g, '').trim()).toBe('');
    expect(within(navigation).queryByRole('link', { name: 'Paramètres' })).toBeNull();

    const compte = screen.getByRole('group', { name: 'Compte' });
    const parametres = within(compte).getByRole('link', { name: 'Paramètres' });
    const deconnexion = within(compte).getByRole('button', { name: 'Déconnexion' });
    expect(parametres).toHaveAttribute('href', cas.parametres);
    expect(parametres).toHaveTextContent(/^$/);
    expect(deconnexion).toHaveTextContent(/^$/);
  });

  it('affiche le nom de chaque écran dans une infobulle au focus clavier', async () => {
    await ouvrir(cas.accueil, cas.telephone);
    const navigation = await screen.findByRole('navigation', { name: 'Navigation principale' });
    for (const lien of within(navigation).getAllByRole('link')) {
      act(() => lien.focus());
      expect(await screen.findByRole('tooltip')).toHaveTextContent(nomEcran(lien) ?? '');
      act(() => lien.blur());
    }
  });

  it('montre le nom et le rôle de la session dans la zone utilisateur, sans action', async () => {
    await ouvrir(cas.accueil, cas.telephone);
    const zone = (await screen.findAllByTestId('zone-utilisateur'))[0];
    expect(zone).toHaveTextContent(cas.nom);
    expect(zone).toHaveTextContent(cas.libelleRole);
    expect(within(zone).queryByRole('button')).toBeNull();
  });

  it('ouvre sa page Paramètres et garde le bouton en surbrillance', async () => {
    const u = await ouvrir(cas.accueil, cas.telephone);
    const parametres = within(await screen.findByRole('group', { name: 'Compte' })).getByRole('link', {
      name: 'Paramètres',
    });
    await u.click(parametres);
    expect(await screen.findByRole('heading', { level: 1, name: /Paramètres/ })).toBeInTheDocument();
    expect(parametres).toHaveAttribute('aria-current', 'page');
    const navigation = screen.getByRole('navigation', { name: 'Navigation principale' });
    expect(within(navigation).queryByRole('link', { current: 'page' })).toBeNull();
  });
});

describe('Pastilles', () => {
  it('garde le compteur sur l’icône et dans le nom accessible', async () => {
    await ouvrir('/tri', TELEPHONES.operatrice);
    const lien = await screen.findByRole('link', { name: 'Tournées à trier (2 à traiter)' });
    expect(lien).toHaveTextContent('2');
  });
});

describe('Déconnexion', () => {
  it('affiche l’infobulle « Se déconnecter » et déconnecte au clavier', async () => {
    const u = await ouvrir('/tri', TELEPHONES.operatrice);
    const bouton = await screen.findByRole('button', { name: 'Déconnexion' });
    act(() => bouton.focus());
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Se déconnecter');
    await u.keyboard('{Enter}');
    expect(await screen.findByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });
});

describe('Préférences personnelles', () => {
  it('applique le thème sombre et les animations réduites, et affiche le compte en lecture seule', async () => {
    const u = await ouvrir('/preferences', TELEPHONES.operatrice);
    expect(await screen.findByText('aya.operatrice@greengas.ci')).toBeInTheDocument();
    await u.click(screen.getByRole('radio', { name: 'Sombre' }));
    expect(document.documentElement.dataset.theme).toBe('sombre');
    await u.click(screen.getByRole('radio', { name: 'Réduites' }));
    expect(document.documentElement.dataset.mouvement).toBe('reduit');
    await u.click(screen.getByRole('radio', { name: 'Clair' }));
    await u.click(screen.getByRole('radio', { name: 'Normales' }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.documentElement.dataset.mouvement).toBeUndefined();
  });
});
