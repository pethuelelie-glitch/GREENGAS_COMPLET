/** Notifications (contrat 1.4.0) : règles du serveur simulé et cloche de la barre du haut. */
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { apiParametres } from '@/api/administration';
import { apiAuth } from '@/api/auth';
import { apiNotifications } from '@/api/notifications';
import { apiSimulation } from '@/api/simulation';
import { apiTri } from '@/api/tri';
import { enTantQue, nouvelEtat, ouvrir, TELEPHONES } from '@/test/rendu';

const TRN_01 = '70e00000-0000-4000-8000-000000000001';
const TRN_02 = '70e00000-0000-4000-8000-000000000002';
const DIG_02 = 'd1900000-0000-4000-8000-000000000002';
const TRI = {
  niveau_contamination: 'faible' as const,
  lots: [
    { categorie: 'organique' as const, poids_kg: 320 },
    { categorie: 'biomasse' as const, poids_kg: 30 },
    { categorie: 'plastique' as const, poids_kg: 60 },
    { categorie: 'metal' as const, poids_kg: 10 },
    { categorie: 'carton_papier' as const, poids_kg: 40 },
    { categorie: 'verre' as const, poids_kg: 20 },
    { categorie: 'refus' as const, poids_kg: 20 },
  ],
  motif_ecart: null,
};

beforeEach(nouvelEtat);

describe('Notifications du serveur', () => {
  it('Aya a 2 tournées à trier, puis 1 après le tri de TRN-0912-01', async () => {
    await enTantQue(TELEPHONES.operatrice);
    expect(await apiNotifications.compteur()).toEqual({ non_lues: 2 });
    const liste = await apiNotifications.lister();
    expect(liste.map((n) => n.message)).toEqual(
      expect.arrayContaining([
        'TRN-0912-01 (NORD, 500 kg) attend son tri.',
        'TRN-0912-02 (EST, 500 kg) attend son tri.',
      ]),
    );
    const r = await apiTri.valider(TRN_01, TRI);
    expect(r.valeur_kg).toBe(8.54);
    expect(await apiNotifications.compteur()).toEqual({ non_lues: 1 });
  });

  it('le facteur 0,7 sur DIG-02 notifie Serge et les administrateurs (critique)', async () => {
    await enTantQue(TELEPHONES.operatrice);
    await apiTri.valider(TRN_02, TRI);
    await enTantQue(TELEPHONES.administrateur);
    await apiSimulation.forcerFacteur(DIG_02, 0.7);
    for (const tel of [TELEPHONES.responsable, TELEPHONES.administrateur]) {
      await enTantQue(tel);
      const [n] = await apiNotifications.lister(20, false);
      expect(n).toMatchObject({ type: 'alerte_ouverte', niveau: 'critique', objet_type: 'alerte' });
      expect(n.message).toMatch(/^DIG-02 : biogaz −30 % \(22,4 m³ pour 32 m³ attendus\)\.$/);
    }
  });

  it('l’administrateur voit la collecte à vérifier (pas de compte à valider, validation désactivée) ; une notification d’un autre renvoie 404 ; tout lire remet à 0', async () => {
    await enTantQue(TELEPHONES.administrateur);
    const liste = await apiNotifications.lister();
    expect(liste.some((n) => n.type === 'collecte_a_verifier' && n.message.startsWith('BAC-022 : 2 kg pour 40 scans'))).toBe(true);
    expect(liste.some((n) => n.type === 'compte_a_valider')).toBe(false);
    await enTantQue(TELEPHONES.operatrice);
    await expect(apiNotifications.marquerLue(liste[0].id)).rejects.toMatchObject({ status: 404 });
    expect((await apiNotifications.toutLire()).marquees).toBe(2);
    expect(await apiNotifications.compteur()).toEqual({ non_lues: 0 });
  });
});

describe('Comptes à valider (contrat 1.5.0)', () => {
  const corps = {
    nom: 'Mamadou Bamba',
    telephone: '+2250711223344',
    email: 'mamadou.bamba@greengas.ci',
    mot_de_passe: 'motdepasse1',
    role: 'operateur_tri' as const,
  };

  it('validation désactivée : une inscription ne notifie personne', async () => {
    await apiAuth.inscrirePersonnel(corps);
    await enTantQue(TELEPHONES.administrateur);
    expect((await apiNotifications.lister()).some((n) => n.type === 'compte_a_valider')).toBe(false);
  });

  it('validation activée : une inscription notifie les administrateurs', async () => {
    await enTantQue(TELEPHONES.administrateur);
    await apiParametres.modifier('validation_comptes_personnel', 1);
    await apiAuth.inscrirePersonnel(corps);
    const [n] = await apiNotifications.lister(20, false);
    expect(n).toMatchObject({ type: 'compte_a_valider', message: 'Mamadou Bamba demande un accès opérateur de tri.' });
  });
});

describe('Cloche', () => {
  it('affiche la pastille, ouvre le panneau, marque comme lu et ouvre la saisie du tri', async () => {
    const u = await ouvrir('/tri', TELEPHONES.operatrice);
    expect(await screen.findByTestId('pastille-notifications')).toHaveTextContent('2');
    await u.click(screen.getByRole('button', { name: /^Notifications/ }));
    const panneau = await screen.findByRole('dialog', { name: 'Notifications' });
    const element = await within(panneau).findByText(
      'TRN-0912-01 (NORD, 500 kg) attend son tri.',
      {},
      { timeout: 5000 },
    );
    await u.click(element);
    expect(await screen.findByRole('heading', { name: /Saisie du tri/ }, { timeout: 5000 })).toBeInTheDocument();
    expect(await screen.findByTestId('pastille-notifications')).toHaveTextContent('1');
  });

  it('« Tout marquer comme lu » vide la pastille', async () => {
    const u = await ouvrir('/tri', TELEPHONES.operatrice);
    await screen.findByTestId('pastille-notifications');
    await u.click(screen.getByRole('button', { name: /^Notifications/ }));
    await u.click(await screen.findByRole('button', { name: 'Tout marquer comme lu' }));
    await expect.poll(() => screen.queryByTestId('pastille-notifications')).toBeNull();
  });
});
