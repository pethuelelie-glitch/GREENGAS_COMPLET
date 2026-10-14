/** Courbe d'historique avec étiquettes de valeur, et mini-courbe (tendance d'une sonde). */
import { LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type DotProps } from 'recharts';
import { nombre } from '@/lib/format';

export interface PointCourbe {
  etiquette: string;
  valeur: number;
  /** Couleur du point (statut renvoyé par l'API, ex. collecte « à vérifier »). */
  couleur?: string;
  detail?: string;
}

function Point(props: DotProps & { payload?: PointCourbe; index?: number; dernier?: number }) {
  const { cx, cy, payload, index, dernier } = props;
  if (cx == null || cy == null) return null;
  return (
    <circle cx={cx} cy={cy} r={index === dernier ? 6 : 4.5} fill={payload?.couleur ?? 'var(--vert)'} stroke="var(--surface)" strokeWidth={1.5} />
  );
}

export function CourbeHistorique({ points, hauteur = 190, unite }: { points: PointCourbe[]; hauteur?: number; unite: string }) {
  return (
    <ResponsiveContainer width="100%" height={hauteur}>
      <LineChart data={points} margin={{ top: 26, right: 28, bottom: 4, left: 28 }}>
        <XAxis
          dataKey="etiquette"
          tick={{ fill: 'var(--texte-doux)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--bordure)' }}
          tickLine={false}
          interval={0}
        />
        <YAxis hide domain={[0, (max: number) => max * 1.2]} />
        <Tooltip
          cursor={{ stroke: 'var(--bordure)' }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="rounded-xl bg-bulle px-3 py-2 text-xs text-bulle-texte shadow-flottante">
                <b>{(payload[0].payload as PointCourbe).etiquette}</b> · {nombre(payload[0].value as number, 1)} {unite}
                {(payload[0].payload as PointCourbe).detail && <div>{(payload[0].payload as PointCourbe).detail}</div>}
              </div>
            ) : null
          }
        />
        <Line
          dataKey="valeur"
          stroke="var(--vert)"
          strokeWidth={3}
          strokeLinejoin="round"
          dot={<Point dernier={points.length - 1} />}
          isAnimationActive
          animationDuration={1300}
        >
          <LabelList
            dataKey="valeur"
            position="top"
            offset={12}
            formatter={(v: number) => nombre(v, v < 10 ? 1 : 0)}
            style={{ fill: 'var(--texte)', fontSize: 13, fontWeight: 700 }}
          />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Petite courbe de tendance sans axe (méthane, température, pH). */
export function MiniCourbe({ valeurs, couleur = 'var(--vert)', largeur = 84, hauteur = 26 }: { valeurs: (number | null)[]; couleur?: string; largeur?: number; hauteur?: number }) {
  const donnees = valeurs.map((v, i) => ({ i, v }));
  return (
    <LineChart width={largeur} height={hauteur} data={donnees} margin={{ top: 3, right: 3, bottom: 3, left: 3 }}>
      <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
      <Line dataKey="v" stroke={couleur} strokeWidth={1.8} dot={false} connectNulls isAnimationActive animationDuration={900} />
    </LineChart>
  );
}
