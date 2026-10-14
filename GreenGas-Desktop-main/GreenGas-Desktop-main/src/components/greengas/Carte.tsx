/** Panneau blanc arrondi de la maquette (`.pn`), avec titre optionnel et apparition en cascade. */
import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { apparition } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface ProprietesCarte extends Omit<HTMLMotionProps<'section'>, 'title'> {
  titre?: ReactNode;
  action?: ReactNode;
  /** Bordure rouge d'un élément en alerte. */
  enAlerte?: boolean;
  /** Supprime le rembourrage (tableaux). */
  compacte?: boolean;
  children?: ReactNode;
}

export const Carte = forwardRef<HTMLElement, ProprietesCarte>(
  ({ titre, action, enAlerte, compacte, className, children, ...props }, ref) => (
    <motion.section
      ref={ref}
      variants={apparition}
      className={cn(
        'rounded-carte bg-surface shadow-carte transition-shadow duration-300',
        compacte ? 'px-2 py-1.5' : 'px-5 py-[18px]',
        enAlerte && 'shadow-[0_0_0_2px_var(--statut-alerte)]',
        className,
      )}
      {...props}
    >
      {(titre || action) && (
        <div className={cn('mb-3 flex items-center justify-between gap-3', compacte && 'px-3 pt-3')}>
          {titre && <h3 className="text-sm font-bold text-texte">{titre}</h3>}
          {action}
        </div>
      )}
      {children}
    </motion.section>
  ),
);
Carte.displayName = 'Carte';
