/**
 * T3 · Résultat du tri : la preuve visuelle de la chaîne, racontée étape par étape
 * (lots → valeur de la tournée → points → organique envoyé au digesteur).
 * Toutes les valeurs viennent du serveur (ResultatTri, tournée, traçabilité des bacs, production).
 */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Boxes, Coins, Factory, Gauge, Waypoints } from 'lucide-react';
import type { Destination, EtapeTracabilite, TracabiliteBac } from '@/api/types';
import { useUtilisateur } from '@/auth/session';
import { badge, BadgeProvenance, LegendeProvenance } from '@/components/greengas/BadgeProvenance';
import { Carte } from '@/components/greengas/Carte';
import { CodeObjet } from '@/components/greengas/CodeObjet';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { EtatChargementPage, EtatErreur } from '@/components/greengas/Etats';
import { Anneau, BarresHorizontales } from '@/components/greengas/Graphiques';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { TableauDonnees } from '@/components/greengas/TableauDonnees';
import { ValeurAnimee } from '@/components/greengas/ValeurAnimee';
import { Button } from '@/components/ui/button';
import { COULEUR_CATEGORIE, couleurSerie } from '@/lib/couleurs';
import { kg, m3, nombre, pourcentage } from '@/lib/format';
import { LIBELLE_CATEGORIE, LIBELLE_CONTAMINATION, LIBELLE_DESTINATION } from '@/lib/libelles';
import { STATUT_CONTROLE } from '@/lib/statuts';
import { cn } from '@/lib/utils';
import { useProduction, useResultatTri, useTournee, useTracabilitesBacs } from '../hooks/requetes';

const PAS = 0.38; // secondes entre deux étapes de la chaîne

function Etape({ rang, titre, icone, children, pied }: { rang: number; titre: string; icone: ReactNode; children: ReactNode; pied?: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: rang * PAS, type: 'spring', stiffness: 220, damping: 22 }}
      className="relative flex flex-col gap-2 rounded-carte bg-surface px-5 py-[18px] shadow-carte"
    >
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <span className="grid size-7 place-items-center rounded-lg bg-vert-pale text-vert">{icone}</span>
        {titre}
      </h3>
      <div className="flex-1">{children}</div>
      {pied}
    </motion.section>
  );
}

/** Liaison animée entre deux étapes : une flèche qui se dessine, puis un flux qui la parcourt. */
function Liaison({ rang }: { rang: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute top-[52px] z-10 -translate-x-1/2" style={{ left: `${rang * 25}%` }}>
      <motion.svg
        width="34"
        height="20"
        viewBox="0 0 34 20"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: rang * PAS - 0.12, type: 'spring', stiffness: 400, damping: 18 }}
      >
        <circle cx="17" cy="10" r="10" fill="var(--vert-foret)" />
        <path d="M12 10h10M18 6l4 4-4 4" stroke="var(--surface)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    </div>
  );
}

