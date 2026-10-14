/** A7 · Paramètres : la validation des comptes du personnel se règle par Activée / Désactivée (contrat 1.5.0). */
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { apiParametres } from '@/api/administration';
import { nouvelEtat, ouvrir, TELEPHONES } from '@/test/rendu';

beforeEach(nouvelEtat);

describe('Paramètres', () => {
  it('active la validation des comptes du personnel après confirmation', async () => {
    const u = await ouvrir('/admin/parametres', TELEPHONES.administrateur);
    await u.click(await screen.findByRole('tab', { name: 'Comptes' }, { timeout: 5000 }));
    const choix = await screen.findByRole('radiogroup', { name: 'Validation des comptes du personnel' });
    expect(within(choix).getByRole('radio', { name: 'Désactivée' })).toBeChecked();

    await u.click(within(choix).getByRole('radio', { name: 'Activée' }));
    const modale = await screen.findByRole('dialog');
    expect(modale).toHaveTextContent('Désactivée');
    expect(modale).toHaveTextContent('devra être validé par un administrateur');
    await u.click(within(modale).getByRole('button', { name: 'Enregistrer' }));

    const valeur = async () => (await apiParametres.lister()).find((p) => p.cle === 'validation_comptes_personnel')?.valeur;
    await expect.poll(valeur).toBe(1);
    expect(await within(choix).findByRole('radio', { name: 'Activée' })).toBeChecked();
  });
});
