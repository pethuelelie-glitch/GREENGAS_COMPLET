/**
 * Le faux backend doit donner exactement les résultats du Guide commun (§8 et §12),
 * en passant par la vraie couche src/api (client, jetons, erreurs).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import seed from '../../docs/reference/seed.json';
import { apiAuth } from '@/api/auth';
import { apiBacs, apiJournal, apiParametres, apiUtilisateurs, apiVerifications } from '@/api/administration';
import { apiAlertes } from '@/api/alertes';
import { ErreurApi } from '@/api/erreurs';
import { jetons } from '@/api/jetons';
import { apiProductions } from '@/api/productions';
import { apiSimulation, reinitialiserDonnees } from '@/api/simulation';
import { apiSites } from '@/api/sites';
import { apiTournees } from '@/api/tournees';
import { apiTri } from '@/api/tri';
import type { TriRequete } from '@/api/types';
import { etatCourant } from './base';

const TRN_01 = '70e00000-0000-4000-8000-000000000001';
const TRN_02 = '70e00000-0000-4000-8000-000000000002';
const BAC_014 = 'bac00000-0000-4000-8000-000000000014';
const BAC_022 = 'bac00000-0000-4000-8000-000000000022';
const DIG_02 = 'd1900000-0000-4000-8000-000000000002';

const TRI_DE_REFERENCE: TriRequete = {
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
};

async function connecter(telephone: string) {
  const r = await apiAuth.connexion({ telephone }, 'greengas2026');
  await jetons.definir(r);
  return r.utilisateur;
}
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Validation du personnel activée par l'administrateur (désactivée dans le seed, contrat 1.5.0). */
async function activerValidation() {
  await connecter('+2250700000001');
  await apiParametres.modifier('validation_comptes_personnel', 1);
  await jetons.effacer();
}

beforeEach(async () => {
  await reinitialiserDonnees();
  await jetons.effacer();
});

describe('état de départ (seed v1.3)', () => {
  it('charge tout le seed : historique, production du 12/09 et numérotation des lots', async () => {
    const e = etatCourant();
    expect({
      tournees: e.tournees.length,
      collectes: e.collectes.length,
      scans: e.scans.length,
      lots: e.lots.length,
      tris: e.tris.size,
      transactions: e.transactions.length,
      productions: e.productions.length,
      alertes: e.alertes.length,
      journal: e.journal.length,
    }).toEqual({
      tournees: 14,
      collectes: 34,
      scans: 293,
      lots: 84,
      tris: 12,
      transactions: 36,
      productions: 24,
      alertes: 0,
      journal: 0,
    });
    expect(e.utilisateurs.find((u) => u.role === 'referent')?.bac_id_referent).toBe(BAC_014);

    await connecter('+2250700000004');
    const globale = await apiProductions.globale('2026-09-12');
    expect(globale).toMatchObject({ poids_organique_recu_kg: 320, biogaz_mesure_m3: 32, alertes_ouvertes: 0 });

    await connecter('+2250700000003');
    const r = await apiTri.valider(TRN_01, TRI_DE_REFERENCE);
    expect(r.lots.find((l) => l.categorie === 'organique')?.code_lot).toBe('ORG-0258');
    // Les objets créés ne réutilisent jamais un identifiant du seed.
    const idsDuSeed = new Set([...seed.lots, ...seed.transactions, ...seed.productions].map((o) => o.id));
    expect(e.lots.length).toBe(91);
    expect([...e.lots.slice(84), ...e.transactions.slice(36)].some((o) => idsDuSeed.has(o.id))).toBe(false);
  });
});

describe('connexion', () => {
  it('refuse un mauvais mot de passe avec le code NON_AUTHENTIFIE', async () => {
    await expect(apiAuth.connexion({ telephone: '+2250700000003' }, 'faux')).rejects.toMatchObject({
      code: 'NON_AUTHENTIFIE',
    });
  });

  it("affiche l'administrateur sous le nom « Administrateur GreenGas »", async () => {
    const u = await connecter('+2250700000001');
    expect(u.nom).toBe('Administrateur GreenGas');
    expect(u.role).toBe('administrateur');
  });

  it('exige un jeton pour lire les données', async () => {
    await expect(apiSites.lister()).rejects.toMatchObject({ code: 'NON_AUTHENTIFIE', status: 401 });
  });
});

