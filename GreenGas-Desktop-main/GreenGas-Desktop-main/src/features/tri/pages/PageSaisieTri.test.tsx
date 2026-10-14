/** T2 · Saisie du tri : composition du Guide commun §8.3, contrôle de cohérence, puis résultat du serveur (T3). */
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { nouvelEtat, ouvrir, TELEPHONES } from '@/test/rendu';

const TRN_01 = '70e00000-0000-4000-8000-000000000001';

/** Composition de référence du Guide commun §8.3, hors organique (500 kg au total avec 320 kg d'organique). */
const AUTRES_CATEGORIES = {
  Biomasse: '30',
  Plastique: '60',
  Métal: '10',
  'Carton / papier': '40',
  Verre: '20',
  Refus: '20',
};

beforeEach(nouvelEtat);

describe('Saisie du tri de TRN-0912-01', () => {
  it('affiche la tournée, contrôle l’écart en direct et aboutit à 8,54 pts/kg et 290 points pour BAC-014', async () => {
    const u = await ouvrir(`/tri/${TRN_01}/saisie`, TELEPHONES.operatrice);

    expect(await screen.findByText(/Secteur Nord · destination DIG-01 · poids collecté 500\skg/)).toBeInTheDocument();
    expect(screen.getByText(/Digesteur DIG-01/)).toBeInTheDocument();

    // Le formulaire s'ouvre vide.
    const organique = screen.getByLabelText('Organique en kg');
    expect(organique).toHaveValue(null);
    for (const [libelle, kg] of Object.entries(AUTRES_CATEGORIES)) {
      await u.type(screen.getByLabelText(`${libelle} en kg`), kg);
    }

    // Hors tolérance : le motif devient obligatoire et la validation est bloquée.
    await u.type(organique, '300');
    expect(await screen.findByText(/hors tolérance de 2\s%/)).toBeInTheDocument();
    expect(screen.getByText("Motif de l'écart (obligatoire)")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Valider le tri' })).toBeDisabled();

    await u.clear(organique);
    await u.type(organique, '320');
    expect(await screen.findByText(/Écart 0,0\s%/)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Valider le tri' }));
    const modale = await screen.findByRole('dialog');
    expect(within(modale).getByText(/seront envoyés au digesteur/)).toBeInTheDocument();
    await u.click(within(modale).getByRole('button', { name: 'Valider le tri' }));

    // T3 : résultat calculé par le serveur.
    expect(await screen.findByText(/Résultat du tri/)).toBeInTheDocument();
    expect(await screen.findByText('8,54')).toBeInTheDocument();
    expect(screen.getByText('288')).toBeInTheDocument();
    expect(screen.getByText('ORG-0258')).toBeInTheDocument();
    expect(await screen.findByText('290')).toBeInTheDocument();
    const awa = await screen.findByText(/Awa Koné/);
    expect(awa.parentElement).toHaveTextContent('Awa Koné 105');
  });
});
