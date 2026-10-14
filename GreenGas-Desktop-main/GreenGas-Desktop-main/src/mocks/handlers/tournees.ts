import type { TourneeCreation, TriRequete } from '@/api/types';
import { differer } from '../base';
import { journaliser, mesureSimulee, validerTri } from '../calculs';
import { introuvable, validation } from '../erreurs';
import { nouvelUuid, type TourneeDB } from '../etat';
import { filtre, paginer, PERSONNEL, reponse, route } from '../http';
import { collecteApi, resultatTriApi, tourneeApi, tourneeDetailApi, transactionApi } from '../serialiseurs';
import { marquerLuesPourObjet, notifier } from '../notifications';

/** Délai entre le tri et la mesure du compteur de gaz envoyée par le simulateur IoT. */
const DELAI_MESURE_MS = import.meta.env.MODE === 'test' ? 0 : 2500;

const parDatePuisCode = (a: TourneeDB, b: TourneeDB) => b.date.localeCompare(a.date) || a.code.localeCompare(b.code);

export const handlersTournees = [
  route('get', '/tournees/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const tournees = ctx.etat.tournees
      .filter(filtre(ctx, 'date', (t) => t.date))
      .filter(filtre(ctx, 'statut', (t) => t.statut))
      .filter(filtre(ctx, 'secteur_id', (t) => t.secteur_id))
      .filter(filtre(ctx, 'collecteur_id', (t) => t.collecteur_id))
      .sort(parDatePuisCode)
      .map((t) => tourneeApi(ctx.etat, t));
    return paginer(ctx, tournees);
  }),

  route('get', '/tournees/:id/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const t = ctx.etat.tournees.find((x) => x.id === ctx.params.id);
    if (!t) throw introuvable('Tournée');
    return tourneeDetailApi(ctx.etat, t);
  }),

  route('post', '/tournees/', async (ctx) => {
    const auteur = ctx.exiger('administrateur');
    const corps = await ctx.corps<TourneeCreation>();
    if (!corps.date || !/^\d{4}-\d{2}-\d{2}$/.test(corps.date)) throw validation('date', 'Date obligatoire.');
    const secteur = ctx.etat.secteurs.find((s) => s.id === corps.secteur_id);
    if (!secteur) throw validation('secteur_id', 'Choisissez un secteur.');
    const collecteur = ctx.etat.utilisateurs.find(
      (u) => u.id === corps.collecteur_id && u.role === 'collecteur' && u.actif,
    );
    if (!collecteur) throw validation('collecteur_id', 'Choisissez un collecteur actif.');
    const bacIds = corps.bac_ids ?? [];
    if (bacIds.length === 0) throw validation('bac_ids', 'Sélectionnez au moins un bac.');
    for (const id of bacIds) {
      const bac = ctx.etat.bacs.find((b) => b.id === id);
      if (!bac || bac.statut !== 'actif') throw validation('bac_ids', 'Un des bacs est inconnu ou inactif.');
    }
    // Site fixé par le serveur : celui du secteur, ou le site de repli s'il est en maintenance.
    const siteNormal = ctx.etat.sites.find((s) => s.id === secteur.site_id);
    const repli = siteNormal?.statut === 'maintenance';
    const numero = ctx.etat.tournees.filter((t) => t.date === corps.date).length + 1;
    const tournee: TourneeDB = {
      id: nouvelUuid(ctx.etat, '70e00000', 900),
      code: `TRN-${corps.date.slice(5, 7)}${corps.date.slice(8, 10)}-${String(numero).padStart(2, '0')}`,
      date: corps.date,
      secteur_id: secteur.id,
      site_id: repli ? secteur.site_repli_id : secteur.site_id,
      motif_affectation: repli ? 'repli' : 'secteur',
      collecteur_id: collecteur.id,
      statut: 'planifiee',
      niveau_contamination: null,
      bac_ids: bacIds,
    };
    ctx.etat.tournees.push(tournee);
    journaliser(ctx.etat, auteur.id, 'tournee.planifier', 'tournee', tournee.id, null, tournee.code);
    notifier(
      ctx.etat,
      [collecteur],
      {
        type: 'tournee_planifiee',
        niveau: 'info',
        titre: 'Tournée planifiée',
        message: `Nouvelle tournée ${tournee.code} le ${corps.date.slice(8, 10)}/${corps.date.slice(5, 7)} (${secteur.code}, ${bacIds.length} bacs).`,
        objet_type: 'tournee',
        objet_id: tournee.id,
      },
      { auteurId: auteur.id },
    );
    return reponse(tourneeDetailApi(ctx.etat, tournee), 201);
  }),

  /* ---------- Collectes ---------- */
  route('get', '/collectes/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const collectes = ctx.etat.collectes
      .filter(filtre(ctx, 'tournee_id', (c) => c.tournee_id))
      .filter(filtre(ctx, 'bac_id', (c) => c.bac_id))
      .filter(filtre(ctx, 'statut', (c) => c.statut))
      .filter(filtre(ctx, 'statut_controle', (c) => c.statut_controle))
      .sort((a, b) => b.date_ouverture.localeCompare(a.date_ouverture))
      .map((c) => collecteApi(ctx.etat, c));
    return paginer(ctx, collectes);
  }),

  route('get', '/collectes/:id/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const c = ctx.etat.collectes.find((x) => x.id === ctx.params.id);
    if (!c) throw introuvable('Collecte');
    return collecteApi(ctx.etat, c);
  }),

  /* ---------- Tri ---------- */
  route('get', '/tournees/:id/tri/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const tri = ctx.etat.tris.get(ctx.params.id);
    if (!tri) throw introuvable('Résultat de tri');
    return resultatTriApi(ctx.etat, tri);
  }),

  route('post', '/tournees/:id/tri/', async (ctx) => {
    const auteur = ctx.exiger('operateur_tri');
    const tournee = ctx.etat.tournees.find((t) => t.id === ctx.params.id);
    if (!tournee) throw introuvable('Tournée');
    const tri = validerTri(ctx.etat, tournee, await ctx.corps<TriRequete>(), auteur.id);
    // La tournée n'est plus à trier ; chaque citoyen est informé de ses points.
    marquerLuesPourObjet(ctx.etat, 'tournee_a_trier', tournee.id);
    const jour = `${tournee.date.slice(8, 10)}/${tournee.date.slice(5, 7)}`;
    for (const tx of ctx.etat.transactions.filter((x) => x.tournee_id === tournee.id)) {
      const citoyen = ctx.etat.utilisateurs.filter((u) => u.id === tx.citoyen_id);
      const bac = ctx.etat.bacs.find((b) => b.id === tx.bac_id)?.code ?? '';
      notifier(
        ctx.etat,
        citoyen,
        tx.statut === 'en_attente'
          ? {
              type: 'points_en_attente',
              niveau: 'info',
              titre: 'Points en attente',
              message: `${tx.points} points en attente de vérification (${bac}).`,
              objet_type: 'transaction',
              objet_id: tx.id,
            }
          : {
              type: 'points_credites',
              niveau: 'info',
              titre: 'Points crédités',
              message: `+${tx.points} points pour la collecte du ${jour} (${bac}).`,
              objet_type: 'transaction',
              objet_id: tx.id,
            },
      );
    }
    // Le compteur de gaz du site envoie sa mesure peu après l'arrivée de l'organique.
    const { site_id: siteId, date } = tournee;
    differer((etat) => mesureSimulee(etat, siteId, date), DELAI_MESURE_MS);
    return reponse(resultatTriApi(ctx.etat, tri), 201);
  }),

  route('get', '/lots/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const debut = ctx.query.get('date_debut');
    const fin = ctx.query.get('date_fin');
    const dateTournee = (id: string) => ctx.etat.tournees.find((t) => t.id === id)?.date ?? '';
    const lots = ctx.etat.lots
      .filter(filtre(ctx, 'tournee_id', (l) => l.tournee_id))
      .filter(filtre(ctx, 'categorie', (l) => l.categorie))
      .filter((l) => (!debut || dateTournee(l.tournee_id) >= debut) && (!fin || dateTournee(l.tournee_id) <= fin))
      .slice()
      .reverse();
    return paginer(ctx, lots);
  }),

  route('get', '/greenpoints/transactions/', (ctx) => {
    ctx.exiger(...PERSONNEL);
    const transactions = ctx.etat.transactions
      .filter(filtre(ctx, 'citoyen_id', (t) => t.citoyen_id))
      .filter(filtre(ctx, 'tournee_id', (t) => t.tournee_id))
      .filter(filtre(ctx, 'statut', (t) => t.statut))
      .slice()
      .reverse()
      .map((t) => transactionApi(ctx.etat, t));
    return paginer(ctx, transactions);
  }),
];