describe('tri de TRN-0912-01 (Guide commun §8.3)', () => {
  it('donne 8,54 points/kg, 288 points crédités, 290 points pour BAC-014 et ORG-0258', async () => {
    await connecter('+2250700000003');
    const tournees = await apiTournees.lister({ statut: 'collectee' });
    expect(tournees.map((t) => t.code)).toEqual(['TRN-0912-01', 'TRN-0912-02']);
    expect(tournees[0].poids_collecte_kg).toBe(500);

    const r = await apiTri.valider(TRN_01, TRI_DE_REFERENCE);
    expect(r.valeur_kg).toBe(8.54);
    expect(r.coef_qualite).toBe(1);
    expect(r.points_credites).toBe(288);
    expect(r.points_en_attente).toBe(0);
    expect(r.nb_transactions).toBe(4);
    expect(r.lots.find((l) => l.categorie === 'organique')?.code_lot).toBe('ORG-0258');

    const trace = await apiBacs.tracabilite(BAC_014);
    const etape = trace.historique[0];
    expect(etape.tournee.code).toBe('TRN-0912-01');
    expect(etape.points_bac).toBe(290.36);
    const parNom = Object.fromEntries(
      etape.transactions.map((t) => [trace.citoyens.find((c) => c.id === t.citoyen_id)?.nom, t.points]),
    );
    expect(parNom).toEqual({ 'Awa Koné': 105, 'Koffi Yao': 79, 'Mariam Traoré': 65, "Yao N'Guessan": 39 });
  });

  it('refuse un second tri avec le code CONFLIT et un écart hors tolérance sans motif', async () => {
    await connecter('+2250700000003');
    const ecart = {
      ...TRI_DE_REFERENCE,
      lots: TRI_DE_REFERENCE.lots.map((l) => (l.categorie === 'organique' ? { ...l, poids_kg: 300 } : l)),
    };
    await expect(apiTri.valider(TRN_01, ecart)).rejects.toMatchObject({
      code: 'ECART_TOLERANCE',
      details: { ecart_pct: -4 },
    });
    await apiTri.valider(TRN_01, TRI_DE_REFERENCE);
    await expect(apiTri.valider(TRN_01, TRI_DE_REFERENCE)).rejects.toMatchObject({ code: 'CONFLIT', status: 409 });
  });

  it("refuse le tri à un autre rôle que l'opérateur (403)", async () => {
    await connecter('+2250700000001');
    const erreur = await apiTri.valider(TRN_01, TRI_DE_REFERENCE).catch((e: unknown) => e);
    expect(erreur).toBeInstanceOf(ErreurApi);
    expect(erreur).toMatchObject({ code: 'ACCES_REFUSE', status: 403 });
  });
});

describe('tri de TRN-0912-02', () => {
  it('met 15 points en attente pour BAC-022 (collecte à vérifier)', async () => {
    await connecter('+2250700000003');
    const r = await apiTri.valider(TRN_02, TRI_DE_REFERENCE);
    expect(r.points_credites).toBe(0);
    expect(r.points_en_attente).toBe(15);
    const tx = await apiTri.transactions({ tournee_id: TRN_02 });
    expect(tx.every((t) => t.bac_id === BAC_022 && t.statut === 'en_attente' && t.points === 3)).toBe(true);
  });
});

