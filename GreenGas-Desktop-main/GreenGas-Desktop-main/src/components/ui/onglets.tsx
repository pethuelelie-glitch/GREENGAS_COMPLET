/**
 * Onglets « pilule » avec un indicateur qui glisse d'un onglet à l'autre (Motion `layoutId`).
 * Utilisés pour les sites (DIG-01/02/03), les vérifications, les familles de paramètres…
 */
import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface Onglet<T extends string> {
  valeur: T;
  libelle: ReactNode;
  compteur?: number;
}

interface ProprietesOnglets<T extends string> {
  onglets: Onglet<T>[];
  valeur: T;
  surChangement: (valeur: T) => void;
  etiquette: string;
  className?: string;
}

export function Onglets<T extends string>({ onglets, valeur, surChangement, etiquette, className }: ProprietesOnglets<T>) {
  const groupe = useId();
  return (
    <div role="tablist" aria-label={etiquette} className={cn('flex flex-wrap gap-2', className)}>
      {onglets.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <button
            key={o.valeur}
            role="tab"
            type="button"
            aria-selected={actif}
            onClick={() => surChangement(o.valeur)}
            className={cn(
              'relative h-[38px] rounded-full px-4 text-[13px] font-semibold transition-[color,transform,box-shadow] duration-150 active:scale-[0.97]',
              actif ? 'text-white' : 'bg-surface text-texte shadow-puce hover:shadow-flottante',
            )}
          >
            {actif && (
              <motion.span
                layoutId={`onglet-${groupe}`}
                className="absolute inset-0 rounded-full bg-vert-foret"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-[1] inline-flex items-center gap-2">
              {o.libelle}
              {o.compteur != null && o.compteur > 0 && (
                <span
                  className={cn(
                    'grid h-[18px] min-w-[18px] place-items-center rounded-full px-1.5 text-[10.5px] font-extrabold',
                    actif ? 'bg-surface text-vert-foret-encre' : 'bg-statut-attention text-white',
                  )}
                >
                  {o.compteur}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
