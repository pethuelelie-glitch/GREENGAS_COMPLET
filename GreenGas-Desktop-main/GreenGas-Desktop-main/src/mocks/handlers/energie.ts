import type { DestinationDigestat } from '@/api/types';
import { journaliser, majStatutSite } from '../calculs';
import { ErreurMock, introuvable, validation } from '../erreurs';
import { maintenant } from '../horloge';
import { filtre, paginer, PERSONNEL, route } from '../http';
import { productionGlobale } from '../lectures';
import { alerteApi, productionApi } from '../serialiseurs';

const DESTINATIONS: DestinationDigestat[] = ['vente_agricole', 'stockage'];

export const handlersEnergie = [
  /* ---------- Productions ---------- */
  route('get', '/productions/globale/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const date = ctx.query.get('date');
    if (!date) throw validation('date', 'La date est obligatoire.');
    return productionGlobale(ctx.etat, date);
  }),

  route('get', '/productions/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const debut = ctx.query.get('date_debut');
    const fin = ctx.query.get('date_fin');
    const productions = ctx.etat.productions
      .filter(filtre(ctx, 'site_id', (p) => p.site_id))
      .filter((p) => (!debut || p.date >= debut) && (!fin || p.date <= fin))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((p) => productionApi(ctx.etat, p));
    return paginer(ctx, productions);
  }),

  route('get', '/productions/:id/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const p = ctx.etat.productions.find((x) => x.id === ctx.params.id);
    if (!p) throw introuvable('Production');
    return productionApi(ctx.etat, p);
  }),

  route('post', '/productions/:id/cloturer/', async (ctx) => {
    const auteur = ctx.exiger('responsable_methanisation');
    const p = ctx.etat.productions.find((x) => x.id === ctx.params.id);
    if (!p) throw introuvable('Production');
    const { destination_digestat: destination } = await ctx.corps<{ destination_digestat: DestinationDigestat }>();
    if (p.statut_journee === 'cloturee') {
      throw new ErreurMock(422, 'JOURNEE_CLOTUREE', 'Cette journée est déjà clôturée.');
    }
    if (!destination || !DESTINATIONS.includes(destination)) {
      throw validation('destination_digestat', 'La destination du digestat est obligatoire.');
    }
    if (p.biogaz_mesure_m3 == null) {
      throw validation('biogaz_mesure_m3', 'Aucune mesure de gaz reçue pour cette journée : clôture impossible.');
    }
    p.statut_journee = 'cloturee';
    p.destination_digestat = destination;
    journaliser(ctx.etat, auteur.id, 'production.cloturer', 'production', p.id, 'ouverte', 'cloturee', destination);
    return productionApi(ctx.etat, p);
  }),

  /* ---------- Alertes ---------- */
  route('get', '/alertes/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const alertes = ctx.etat.alertes
      .filter(filtre(ctx, 'site_id', (a) => a.site_id))
      .filter(filtre(ctx, 'statut', (a) => a.statut))
      .filter(filtre(ctx, 'type', (a) => a.type))
      .sort((a, b) => b.date_creation.localeCompare(a.date_creation))
      .map((a) => alerteApi(ctx.etat, a));
    return paginer(ctx, alertes);
  }),

  route('get', '/alertes/:id/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const a = ctx.etat.alertes.find((x) => x.id === ctx.params.id);
    if (!a) throw introuvable('Alerte');
    return alerteApi(ctx.etat, a);
  }),

  route('post', '/alertes/:id/resoudre/', async (ctx) => {
    const auteur = ctx.exiger('responsable_methanisation');
    const a = ctx.etat.alertes.find((x) => x.id === ctx.params.id);
    if (!a) throw introuvable('Alerte');
    const { commentaire } = await ctx.corps<{ commentaire: string }>();
    if (!commentaire?.trim()) throw validation('commentaire', 'Le commentaire de résolution est obligatoire.');
    if (a.statut === 'resolue') throw new ErreurMock(409, 'CONFLIT', 'Cette alerte est déjà résolue.');
    Object.assign(a, {
      statut: 'resolue',
      commentaire_resolution: commentaire.trim(),
      date_resolution: maintenant(),
      resolue_par_id: auteur.id,
    });
    const site = ctx.etat.sites.find((s) => s.id === a.site_id);
    if (site) majStatutSite(ctx.etat, site);
    journaliser(ctx.etat, auteur.id, 'alerte.resoudre', 'alerte', a.id, 'ouverte', 'resolue', commentaire);
    return alerteApi(ctx.etat, a);
  }),
];