describe('énergie et alerte (Guide commun §8.4 et §8.5)', () => {
  it('reproduit les productions du seed (05 → 11/09)', async () => {
    await connecter('+2250700000004');
    for (const attendu of seed.productions.filter((p) => p.date < '2026-09-12')) {
      const [p] = await apiProductions.lister({
        site_id: attendu.site_id,
        date_debut: attendu.date,
        date_fin: attendu.date,
      });
      expect(p).toMatchObject({
        biogaz_attendu_m3: attendu.biogaz_attendu_m3,
        ecart_pct: attendu.ecart_pct,
        electricite_kwh: attendu.electricite_kwh,
        chaleur_kwh: attendu.chaleur_kwh,
        foyers_equivalents: attendu.foyers_equivalents,
      });
      expect(p.statuts_donnees.biogaz_mesure_m3).toBe('simule');
      expect(p.statuts_donnees.electricite_kwh).toBe('estime');
    }
  });

  it('DIG-02 à 0,70 : écart −30 %, alerte de production, 38,08 kWh', async () => {
    await connecter('+2250700000003');
    await apiTri.valider(TRN_02, TRI_DE_REFERENCE);
    await attendre(5); // mesure nominale envoyée par le simulateur après le tri

    await connecter('+2250700000001');
    await apiSimulation.forcerFacteur(DIG_02, 0.7);
    const globale = await apiProductions.globale('2026-09-12');
    const dig02 = globale.par_site.find((p) => p.site_id === DIG_02);
    expect(dig02).toMatchObject({
      poids_organique_recu_kg: 320,
      biogaz_attendu_m3: 32,
      biogaz_mesure_m3: 22.4,
      ecart_pct: -30,
      electricite_kwh: 38.08,
      chaleur_kwh: 76.16,
      digestat_kg: 160,
      foyers_equivalents: 7.8,
    });
    const [alerte] = await apiAlertes.lister({ statut: 'ouverte' });
    expect(alerte).toMatchObject({ code_site: 'DIG-02', type: 'production', ecart_pct: -30, valeur_mesuree: 22.4 });
    expect((await apiSites.detail(DIG_02)).statut).toBe('alerte');

    // Résolution par le responsable : le site revient à nominal.
    await connecter('+2250700000004');
    await expect(apiAlertes.resoudre(alerte.id, '')).rejects.toMatchObject({ code: 'VALIDATION' });
    await apiAlertes.resoudre(alerte.id, 'Agitateur relancé, température rétablie à 37 °C');
    expect((await apiSites.detail(DIG_02)).statut).toBe('nominal');
  });

  it('vue globale après les deux tris et la baisse : 960 kg, 85,4 m³, 145,18 kWh, 29,7 foyers', async () => {
    await connecter('+2250700000003');
    await apiTri.valider(TRN_01, TRI_DE_REFERENCE);
    await apiTri.valider(TRN_02, TRI_DE_REFERENCE);
    await attendre(5);
    await connecter('+2250700000001');
    await apiSimulation.forcerFacteur(DIG_02, 0.7);
    const g = await apiProductions.globale('2026-09-12');
    expect(g).toMatchObject({
      poids_organique_recu_kg: 960,
      biogaz_attendu_m3: 96,
      biogaz_mesure_m3: 85.4,
      electricite_kwh: 145.18,
      chaleur_kwh: 290.36,
      foyers_equivalents: 29.7,
      alertes_ouvertes: 1,
    });
    expect(g.par_site.find((p) => p.code_site === 'DIG-01')).toMatchObject({ ecart_pct: -3.1, electricite_kwh: 52.7 });
  });
});

