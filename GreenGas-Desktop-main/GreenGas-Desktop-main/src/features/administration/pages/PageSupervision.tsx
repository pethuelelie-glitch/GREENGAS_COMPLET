/**
 * A1 · Supervision : la chaîne du jour en un écran (scans → collectes → tri → points → énergie),
 * les alertes et les cas à vérifier, avec des raccourcis vers les écrans d'action.
 */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronRight, ClipboardCheck, Coins, Radio, ScanLine, Truck, Boxes, TriangleAlert, Waypoints, Zap } from 'lucide-react';
import { apiScans } from '@/api/administration';
import { apiTri } from '@/api/tri';
import { badge, BadgeProvenance, LegendeProvenance } from '@/components/greengas/BadgeProvenance';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { ValeurAnimee } from '@/components/greengas/ValeurAnimee';
import { useAlertesOuvertes, useVerifications } from '@/hooks/referentiel';
import { config } from '@/lib/config';
import { jourLong, nombre } from '@/lib/format';
import { apparence } from '@/lib/statuts';
import { cn } from '@/lib/utils';
import { useProductionsDuJour, useToutesTournees } from '../hooks/requetes';

const veille = (jour: string) => new Date(Date.parse(`${jour}T12:00:00Z`) - 4 * 86400000).toISOString().slice(0, 10);

function Maillon({ rang, icone, titre, valeur, unite, pied, alerte }: { rang: number; icone: ReactNode; titre: string; valeur: number | null | undefined; unite: string; pied?: ReactNode; alerte?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rang * 0.12, type: 'spring', stiffness: 220, damping: 22 }}
      className={cn('flex min-w-0 flex-1 flex-col gap-2 rounded-carte bg-surface p-4 shadow-carte', alerte && 'shadow-[0_0_0_2px_var(--statut-alerte)]')}
    >
      <span className="flex items-center gap-2 text-[13px] font-semibold text-texte-doux">
        <span className="grid size-7 place-items-center rounded-lg bg-vert-pale text-vert">{icone}</span>
        {titre}
      </span>
      <span className="flex items-baseline gap-1.5">
        <ValeurAnimee valeur={valeur} className="text-[32px] font-bold" />
        <small className="text-xs text-texte-doux">{unite}</small>
      </span>
      <span className="min-h-[22px]">{pied}</span>
    </motion.div>
  );
}

const Fleche = ({ rang }: { rang: number }) => (
  <motion.span aria-hidden initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: rang * 0.12 + 0.1 }} className="flex items-center text-statut-neutre">
    <ChevronRight className="size-5" />
  </motion.span>
);

