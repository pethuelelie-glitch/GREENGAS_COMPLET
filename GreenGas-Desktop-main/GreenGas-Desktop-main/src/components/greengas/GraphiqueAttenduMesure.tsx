/**
 * Biogaz attendu (pointillés) et mesuré (trait plein) sur plusieurs jours, avec la zone de tolérance
 * en fond et le point du jour en alerte marqué en rouge. Courbes tracées progressivement.
 */
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type DotProps,
} from 'recharts';
import type { ProductionEnergie } from '@/api/types';
import { jourMois, m3, pourcentage } from '@/lib/format';

interface Point {
  date: string;
  attendu: number;
  mesure: number | null;
  tolerance: [number, number];
  ecart: number | null;
  alerte: boolean;
}

interface ProprietesGraphique {
  /** Productions de la plus ancienne à la plus récente. */
  productions: ProductionEnergie[];
  /** Seuil d'alerte en % (paramètre `seuil_alerte_production_pct`). */
  seuilPct: number;
  /** Dates (AAAA-MM-JJ) pour lesquelles le serveur a ouvert ou prolongé une alerte. */
  datesEnAlerte: Set<string>;
  hauteur?: number;
}

function PointMesure(props: DotProps & { payload?: Point }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload || payload.mesure == null) return null;
  if (payload.alerte) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={11} fill="var(--statut-alerte)" opacity={0.18} className="animate-pulsation" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
        <circle cx={cx} cy={cy} r={6} fill="var(--statut-alerte)" stroke="var(--surface)" strokeWidth={2} />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={3.5} fill="var(--vert)" stroke="var(--surface)" strokeWidth={1.5} />;
}

function Infobulle({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl bg-bulle px-3 py-2 text-xs text-bulle-texte shadow-flottante">
      <b className="text-[13px]">{jourMois(p.date)}</b>
      <div>Attendu : {m3(p.attendu)}</div>
      <div>Mesuré : {p.mesure == null ? 'en attente' : m3(p.mesure)}</div>
      {p.ecart != null && <div className={p.alerte ? 'font-bold' : ''}>Écart : {pourcentage(p.ecart)}</div>}
    </div>
  );
}

export function GraphiqueAttenduMesure({ productions, seuilPct, datesEnAlerte, hauteur = 230 }: ProprietesGraphique) {
  const donnees: Point[] = productions
    .filter((p) => p.biogaz_attendu_m3 > 0)
    .map((p) => ({
      date: p.date,
      attendu: p.biogaz_attendu_m3,
      mesure: p.biogaz_mesure_m3,
      // Zone de tolérance dessinée autour de l'attendu (visualisation du seuil, pas un calcul d'écart).
      tolerance: [p.biogaz_attendu_m3 * (1 - seuilPct / 100), p.biogaz_attendu_m3 * (1 + seuilPct / 100)],
      ecart: p.ecart_pct,
      alerte: datesEnAlerte.has(p.date),
    }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={hauteur}>
        <ComposedChart data={donnees} margin={{ top: 12, right: 16, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="var(--vert-pale)" />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => d.slice(8)}
            tick={{ fill: 'var(--texte-doux)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--bordure)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--texte-doux)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[(min: number) => Math.floor(min * 0.85), (max: number) => Math.ceil(max * 1.05)]}
            unit=" m³"
            width={58}
          />
          <Tooltip content={<Infobulle />} cursor={{ stroke: 'var(--bordure)' }} />
          <Area
            dataKey="tolerance"
            stroke="none"
            fill="var(--statut-ok)"
            fillOpacity={0.13}
            isAnimationActive
            animationDuration={900}
          />
          <Line
            dataKey="attendu"
            stroke="var(--or)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive
            animationDuration={1000}
          />
          <Line
            dataKey="mesure"
            stroke="var(--vert)"
            strokeWidth={3}
            strokeLinejoin="round"
            dot={<PointMesure />}
            activeDot={{ r: 6, fill: 'var(--vert-foret)' }}
            connectNulls={false}
            isAnimationActive
            animationDuration={1500}
            animationBegin={250}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-texte-doux">
        <span className="inline-flex items-center gap-1.5">
          <svg width="22" height="6" aria-hidden><line x1="0" y1="3" x2="22" y2="3" stroke="var(--or)" strokeWidth="2" strokeDasharray="5 3" /></svg>
          attendu
        </span>
        <span className="inline-flex items-center gap-1.5 text-vert">
          <svg width="22" height="6" aria-hidden><line x1="0" y1="3" x2="22" y2="3" stroke="var(--vert)" strokeWidth="3" /></svg>
          mesuré
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2.5 w-5 rounded-sm bg-statut-ok-fond" /> tolérance ±{seuilPct}&nbsp;%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-statut-alerte" /> jour en alerte
        </span>
      </div>
    </div>
  );
}
