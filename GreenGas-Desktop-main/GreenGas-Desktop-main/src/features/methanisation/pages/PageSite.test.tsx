/** M2 · Tableau de bord de DIG-02 après la baisse injectée : −30 %, alerte, 38,08 kWh. */
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { apiSimulation } from '@/api/simulation';
import { apiTri } from '@/api/tri';
import { enTantQue, nouvelEtat, ouvrir, TELEPHONES } from '@/test/rendu';

const TRN_02 = '70e00000-0000-4000-8000-000000000002';
const DIG_02 = 'd1900000-0000-4000-8000-000000000002';

beforeEach(nouvelEtat);

describe('Tableau de bord de DIG-02', () => {
  it('affiche l’écart de −30 %, l’alerte et l’énergie calculée par le serveur', async () => {
    await enTantQue(TELEPHONES.operatrice);
    await apiTri.valider(TRN_02, {
      niveau_contamination: 'faible',
      lots: [
        { categorie: 'organique', poids_kg: 320 },
        { categorie: 'biomasse', poids_kg: 30 },
        { categorie: 'plastique', poids_kg: 60 },
        { categorie: 'metal', poids_kg: 10 },
        { categorie: 'carton_papier', poids_kg: 40 },
        { categorie: 'verre', poids_kg: 20 },
        { categorie: 'refus', poids_kg: 20 },
      ],
      motif_ecart: null,
    });
    await enTantQue(TELEPHONES.administrateur);
    await apiSimulation.forcerFacteur(DIG_02, 0.7);

    await ouvrir(`/methanisation/sites/${DIG_02}`, TELEPHONES.responsable);

    expect(await screen.findByText(/−30,0\s%/)).toBeInTheDocument();
    expect(screen.getByText(/38,08\skWh/)).toBeInTheDocument();
    expect(screen.getByText(/76,16\skWh/)).toBeInTheDocument();
    expect(screen.getByText(/22,4\sm³/)).toBeInTheDocument();
    expect(screen.getByText(/160\skg/)).toBeInTheDocument();
    expect(screen.getByText('7,8')).toBeInTheDocument();
    // Bandeau global d'alerte (alerte ouverte par le serveur).
    expect(await screen.findByText(/Production de biogaz inférieure de 30\s% à l'attendu/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clôturer la journée/ })).toBeEnabled();
  });
});