export function PageSupervision() {
  const jour = config.dateTravail;
  const tournees = useToutesTournees();
  const globale = useProductionsDuJour(jour);
  const alertes = useAlertesOuvertes();
  const verifications = useVerifications();
  // Scans de la période de collecte en cours (4 derniers jours).
  const scans = useQuery({ queryKey: ['scans', { periode: jour }], queryFn: () => apiScans.lister({ date_debut: veille(jour), date_fin: jour }) });
  const duJour = (tournees.data ?? []).filter((t) => t.date === jour);
  const triees = duJour.filter((t) => t.statut === 'triee');
  const resultats = useQueries({ queries: triees.map((t) => ({ queryKey: ['tri', t.id], queryFn: () => apiTri.resultat(t.id) })) });

  const g = globale.data;
  const pointsCredites = resultats.reduce((s, r) => s + (r.data?.points_credites ?? 0), 0);
  const pointsAttente = resultats.reduce((s, r) => s + (r.data?.points_en_attente ?? 0), 0);
  const scansComptes = scans.data?.filter((s) => s.compte).length;
  const badgeTotal = (champ: string) => g?.par_site.map((p) => badge(p.statuts_donnees, champ)).find(Boolean);

  return (
    <>
      <EnTetePage titre="Supervision" sousTitre={`La chaîne du ${jourLong(jour)}, du bac du citoyen jusqu'à l'électricité.`} />
      <div className="mb-4 flex items-stretch gap-2">
        <Maillon rang={0} icone={<ScanLine className="size-4" />} titre="Scans de la période" valeur={scansComptes} unite="scans comptés" pied={<span className="text-xs text-texte-doux">{nombre(scans.data?.length)} reçus</span>} />
        <Fleche rang={0} />
        <Maillon
          rang={1}
          icone={<Truck className="size-4" />}
          titre="Collectes du jour"
          valeur={tournees.data ? duJour.reduce((s, t) => s + t.nb_bacs_collectes, 0) : null}
          unite="bacs collectés"
          pied={<span className="text-xs text-texte-doux">{nombre(duJour.length)} tournées</span>}
        />
        <Fleche rang={1} />
        <Maillon
          rang={2}
          icone={<Boxes className="size-4" />}
          titre="Tournées triées"
          valeur={tournees.data ? triees.length : null}
          unite={`/ ${nombre(duJour.length)}`}
          pied={<span className="text-xs text-texte-doux">{nombre(duJour.length - triees.length)} en attente de tri</span>}
        />
        <Fleche rang={2} />
        <Maillon
          rang={3}
          icone={<Coins className="size-4" />}
          titre="Points distribués"
          valeur={pointsCredites}
          unite="crédités"
          pied={pointsAttente > 0 ? <PastilleStatut statut={apparence('attention', `${nombre(pointsAttente)} en attente`)} /> : undefined}
        />
        <Fleche rang={3} />
        <Maillon
          rang={4}
          icone={<Zap className="size-4" />}
          titre="Électricité produite"
          valeur={g?.electricite_kwh}
          unite="kWh"
          pied={<BadgeProvenance statut={badgeTotal('electricite_kwh')} />}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            vers: '/methanisation/alertes',
            icone: <TriangleAlert className="size-5" />,
            titre: 'Alertes ouvertes',
            valeur: alertes.data?.length,
            texte: alertes.data?.[0] ? `${alertes.data[0].code_site} · ${alertes.data[0].description}` : 'Les trois sites produisent dans la tolérance.',
            alerte: !!alertes.data?.length,
          },
          {
            vers: '/admin/verifications',
            icone: <ClipboardCheck className="size-5" />,
            titre: 'Cas à vérifier',
            valeur: verifications.data?.length,
            texte: verifications.data?.[0]?.libelle ?? 'Rien à vérifier pour le moment.',
          },
          {
            vers: '/admin/tracabilite',
            icone: <Waypoints className="size-5" />,
            titre: 'Traçabilité',
            valeur: null,
            texte: "Remonter d'un bac jusqu'aux points et à l'énergie.",
          },
        ].map((c, i) => (
          <motion.div key={c.vers} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.08 }}>
            <Link
              to={c.vers}
              className={cn(
                'group flex h-full items-start gap-4 rounded-carte bg-surface p-5 shadow-carte transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-flottante',
                c.alerte && 'shadow-[0_0_0_2px_var(--statut-alerte)]',
              )}
            >
              <span className={cn('grid size-11 shrink-0 place-items-center rounded-full', c.alerte ? 'bg-statut-alerte-fond text-statut-alerte' : 'bg-vert-pale text-vert')}>{c.icone}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <b>{c.titre}</b>
                  {c.valeur != null && <span className={cn('text-[28px] font-bold', c.alerte && 'text-statut-alerte')}>{nombre(c.valeur)}</span>}
                </span>
                <span className="mt-1 block text-[13px] text-texte-doux">{c.texte}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-vert group-hover:underline">
                  Ouvrir <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
      <Link
        to="/admin/capteurs"
        className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-vert underline-offset-2 hover:underline"
      >
        <Radio className="size-4" /> Capteurs des digesteurs
      </Link>
      <LegendeProvenance className="mt-[18px]" />
    </>
  );
}
