/** M1 · Vue globale : carte satellite avec bascule Satellite / Relief, et carte de secours hors ligne. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { nouvelEtat, ouvrir, TELEPHONES } from '@/test/rendu';

beforeEach(nouvelEtat);
afterEach(() => vi.restoreAllMocks());

describe('Carte de la vue globale', () => {
  it('propose le fond satellite par défaut, la bascule vers le relief, et place les trois sites', async () => {
    const u = await ouvrir('/methanisation', TELEPHONES.responsable);
    const satellite = await screen.findByRole('radio', { name: 'Satellite' });
    expect(satellite).toHaveAttribute('data-state', 'checked');
    await u.click(screen.getByRole('radio', { name: 'Relief' }));
    expect(screen.getByRole('radio', { name: 'Relief' })).toHaveAttribute('data-state', 'checked');
    for (const code of ['DIG-01', 'DIG-02', 'DIG-03']) {
      expect(await screen.findByRole('button', { name: new RegExp(`^${code}`) })).toBeInTheDocument();
    }
  });

  it('reprend la carte stylisée, avec les mêmes sites, quand l’appareil est hors ligne', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    await ouvrir('/methanisation', TELEPHONES.responsable);
    expect(await screen.findByText('Carte satellite indisponible (hors ligne)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
    expect(screen.getByText('Lagune Ébrié')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /^DIG-02/ })).toBeInTheDocument();
  });
});
