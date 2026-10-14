/** Champ numérique en kg, avec son unité et une barre de part qui suit la saisie. */
import { forwardRef, type InputHTMLAttributes } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ProprietesChampPoids extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Part de la catégorie dans la saisie (0 à 100), pour la barre d'aperçu. */
  partPct?: number;
  couleur?: string;
  invalide?: boolean;
}

export const ChampPoids = forwardRef<HTMLInputElement, ProprietesChampPoids>(
  ({ partPct, couleur = 'var(--vert)', invalide, className, ...props }, ref) => (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="relative flex items-center">
        <input
          ref={ref}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          aria-invalid={invalide || undefined}
          className="h-10 w-24 rounded-[10px] border border-bordure bg-surface pl-3 pr-8 text-[15px] font-bold tabular-nums transition-[border-color,box-shadow] hover:border-vert focus-visible:border-vert focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-vert-pale aria-[invalid=true]:border-statut-alerte"
          {...props}
        />
        <span className="pointer-events-none absolute right-2.5 text-xs font-semibold text-texte-doux">kg</span>
      </span>
      {partPct !== undefined && (
        <i className="h-2 flex-1 overflow-hidden rounded bg-vert-pale" aria-hidden>
          <motion.u
            className="block h-full origin-left rounded"
            style={{ background: couleur }}
            animate={{ scaleX: Math.max(0, Math.min(1, partPct / 100)) }}
            transition={{ type: 'spring', stiffness: 160, damping: 22 }}
          />
        </i>
      )}
    </div>
  ),
);
ChampPoids.displayName = 'ChampPoids';
