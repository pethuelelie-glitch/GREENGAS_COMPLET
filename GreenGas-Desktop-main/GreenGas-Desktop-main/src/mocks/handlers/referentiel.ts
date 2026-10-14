import type { BacEcriture, StatutSite } from '@/api/types';
import { arrondi, journaliser, majStatutSite, recevoirMesure } from '../calculs';
import { introuvable, validation } from '../erreurs';
import { nouvelUuid } from '../etat';
import { aujourdhui, maintenant } from '../horloge';
import { filtre, paginer, PERSONNEL, reponse, route } from '../http';
import { tracabilite } from '../lectures';
import { bacApi, productionApi, scanApi, siteApi } from '../serialiseurs';
import { destinatairesRoles, notifier } from '../notifications';

const STATUTS_SITE: StatutSite[] = ['nominal', 'alerte', 'maintenance'];

export const handlersReferentiel = [
  /* ---------- Secteurs ---------- */
  route('get', '/secteurs/', (ctx) => {
    ctx.moi();
    return ctx.etat.secteurs;
  }),

  route('patch', '/secteurs/:id/', async (ctx) => {
    const auteur = ctx.exiger('administrateur');
    const secteur = ctx.etat.secteurs.find((s) => s.id === ctx.params.id);
    if (!secteur) throw introuvable('Secteur');
    const corps = await ctx.corps<{ nom: string; site_id: string; site_repli_id: string }>();
    for (const champ of ['site_id', 'site_repli_id'] as const) {
      if (corps[champ] !== undefined && !ctx.etat.sites.some((s) => s.id === corps[champ])) {
        throw validation(champ, 'Site inconnu');
      }
    }
    const avant = { site_id: secteur.site_id, site_repli_id: secteur.site_repli_id };
    Object.assign(secteur, {
      nom: corps.nom?.trim() || secteur.nom,
      site_id: corps.site_id ?? secteur.site_id,
      site_repli_id: corps.site_repli_id ?? secteur.site_repli_id,
    });
    if (secteur.site_id === secteur.site_repli_id) {
      Object.assign(secteur, avant);
      throw validation('site_repli_id', 'Le site de repli doit être différent du site normal.');
    }
    journaliser(ctx.etat, auteur.id, 'secteur.modifier', 'secteur', secteur.id, avant, {
      site_id: secteur.site_id,
      site_repli_id: secteur.site_repli_id,
    });
    return secteur;
  }),

  /* ---------- Sites ---------- */
  route('get', '/sites/', (ctx) => {
    ctx.moi();
    return ctx.etat.sites.map((s) => siteApi(ctx.etat, s));
  }),

  route('get', '/sites/:id/', (ctx) => {
    ctx.moi();
    const site = ctx.etat.sites.find((s) => s.id === ctx.params.id);
    if (!site) throw introuvable('Site');
    return siteApi(ctx.etat, site);
  }),

  route('patch', '/sites/:id/', async (ctx) => {
    const auteur = ctx.exiger('responsable_methanisation', 'administrateur');
    const site = ctx.etat.sites.find((s) => s.id === ctx.params.id);
    if (!site) throw introuvable('Site');
    const corps = await ctx.corps<{ statut: StatutSite; nom: string }>();
    const avant = site.statut;
    if (corps.statut !== undefined) {
      if (!STATUTS_SITE.includes(corps.statut)) throw validation('statut', 'Statut inconnu');
      if (corps.statut === 'alerte') {
        throw validation('statut', 'Le statut « alerte » est posé par le serveur à partir des mesures.');
      }
      site.statut = corps.statut;
      if (corps.statut === 'nominal') majStatutSite(ctx.etat, site);
    }
    if (corps.nom?.trim()) site.nom = corps.nom.trim();
    if (avant !== site.statut) journaliser(ctx.etat, auteur.id, 'site.modifier', 'site', site.id, avant, site.statut);
    if ((avant === 'maintenance') !== (site.statut === 'maintenance')) {
      const enMaintenance = site.statut === 'maintenance';
      const repli = ctx.etat.secteurs
        .filter((s) => s.site_id === site.id)
        .map((s) => `${s.code} partent vers ${ctx.etat.sites.find((x) => x.id === s.site_repli_id)?.code ?? '—'}`)
        .join(', ');
      notifier(
        ctx.etat,
        destinatairesRoles(ctx.etat, 'responsable_methanisation', 'administrateur'),
        {
          type: 'site_maintenance',
          niveau: 'attention',
          titre: enMaintenance ? 'Site en maintenance' : 'Site remis en service',
          message: enMaintenance
            ? `${site.code} en maintenance${repli ? ` : les tournées ${repli}` : ''}.`
            : `${site.code} remis en service.`,
          objet_type: 'site',
          objet_id: site.id,
        },
        { auteurId: auteur.id },
      );
    }
    return siteApi(ctx.etat, site);
  }),

  route('post', '/sites/:id/mesures/', async (ctx) => {
    ctx.exiger('capteur', 'administrateur');
    const corps = await ctx.corps<{
      date: string;
      biogaz_mesure_m3: number;
      ch4_pct: number;
      temperature_c: number;
      ph: number;
    }>();
    if (typeof corps.biogaz_mesure_m3 !== 'number' || corps.biogaz_mesure_m3 < 0) {
      throw validation('biogaz_mesure_m3', 'Mesure de biogaz invalide');
    }
    if (typeof corps.ch4_pct !== 'number') throw validation('ch4_pct', 'Teneur en méthane obligatoire');
    const p = recevoirMesure(ctx.etat, ctx.params.id, {
      date: corps.date ?? aujourdhui(),
      biogaz_mesure_m3: corps.biogaz_mesure_m3,
      ch4_pct: corps.ch4_pct,
      temperature_c: corps.temperature_c ?? null,
      ph: corps.ph ?? null,
      source: 'capteur',
    });
    return productionApi(ctx.etat, p);
  }),

  /* ---------- Bacs ---------- */
  route('get', '/bacs/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const recherche = ctx.query.get('recherche')?.toLowerCase().trim();
    const code = ctx.query.get('code')?.toUpperCase().trim();
    const bacs = ctx.etat.bacs
      .filter((b) => !code || b.code === code)
      .filter(filtre(ctx, 'secteur_id', (b) => b.secteur_id))
      .filter(filtre(ctx, 'statut', (b) => b.statut))
      .filter((b) => !recherche || `${b.code} ${b.residence}`.toLowerCase().includes(recherche))
      .map((b) => bacApi(ctx.etat, b));
    return paginer(ctx, bacs);
  }),

  route('get', '/bacs/:id/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const bac = ctx.etat.bacs.find((b) => b.id === ctx.params.id);
    if (!bac) throw introuvable('Bac');
    return bacApi(ctx.etat, bac);
  }),

  route('post', '/bacs/', async (ctx) => {
    const auteur = ctx.exiger('administrateur');
    const corps = await ctx.corps<BacEcriture>();
    const secteur = ctx.etat.secteurs.find((s) => s.id === corps.secteur_id);
    if (!corps.residence?.trim()) throw validation('residence', 'La résidence est obligatoire.');
    if (!secteur) throw validation('secteur_id', 'Choisissez un secteur.');
    const foyers = Number(corps.nb_foyers_declares);
    if (!Number.isInteger(foyers) || foyers < 1) {
      throw validation('nb_foyers_declares', 'Au moins un foyer déclaré.');
    }
    const site = ctx.etat.sites.find((s) => s.id === secteur.site_id);
    const numero = Math.max(...ctx.etat.bacs.map((b) => Number(b.code.slice(4)))) + 1;
    const bac = {
      id: nouvelUuid(ctx.etat, 'bac00000', 900),
      code: `BAC-${String(numero).padStart(3, '0')}`,
      residence: corps.residence.trim(),
      secteur_id: secteur.id,
      nb_foyers_declares: foyers,
      latitude: corps.latitude ?? arrondi((site?.latitude ?? 5.35) + 0.002, 4),
      longitude: corps.longitude ?? arrondi((site?.longitude ?? -4) - 0.002, 4),
      tare_kg: corps.tare_kg ?? 12.5,
      capacite_kg: corps.capacite_kg ?? 250,
      statut: 'actif' as const,
      date_creation: maintenant(),
    };
    if (bac.tare_kg <= 0 || bac.capacite_kg <= bac.tare_kg) {
      throw validation('capacite_kg', 'La capacité doit dépasser la tare du bac.');
    }
    ctx.etat.bacs.push(bac);
    journaliser(ctx.etat, auteur.id, 'bac.creer', 'bac', bac.id, null, bac.code);
    return reponse(bacApi(ctx.etat, bac), 201);
  }),

  route('patch', '/bacs/:id/', async (ctx) => {
    const auteur = ctx.exiger('administrateur');
    const bac = ctx.etat.bacs.find((b) => b.id === ctx.params.id);
    if (!bac) throw introuvable('Bac');
    const corps = await ctx.corps<BacEcriture>();
    if (corps.secteur_id !== undefined && !ctx.etat.secteurs.some((s) => s.id === corps.secteur_id)) {
      throw validation('secteur_id', 'Secteur inconnu');
    }
    if (corps.nb_foyers_declares !== undefined && corps.nb_foyers_declares < 1) {
      throw validation('nb_foyers_declares', 'Au moins un foyer déclaré.');
    }
    if (corps.statut !== undefined && !['actif', 'inactif'].includes(corps.statut)) {
      throw validation('statut', 'Statut inconnu');
    }
    const avant = { ...bac };
    for (const champ of [
      'residence',
      'secteur_id',
      'nb_foyers_declares',
      'latitude',
      'longitude',
      'tare_kg',
      'capacite_kg',
      'statut',
    ] as const) {
      if (corps[champ] !== undefined) Object.assign(bac, { [champ]: corps[champ] });
    }
    const modifies = Object.keys(corps).filter((k) => k in avant);
    journaliser(
      ctx.etat,
      auteur.id,
      'bac.modifier',
      'bac',
      bac.id,
      Object.fromEntries(modifies.map((k) => [k, avant[k as keyof typeof avant]])),
      Object.fromEntries(modifies.map((k) => [k, bac[k as keyof typeof bac]])),
    );
    return bacApi(ctx.etat, bac);
  }),

  route('get', '/bacs/:id/tracabilite/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const resultat = tracabilite(ctx.etat, ctx.params.id);
    if (!resultat) throw introuvable('Bac');
    return resultat;
  }),

  /* ---------- Scans ---------- */
  route('get', '/scans/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const debut = ctx.query.get('date_debut');
    const fin = ctx.query.get('date_fin');
    const scans = ctx.etat.scans
      .filter(filtre(ctx, 'citoyen_id', (s) => s.citoyen_id))
      .filter(filtre(ctx, 'bac_id', (s) => s.bac_id))
      .filter(filtre(ctx, 'statut', (s) => s.statut))
      .filter((s) => (!debut || s.horodatage.slice(0, 10) >= debut) && (!fin || s.horodatage.slice(0, 10) <= fin))
      .sort((a, b) => b.horodatage.localeCompare(a.horodatage))
      .map((s) => scanApi(ctx.etat, s));
    return paginer(ctx, scans);
  }),
];