describe('connexion par e-mail (contrat 1.2.0)', () => {
  it('connecte le même compte par e-mail, sans tenir compte des majuscules', async () => {
    const parTelephone = await apiAuth.connexion({ telephone: '+2250700000003' }, 'greengas2026');
    const parEmail = await apiAuth.connexion({ email: 'Aya.Operatrice@GreenGas.ci' }, 'greengas2026');
    expect(parEmail.utilisateur.id).toBe(parTelephone.utilisateur.id);
    expect(parEmail.utilisateur.email).toBe('aya.operatrice@greengas.ci');
  });

  it('connecte l’administrateur principal (admin@admin.com / admin1234)', async () => {
    const r = await apiAuth.connexion({ email: 'admin@admin.com' }, 'admin1234');
    expect(r.utilisateur).toMatchObject({ nom: 'Administrateur principal', role: 'administrateur', actif: true });
  });

  it('refuse un e-mail inconnu ou un mauvais mot de passe, et exige un seul identifiant', async () => {
    await expect(apiAuth.connexion({ email: 'inconnu@greengas.ci' }, 'greengas2026')).rejects.toMatchObject({
      code: 'NON_AUTHENTIFIE',
      message: 'E-mail ou mot de passe incorrect',
    });
    await expect(apiAuth.connexion({ email: 'aya.operatrice@greengas.ci' }, 'faux')).rejects.toMatchObject({
      code: 'NON_AUTHENTIFIE',
    });
    const deuxIdentifiants = { telephone: '+2250700000003', email: 'aya.operatrice@greengas.ci' };
    await expect(apiAuth.connexion(deuxIdentifiants, 'greengas2026')).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});

describe('inscription du personnel (contrats 1.2.0, 1.3.0 et 1.5.0)', () => {
  const corps = {
    nom: 'Mamadou Bamba',
    telephone: '+2250711223344',
    email: 'mamadou.bamba@greengas.ci',
    mot_de_passe: 'motdepasse1',
    role: 'operateur_tri' as const,
  };

  it('validation désactivée (seed) : compte valide aussitôt, sans jetons, connexion directe', async () => {
    const u = await apiAuth.inscrirePersonnel(corps);
    expect(u).toMatchObject({ nom: 'Mamadou Bamba', statut_validation: 'valide' });
    expect(u).not.toHaveProperty('access');
    const r = await apiAuth.connexion({ email: 'mamadou.bamba@greengas.ci' }, 'motdepasse1');
    expect(r.utilisateur).toMatchObject({ id: u.id, role: 'operateur_tri' });
  });

  it('validation activée : demande en attente, sans jetons ; la connexion est refusée jusqu’à la validation', async () => {
    await activerValidation();
    const u = await apiAuth.inscrirePersonnel(corps);
    expect(u).toMatchObject({
      nom: 'Mamadou Bamba',
      role: 'operateur_tri',
      actif: true,
      statut_validation: 'en_attente',
      profil_citoyen: null,
    });
    expect(u).not.toHaveProperty('access');
    for (const identifiant of [{ telephone: '+2250711223344' }, { email: 'mamadou.bamba@greengas.ci' }]) {
      await expect(apiAuth.connexion(identifiant, 'motdepasse1')).rejects.toMatchObject({
        status: 403,
        code: 'COMPTE_NON_VALIDE',
        message: "Votre compte attend la validation d'un administrateur.",
        details: { statut_validation: 'en_attente' },
      });
    }
    // Mauvais mot de passe : le mot de passe est vérifié avant l'état du compte.
    await expect(apiAuth.connexion({ telephone: '+2250711223344' }, 'faux-mot')).rejects.toMatchObject({ status: 401 });

    await connecter('+2250700000001');
    await apiUtilisateurs.decider(u.id, 'valider', 'Recruté pour le centre de tri');
    const apres = await apiAuth.connexion({ email: 'mamadou.bamba@greengas.ci' }, 'motdepasse1');
    expect(apres.utilisateur).toMatchObject({ id: u.id, statut_validation: 'valide' });
  });

  it('exige un e-mail valide et unique', async () => {
    await expect(apiAuth.inscrirePersonnel({ ...corps, email: '' })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(apiAuth.inscrirePersonnel({ ...corps, email: 'pas-un-email' })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
    await expect(apiAuth.inscrirePersonnel({ ...corps, email: 'AYA.operatrice@greengas.ci' })).rejects.toMatchObject({
      code: 'EMAIL_DEJA_UTILISE',
      status: 409,
    });
  });

  it('refuse les rôles préenregistrés, un mot de passe trop court et un numéro existant', async () => {
    const roleInterdit = { ...corps, role: 'administrateur' } as unknown as typeof corps;
    await expect(apiAuth.inscrirePersonnel(roleInterdit)).rejects.toMatchObject({ code: 'VALIDATION', status: 400 });
    await expect(apiAuth.inscrirePersonnel({ ...corps, mot_de_passe: 'court' })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
    await expect(apiAuth.inscrirePersonnel({ ...corps, telephone: '+2250700000003' })).rejects.toMatchObject({
      code: 'TELEPHONE_DEJA_UTILISE',
      status: 409,
    });
  });
});

describe('supervision', () => {
  it('liste les cas suspects du seed', async () => {
    await connecter('+2250700000001');
    const libelles = (await apiVerifications.lister()).map((v) => `${v.type} | ${v.libelle}`);
    expect(libelles).toEqual(
      expect.arrayContaining([
        'collecte_a_verifier | BAC-022 : 2 kg pour 40 scans (0,05 kg/scan)',
        'compte_en_attente | Ibrahim Koné, Opérateur de tri',
        'bac_surinscrit | BAC-022 : 5 comptes pour 4 foyers déclarés',
        expect.stringMatching(/^scan_hors_zone \| Koffi Yao, à 3,\d km du bac BAC-014$/),
      ]),
    );
  });

  it('le référent voit les signaux de sa résidence, jamais les comptes en attente', async () => {
    await connecter('+2250700000005');
    const elements = await apiVerifications.lister();
    expect(elements.map((e) => e.type)).toEqual(['scan_hors_zone']);
    expect(elements[0].libelle).toMatch(/^Koffi Yao, à 3,\d km du bac BAC-014$/);
  });
});

describe('validation du personnel (contrats 1.3.0 et 1.5.0)', () => {
  const IBRAHIM = 'a0000000-0000-4000-8000-000000000008';

  it('validation désactivée (seed) : Ibrahim Koné, en attente, se connecte ; réactivée, il est refusé', async () => {
    const r = await apiAuth.connexion({ telephone: '+2250700000008' }, 'greengas2026');
    expect(r.utilisateur).toMatchObject({ nom: 'Ibrahim Koné', statut_validation: 'en_attente' });
    await jetons.definir(r);
    await activerValidation();
    await expect(apiAuth.connexion({ telephone: '+2250700000008' }, 'greengas2026')).rejects.toMatchObject({
      status: 403,
      code: 'COMPTE_NON_VALIDE',
    });
  });

  it('le réglage n’accepte que 0 ou 1, et seulement de l’administrateur', async () => {
    await connecter('+2250700000004');
    await expect(apiParametres.modifier('validation_comptes_personnel', 1)).rejects.toMatchObject({ status: 403 });
    await connecter('+2250700000001');
    await expect(apiParametres.modifier('validation_comptes_personnel', 0.5)).rejects.toMatchObject({
      status: 422,
      code: 'PARAMETRE_INVALIDE',
    });
    const p = await apiParametres.modifier('validation_comptes_personnel', 1);
    expect(p.valeur).toBe(1);
    const journal = await apiJournal.lister({});
    expect(journal.some((e) => e.action === 'parametre.modifier' && e.objet_id === 'validation_comptes_personnel')).toBe(true);
  });

  it('Ibrahim Koné est refusé tant que l’administrateur ne l’a pas validé, puis se connecte', async () => {
    await activerValidation();
    await expect(apiAuth.connexion({ telephone: '+2250700000008' }, 'greengas2026')).rejects.toMatchObject({
      status: 403,
      code: 'COMPTE_NON_VALIDE',
    });
    await connecter('+2250700000001');
    const [attente] = await apiVerifications.lister({ type: 'compte_en_attente' });
    expect(attente).toMatchObject({
      objet_id: IBRAHIM,
      details: { nom: 'Ibrahim Koné', role: 'operateur_tri', telephone: '+2250700000008', email: 'ibrahim.kone@greengas.ci' },
    });
    const valide = await apiUtilisateurs.decider(IBRAHIM, 'valider', 'Poste confirmé');
    expect(valide.statut_validation).toBe('valide');
    expect(await apiVerifications.lister({ type: 'compte_en_attente' })).toEqual([]);
    const journal = await apiJournal.lister({});
    expect(journal.some((e) => e.action === 'utilisateur.valider' && e.objet_id === IBRAHIM)).toBe(true);
    const r = await apiAuth.connexion({ telephone: '+2250700000008' }, 'greengas2026');
    expect(r.utilisateur.nom).toBe('Ibrahim Koné');
  });

  it('un compte refusé ou désactivé ne se connecte pas', async () => {
    await connecter('+2250700000001');
    await apiUtilisateurs.decider(IBRAHIM, 'refuser', 'Inconnu du service');
    await expect(apiAuth.connexion({ telephone: '+2250700000008' }, 'greengas2026')).rejects.toMatchObject({
      status: 403,
      code: 'COMPTE_NON_VALIDE',
      message: "Votre demande d'accès a été refusée.",
      details: { statut_validation: 'refuse' },
    });
    const aya = (await apiUtilisateurs.lister()).find((u) => u.nom === 'Aya Opératrice');
    await apiUtilisateurs.modifier(aya!.id, { actif: false });
    await expect(apiAuth.connexion({ telephone: '+2250700000003' }, 'greengas2026')).rejects.toMatchObject({
      status: 403,
      code: 'COMPTE_NON_VALIDE',
      details: { actif: false },
    });
  });

  it('seul l’administrateur valide, et seulement le personnel en attente', async () => {
    await connecter('+2250700000005');
    await expect(apiUtilisateurs.decider(IBRAHIM, 'valider', 'ok')).rejects.toMatchObject({ status: 403 });
    await connecter('+2250700000001');
    const awa = (await apiUtilisateurs.lister()).find((u) => u.nom === 'Awa Koné');
    await expect(apiUtilisateurs.decider(awa!.id, 'valider', 'ok')).rejects.toMatchObject({ status: 409, code: 'CONFLIT' });
  });

  it('crée un collecteur et refuse un téléphone déjà utilisé', async () => {
    await connecter('+2250700000001');
    const u = await apiUtilisateurs.creer({
      nom: 'Moussa Traoré',
      telephone: '+2250700000099',
      mot_de_passe: 'greengas2026',
      role: 'collecteur',
    });
    expect(u).toMatchObject({ role: 'collecteur', actif: true, profil_citoyen: null });
    await expect(
      apiUtilisateurs.creer({
        nom: 'Doublon',
        telephone: '+2250700000099',
        mot_de_passe: 'greengas2026',
        role: 'collecteur',
      }),
    ).rejects.toMatchObject({ code: 'TELEPHONE_DEJA_UTILISE' });
  });

  it('refuse un paramètre impossible avec PARAMETRE_INVALIDE', async () => {
    await connecter('+2250700000001');
    await expect(apiParametres.modifier('tolerance_tri_pct', 150)).rejects.toMatchObject({
      code: 'PARAMETRE_INVALIDE',
    });
    const p = await apiParametres.modifier('coefficient_biogaz_m3_par_kg', 0.12);
    expect(p.valeur).toBe(0.12);
  });
});
