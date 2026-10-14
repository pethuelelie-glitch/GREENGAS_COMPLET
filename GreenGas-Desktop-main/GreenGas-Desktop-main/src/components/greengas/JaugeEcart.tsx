/**
 * Jauge d'écart entre biogaz mesuré et attendu (−50 % à +50 %), zone de tolérance au centre,
 * aiguille qui pivote avec un effet ressort. L'écart et le seuil viennent de l'API.
 */
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const CX = 60;
const CY = 62;
const R = 48;

const point = (f: number, r: number) => [CX + r * Math.cos(Math.PI * (1 - f)), CY - r * Math.sin(Math.PI * (1 - f))];
const arc = (a: number, b: number, r: number) => {
  const [x1, y1] = point(a, r);
  const [x2, y2] = point(b, r);
  return `M${x1} ${y1}A${r} ${r} 0 0 1 ${x2} ${y2}`;
};
const fraction = (ecart: number) => (Math.max(-50, Math.min(50, ecart)) + 50) / 100;

interface ProprietesJauge {
  ecartPct: number | null | undefined;
  /** Seuil d'alerte (paramètre `seuil_alerte_production_pct`). */
  seuilPct?: number;
  /** L'écart déclenche une alerte (statut du site renvoyé par l'API). */
  enAlerte?: boolean;
  messageAttente?: string;
  className?: string;
  graduations?: boolean;
}

export function JaugeEcart({
  ecartPct,
  seuilPct = 20,
  enAlerte = false,
  messageAttente = 'En attente de mesure',
  className,
  graduations = true,
}: ProprietesJauge) {
  const zone = Math.min(seuilPct, 50) / 100;
  const angle = ecartPct == null ? -90 : (fraction(ecartPct) - 0.5) * 180;
  return (
    <svg viewBox="0 0 120 70" role="img" aria-label={ecartPct == null ? messageAttente : `Jauge d'écart : ${ecartPct} %`} className={cn('w-full', className)}>
      <motion.path
        d={arc(0, 1, R)}
        stroke="var(--bordure)"
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <motion.path
        d={arc(0.5 - zone, 0.5 + zone, R)}
        stroke="var(--statut-ok)"
        strokeWidth={9}
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
      />
      {graduations &&
        ecartPct != null &&
        [-50, -seuilPct, 0, seuilPct, 50].map((g) => {
          const [x1, y1] = point(fraction(g), R - 8);
          const [x2, y2] = point(fraction(g), R - 4.5);
          return <line key={g} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--statut-neutre)" strokeWidth={0.8} />;
        })}
      {ecartPct == null ? (
        <text x={CX} y={CY - 10} textAnchor="middle" fontSize={6.5} fontWeight={600} fill="var(--texte-doux)">
          {messageAttente}
        </text>
      ) : (
        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: angle }}
          transition={{ type: 'spring', stiffness: 70, damping: 9, mass: 1.1 }}
        >
          {/* Cercle invisible : centre la boîte de l'aiguille sur le pivot de rotation */}
          <circle cx={CX} cy={CY} r={38} fill="transparent" />
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - 36}
            stroke={enAlerte ? 'var(--statut-alerte)' : 'var(--vert-foret)'}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </motion.g>
      )}
      {ecartPct != null && <circle cx={CX} cy={CY} r={4} fill={enAlerte ? 'var(--statut-alerte)' : 'var(--vert-foret)'} />}
    </svg>
  );
}