export function PageResultatTri() {
  const { tourneeId } = useParams();
  const u = useUtilisateur();
  const resultat = useResultatTri(tourneeId);
  const tournee = useTournee(tourneeId);
  const production = useProduction(resultat.data?.production_id);
  const bacIds = tournee.data?.collectes.map((c) => c.bac_id) ?? [];
  const traces = useTracabilitesBacs(bacIds);

  if (resultat.error) return <EtatErreur erreur={resultat.error} reessayer={() => void resultat.refetch()} />;
  if (!resultat.data || !tournee.data) return <EtatChargementPage />;

  const r = resultat.data;
  const t = tournee.data;
  const p = production.data;
  const organique = r.lots.find((l) => l.categorie === 'organique');
  const parBac = new Map<string, { trace: TracabiliteBac; etape: EtapeTracabilite | undefined }>();
  traces.forEach((q, i) => {
    if (q.data) parBac.set(bacIds[i], { trace: q.data, etape: q.data.historique.find((h) => h.tournee.id === t.id) });
  });
  const premierBacAvecPoints = t.collectes.find((c) => (c.scans_valides ?? 0) > 0) ?? t.collectes[0];

  // Regroupement des lots par destination renvoyée par le serveur (affichage seulement).
  const parDestination = r.lots.reduce<Partial<Record<Destination, number>>>((acc, l) => {
    acc[l.destination] = (acc[l.destination] ?? 0) + l.poids_kg;
    return acc;
  }, {});

  return (
    <>
      <EnTetePage
        titre={
          <>
            Résultat du tri · <span className="font-mono">{r.code_tournee}</span>
          </>
        }
        sousTitre={`Ce que la saisie a déclenché, calculé par le serveur · ${kg(r.poids_trie_kg)} triés pour ${kg(r.poids_collecte_kg)} collectés (écart ${pourcentage(r.ecart_pct)})`}
      />

      <div className="relative mb-4 grid grid-cols-4 gap-4">
        {[1, 2, 3].map((rang) => (
          <Liaison key={rang} rang={rang} />
        ))}
        <Etape rang={0} titre="Lots créés" icone={<Boxes className="size-4" />} pied={<BadgeProvenance statut={badge(p?.statuts_donnees, 'poids_organique_recu_kg')} />}>
          <ul className="flex flex-col gap-1.5">
            {r.lots.map((l, i) => (
              <motion.li
                key={l.id}
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
              >
                <span className="flex items-center gap-2">
                  <i className="size-2.5 rounded-full" style={{ background: COULEUR_CATEGORIE[l.categorie] }} />
                  <CodeObjet code={l.code_lot} />
                </span>
                <b>{kg(l.poids_kg)}</b>
              </motion.li>
            ))}
          </ul>
        </Etape>
        <Etape rang={1} titre="Valeur de la tournée" icone={<Gauge className="size-4" />}>
          <div className="flex items-baseline gap-1.5">
            <ValeurAnimee valeur={r.valeur_kg} decimales={2} className="text-[34px] font-bold" />
            <small className="text-[13px] text-texte-doux">pts/kg</small>
          </div>
          <p className="mt-2 text-[13px] text-texte-doux">
            Coefficient de qualité {nombre(r.coef_qualite, 1)} · contamination {LIBELLE_CONTAMINATION[r.niveau_contamination].toLowerCase()}
          </p>
          {r.motif_ecart && <p className="mt-1 text-[13px] text-texte-doux">Motif de l'écart : {r.motif_ecart}</p>}
        </Etape>
        <Etape rang={2} titre="Points distribués" icone={<Coins className="size-4" />}>
          <div className="flex items-baseline gap-1.5">
            <ValeurAnimee valeur={r.points_credites} className="text-[34px] font-bold" />
            <small className="text-[13px] text-texte-doux">crédités</small>
          </div>
          <p className={cn('mt-2 text-[13px]', r.points_en_attente > 0 ? 'font-semibold text-statut-attention-texte' : 'text-texte-doux')}>
            {nombre(r.points_en_attente)} en attente de vérification
          </p>
          <p className="text-[13px] text-texte-doux">{nombre(r.nb_transactions)} transactions citoyennes</p>
        </Etape>
        <Etape
          rang={3}
          titre="Organique envoyé"
          icone={<Factory className="size-4" />}
          pied={<BadgeProvenance statut={badge(p?.statuts_donnees, 'biogaz_attendu_m3')} />}
        >
          <div className="flex items-baseline gap-1.5">
            <ValeurAnimee valeur={organique?.poids_kg ?? 0} className="text-[34px] font-bold" />
            <small className="text-[13px] text-texte-doux">kg → {t.code_site}</small>
          </div>
          <p className="mt-2 text-[13px] text-texte-doux">
            Biogaz attendu sur {t.code_site} : <b className="text-texte">{m3(p?.biogaz_attendu_m3)}</b>
          </p>
        </Etape>
      </div>

      <Carte titre="Composition triée et destinations" className="mb-4" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4 * PAS }}>
        <div className="grid grid-cols-2 items-center gap-12">
          <Anneau
            centre={r.poids_trie_kg}
            sousTitre="kg triés"
            segments={r.lots.map((l) => ({
              libelle: LIBELLE_CATEGORIE[l.categorie],
              valeur: l.poids_kg,
              partPct: l.part_pct,
              couleur: COULEUR_CATEGORIE[l.categorie],
            }))}
          />
          <BarresHorizontales
            largeurLibelle={110}
            barres={(Object.entries(parDestination) as [Destination, number][]).map(([d, v], i) => ({
              libelle: LIBELLE_DESTINATION[d],
              valeur: v,
              couleur: couleurSerie(i),
              texte: kg(v),
            }))}
          />
        </div>
      </Carte>

      <Carte compacte initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4.4 * PAS }}>
        <TableauDonnees
          etiquette="Points par bac"
          lignes={t.collectes}
          cleLigne={(c) => c.id}
          colonnes={[
            {
              cle: 'bac',
              entete: 'Bac',
              rendu: (c) => <CodeObjet code={c.code_bac} vers={u.role === 'administrateur' ? `/admin/tracabilite?bac=${c.code_bac}` : undefined} />,
            },
            { cle: 'poids', entete: 'Poids net', rendu: (c) => kg(c.poids_net_kg, 1), tri: (c) => c.poids_net_kg },
            { cle: 'scans', entete: 'Scans', rendu: (c) => nombre(c.scans_valides), tri: (c) => c.scans_valides },
            {
              cle: 'points',
              entete: 'Points du bac',
              rendu: (c) => {
                const e = parBac.get(c.bac_id)?.etape;
                return e ? <b>{nombre(e.points_bac, 0)}</b> : '…';
              },
            },
            {
              cle: 'repartition',
              entete: 'Répartition',
              rendu: (c) => {
                const info = parBac.get(c.bac_id);
                if (!info?.etape) return '…';
                if (info.etape.transactions.length === 0) return <span className="text-texte-doux">Aucun scan : 0 point</span>;
                return (
                  <span className="flex flex-wrap gap-x-2 gap-y-1">
                    {info.etape.transactions.map((tx) => (
                      <span key={tx.id}>
                        {info.trace.citoyens.find((ci) => ci.id === tx.citoyen_id)?.nom ?? 'Citoyen'} <b>{nombre(tx.points)}</b>
                        {tx.statut === 'en_attente' && <span className="text-statut-attention-texte"> (en attente)</span>}
                        {tx.statut === 'annulee' && <span className="text-texte-doux"> (annulés)</span>}
                      </span>
                    ))}
                  </span>
                );
              },
            },
            { cle: 'controle', entete: 'Contrôle', rendu: (c) => (c.statut_controle ? <PastilleStatut statut={STATUT_CONTROLE[c.statut_controle]} /> : '—') },
          ]}
        />
      </Carte>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Button variante="contour" asChild>
          <Link to="/tri">
            <ArrowLeft /> Retour aux tournées
          </Link>
        </Button>
        {u.role === 'administrateur' && premierBacAvecPoints && (
          <Button asChild>
            <Link to={`/admin/tracabilite?bac=${premierBacAvecPoints.code_bac}`}>
              <Waypoints /> Voir la traçabilité de {premierBacAvecPoints.code_bac}
            </Link>
          </Button>
        )}
      </div>
      <LegendeProvenance className="mt-[18px]" />
    </>
  );
}
