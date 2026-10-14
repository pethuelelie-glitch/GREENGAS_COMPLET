/** A2 · Traçabilité de BAC-014 après le tri : scans, collecte, tournée, lot, points par citoyen. */
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { apiTri } from '@/api/tri';
import { enTantQue, nouvelEtat, ouvrir, TELEPHONES } from '@/test/rendu';

const TRN_01 = '70e00000-0000-4000-8000-000000000001';

beforeEach(nouvelEtat);

describe('Traçabilité de BAC-014', () => {
  it('remonte du bac jusqu’aux points (Awa 105, Koffi 79, Mariam 65, Yao 39)', async () => {
    await enTantQue(TELEPHONES.operatrice);
    await apiTri.valider(TRN_01, {
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

    await ouvrir('/admin/tracabilite?bac=BAC-014', TELEPHONES.administrateur);

    expect(await screen.findByText(/Résidence Atlantic · secteur Nord · 6 foyers déclarés/)).toBeInTheDocument();
    expect((await screen.findAllByText('TRN-0912-01')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('ORG-0258').length).toBeGreaterThan(0);
    expect(screen.getByText('290')).toBeInTheDocument();
    for (const [nom, points] of [
      ['Awa Koné', '105'],
      ['Koffi Yao', '79'],
      ['Mariam Traoré', '65'],
      ["Yao N'Guessan", '39'],
    ]) {
      const carte = screen.getAllByText(nom).find((el) => el.parentElement?.textContent?.includes(points));
      expect(carte, `${nom} ${points}`).toBeDefined();
    }
    expect(screen.getByText('Fatou Diabaté')).toBeInTheDocument();
  });
});
