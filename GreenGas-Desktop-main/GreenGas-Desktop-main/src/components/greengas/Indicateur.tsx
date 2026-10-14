/** Indicateur clé (KPI) : libellé, gros chiffre animé, unité, badges et pastille facultatifs. */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { apparition } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { ValeurAnimee } from './ValeurAnimee';

interface ProprietesIndicateur {
  libelle: string;
  valeur: number | null | undefined;
  decimales?: number;
  unite?: ReactNode;
  /** Badges de provenance, pastille de statut… affichés sous le chiffre. */
  pied?: ReactNode;
  /** Variante mise en avant sur fond vert forêt. */
  sombre?: boolean;
  enAlerte?: boolean;
  /** Variante sur fond vert pâle, sans ombre (indicateurs secondaires). */
  discret?: boolean;
  icone?: ReactNode;
  className?: string;
  /** Texte affiché à la place du chiffre quand la valeur n'est pas encore disponible. */
  enAttente?: string;
}

export function Indicateur({
  libelle,
  valeur,
  decimales = 0,
  unite,
  pied,
  sombre,
  enAlerte,
  discret,
  icone,
  className,
  enAttente,
}: ProprietesIndicateur) {
  return (
    <motion.div
      variants={apparition}
      className={cn(
        'flex flex-col gap-[7px] rounded-kpi px-3.5 py-3',
        sombre ? 'bg-vert-foret text-white shadow-flottante' : discret ? 'bg-vert-pale' : 'bg-surface shadow-flottante',
        enAlerte && 'shadow-[0_0_0_2px_var(--statut-alerte)]',
        className,
      )}
    >
      <div className={cn('flex items-center gap-2 text-[13px] font-semibold', sombre ? 'text-encre-claire' : 'text-texte-doux')}>
        {icone}
        {libelle}
      </div>
      {valeur == null && enAttente ? (
        <div className={cn('text-[13px] font-medium', sombre ? 'text-encre-claire' : 'text-texte-doux')}>{enAttente}</div>
      ) : (
        <div className="flex flex-wrap items-baseline gap-[5px] leading-[1.1]">
          <ValeurAnimee valeur={valeur} decimales={decimales} className="text-[32px] font-bold tracking-tight" />
          {unite && (
            <small className={cn('text-[12.5px] font-medium', sombre ? 'text-encre-claire' : 'text-texte-doux')}>{unite}</small>
          )}
        </div>
      )}
      {pied && <div className="flex flex-wrap items-center gap-1.5">{pied}</div>}
    </motion.div>
  );
}
