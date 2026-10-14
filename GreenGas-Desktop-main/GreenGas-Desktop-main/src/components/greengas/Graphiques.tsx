/**
 * Graphiques de répartition : anneau (Recharts) et barres horizontales.
 * Les valeurs affichées viennent de l'API ; seule la part visuelle de chaque segment est déduite.
 */
import { motion } from 'motion/react';
import { Cell, Pie, PieChart } from 'recharts';
import { nombre } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ValeurAnimee } from './ValeurAnimee';

export interface Segment {
  libelle: string;
  valeur: number;
  couleur: string;
  /** Part fournie par l'API (ex. `part_pct` d'un lot) ; sinon calculée pour le dessin. */
  partPct?: number;
}

export function Anneau({
  segments,
  centre,
  sousTitre,
  taille = 132,
  decimales = 0,
  legende = true,
  className,
}: {
  segments: Segment[];
  centre: number | null;
  sousTitre?: string;
  taille?: number;
  decimales?: number;
  legende?: boolean;
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.valeur, 0);
  const visibles = segments.filter((s) => s.valeur > 0);
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="relative flex-none" style={{ width: taille, height: taille }}>
        <PieChart width={taille} height={taille}>
          <Pie
            data={total > 0 ? visibles : [{ libelle: 'vide', valeur: 1, couleur: 'var(--vert-pale)' }]}
            dataKey="valeur"
            nameKey="libelle"
            innerRadius={taille * 0.31}
            outerRadius={taille * 0.45}
            startAngle={90}
            endAngle={-270}
            stroke="var(--surface)"
            strokeWidth={total > 0 ? 1.5 : 0}
            animationDuration={1100}
            animationEasing="ease-out"
            isAnimationActive
          >
            {(total > 0 ? visibles : [{ couleur: 'var(--vert-pale)', libelle: 'vide' }]).map((s) => (
              <Cell key={s.libelle} fill={s.couleur} />
            ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center leading-tight">
          <ValeurAnimee valeur={centre} decimales={decimales} className="text-[19px] font-bold text-texte" />
          {sousTitre && <span className="text-[10px] text-texte-doux">{sousTitre}</span>}
        </div>
      </div>
      {legende && (
        <ul className="flex min-w-0 flex-1 flex-col gap-[6px] text-[13px]">
          {segments.map((s, i) => {
            const part = s.partPct ?? (total > 0 ? (s.valeur / total) * 100 : 0);
            return (
              <motion.li
                key={s.libelle}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="grid grid-cols-[12px_1fr_auto_44px] items-center gap-2"
              >
                <i className="size-3 rounded-[3px]" style={{ background: s.couleur }} />
                <span className="truncate">{s.libelle}</span>
                <b className="text-right">{nombre(s.valeur, decimales)}</b>
                <small className="text-right text-texte-doux">{nombre(part, 0)}&nbsp;%</small>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export interface Barre {
  libelle: string;
  valeur: number;
  couleur: string;
  texte: string;
  /** Pastille ou icône d'état à côté du libellé. */
  marque?: React.ReactNode;
}

/** Barres horizontales qui grandissent depuis la gauche (transform uniquement). */
export function BarresHorizontales({ barres, max, largeurLibelle = 78, largeurValeur = 92 }: { barres: Barre[]; max?: number; largeurLibelle?: number; largeurValeur?: number }) {
  const plafond = max ?? Math.max(...barres.map((b) => b.valeur), 1);
  return (
    <div className="flex flex-col gap-[9px]">
      {barres.map((b, i) => (
        <div
          key={b.libelle}
          className="grid items-center gap-2.5 text-[13px]"
          style={{ gridTemplateColumns: `${largeurLibelle}px 1fr ${largeurValeur}px` }}
        >
          <span className="flex items-center gap-1.5 truncate">
            {b.libelle}
            {b.marque}
          </span>
          <i className="h-2.5 overflow-hidden rounded-[5px] bg-vert-pale">
            <motion.u
              className="block h-full origin-left rounded-[5px]"
              style={{ background: b.couleur }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: Math.max(0, Math.min(1, b.valeur / plafond)) }}
              transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.1 + i * 0.07 }}
            />
          </i>
          <b className="text-right">{b.texte}</b>
        </div>
      ))}
    </div>
  );
}
