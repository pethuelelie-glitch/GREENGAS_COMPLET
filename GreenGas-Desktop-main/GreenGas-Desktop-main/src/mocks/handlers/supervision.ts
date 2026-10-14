import type { CleParametre, TypeVerification } from '@/api/types';
import { differer } from '../base';
import { journaliser, mesureSimulee } from '../calculs';
import { ErreurMock, introuvable, validation } from '../erreurs';
import { aujourdhui, maintenant } from '../horloge';
import { filtre, paginer, reponse, route } from '../http';
import { verifications } from '../lectures';
import { collecteApi, journalApi } from '../serialiseurs';

/** Paramètres exprimés en pourcentage : bornés à 100. */
const POURCENTAGES = new Set<CleParametre>([
  'tolerance_tri_pct',
  'part_cuisson_pct',
  'part_perte_pct',
  'seuil_alerte_production_pct',
  'ch4_min_pct',
]);
/** Paramètres qui doivent rester strictement positifs (diviseurs, unités de mesure). */
const STRICTEMENT_POSITIFS = new Set<CleParametre>([
  'coefficient_biogaz_m3_par_kg',
  'conso_electrique_foyer_kwh_an',
  'conso_cuisson_foyer_m3_jour',
  'fenetre_lissage_jours',
  'duree_periode_collecte_jours',
  'max_scans_par_jour',
]);

/** Paramètres oui / non (contrat 1.5.0) : 0 ou 1 seulement. */
const BOOLEENS = new Set<CleParametre>(['validation_comptes_personnel']);

export const handlersSupervision = [
  route('get', '/verifications/', (ctx) => {
    const moi = ctx.exiger('administrateur', 'referent');
    return verifications(ctx.etat, moi, (ctx.query.get('type') as TypeVerification | null) ?? undefined);
  }),

  route('post', '/collectes/:id/decision/', async (ctx) => {
    const auteur = ctx.exiger('administrateur');
    const c = ctx.etat.collectes.find((x) => x.id === ctx.params.id);
    if (!c) throw introuvable('Collecte');
    const { decision, commentaire } = await ctx.corps<{ decision: string; commentaire: string }>();
    if (decision !== 'valider_points' && decision !== 'annuler_points')
      throw validation('decision', 'Décision inconnue');
    if (!commentaire?.trim()) throw validation('commentaire', 'Le commentaire est obligatoire.');
    if (c.statut_controle !== 'a_verifier') {
      throw new ErreurMock(422, 'COLLECTE_STATUT_INVALIDE', 'Cette collecte n’est pas en attente de vérification.');
    }
    const valide = decision === 'valider_points';
    c.statut_controle = valide ? 'points_valides' : 'points_annules';
    for (const t of ctx.etat.transactions.filter((x) => x.collecte_id === c.id && x.statut === 'en_attente')) {
      t.statut = valide ? 'creditee' : 'annulee';
    }
    const tri = ctx.etat.tris.get(c.tournee_id);
    if (tri) {
      const tx = ctx.etat.transactions.filter((t) => t.tournee_id === c.tournee_id);
      const somme = (s: string) => tx.filter((t) => t.statut === s).reduce((a, t) => a + t.points, 0);
      tri.points_credites = somme('creditee');
      tri.points_en_attente = somme('en_attente');
    }
    journaliser(
      ctx.etat,
      auteur.id,
      'collecte.decider',
      'collecte',
      c.id,
      'a_verifier',
      c.statut_controle,
      commentaire,
    );
    return collecteApi(ctx.etat, c);
  }),

  route('get', '/parametres/', (ctx) => {
    ctx.moi();
    return [...ctx.etat.parametres.values()];
  }),

  route('patch', '/parametres/:cle/', async (ctx) => {
    const auteur = ctx.exiger('administrateur');
    const cle = ctx.params.cle as CleParametre;
    const p = ctx.etat.parametres.get(cle);
    if (!p) throw introuvable('Paramètre');
    const { valeur } = await ctx.corps<{ valeur: number }>();
    const v = Number(valeur);
    const invalide =
      typeof valeur !== 'number' ||
      !Number.isFinite(v) ||
      v < 0 ||
      (POURCENTAGES.has(cle) && v > 100) ||
      (STRICTEMENT_POSITIFS.has(cle) && v === 0) ||
      (BOOLEENS.has(cle) && v !== 0 && v !== 1);
    if (invalide) {
      throw new ErreurMock(422, 'PARAMETRE_INVALIDE', `Valeur impossible pour « ${cle} ».`, { valeur });
    }
    const ancienne = p.valeur;
    p.valeur = v;
    p.date_modification = maintenant();
    journaliser(ctx.etat, auteur.id, 'parametre.modifier', 'parametre', cle, ancienne, v);
    return p;
  }),

  route('get', '/journal/', (ctx) => {
    ctx.exiger('administrateur');
    const entrees = ctx.etat.journal
      .filter(filtre(ctx, 'objet_type', (j) => j.objet_type))
      .filter(filtre(ctx, 'objet_id', (j) => j.objet_id))
      .filter(filtre(ctx, 'auteur_id', (j) => j.auteur_id))
      .map((j) => journalApi(ctx.etat, j));
    return paginer(ctx, entrees);
  }),

  /* ---------- Simulation (pilotée depuis l'écran Capteurs) ---------- */
  route('get', '/simulation/scenarios/', (ctx) => {
    ctx.exiger('administrateur');
    return [...ctx.etat.scenarios].map(([site_id, facteur_mesure]) => ({ site_id, facteur_mesure }));
  }),

  route('post', '/simulation/scenarios/', async (ctx) => {
    const auteur = ctx.exiger('administrateur');
    const { site_id: siteId, facteur_mesure: facteur } = await ctx.corps<{ site_id: string; facteur_mesure: number }>();
    const site = ctx.etat.sites.find((s) => s.id === siteId);
    if (!site) throw validation('site_id', 'Site inconnu');
    if (typeof facteur !== 'number' || facteur < 0 || facteur > 2) {
      throw validation('facteur_mesure', 'Le facteur doit être compris entre 0 et 2.');
    }
    const ancien = ctx.etat.scenarios.get(site.id) ?? null;
    ctx.etat.scenarios.set(site.id, facteur);
    journaliser(ctx.etat, auteur.id, 'simulation.scenario', 'site', site.id, ancien, facteur);
    // En présentation, le compteur du site renvoie aussitôt une mesure avec le nouveau facteur.
    mesureSimulee(ctx.etat, site.id, aujourdhui());
    return reponse({ site_id: site.id, facteur_mesure: facteur }, 201);
  }),

  route('delete', '/simulation/scenarios/:siteId/', (ctx) => {
    const auteur = ctx.exiger('administrateur');
    const site = ctx.etat.sites.find((s) => s.id === ctx.params.siteId);
    if (!site) throw introuvable('Site');
    const ancien = ctx.etat.scenarios.get(site.id) ?? null;
    ctx.etat.scenarios.delete(site.id);
    journaliser(ctx.etat, auteur.id, 'simulation.retour_nominal', 'site', site.id, ancien, null);
    differer((etat) => mesureSimulee(etat, site.id, aujourdhui()), 0);
    return reponse(null, 204);
  }),
];
