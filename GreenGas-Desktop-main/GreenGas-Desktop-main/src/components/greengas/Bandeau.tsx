/** Bandeau dans une page : alerte (rouge), journée clôturée (gris), information (or). */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Info, Lock, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const STYLES = {
  alerte: { classes: 'bg-statut-alerte text-white', icone: TriangleAlert },
  cloture: { classes: 'bg-statut-neutre-fond text-statut-neutre-texte', icone: Lock },
  info: { classes: 'bg-or-pale text-or-texte', icone: Info },
} as const;

export function Bandeau({ type, children, action, className }: { type: keyof typeof STYLES; children: ReactNode; action?: ReactNode; className?: string }) {
  const { classes, icone: Icone } = STYLES[type];
  return (
    <motion.div
      role={type === 'alerte' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={cn('mb-4 flex items-center gap-2.5 rounded-xl px-4 py-2.5 font-semibold', classes, className)}
    >
      <Icone className="size-[18px] shrink-0" aria-hidden />
      <span className="flex-1">{children}</span>
      {action}
    </motion.div>
  );
}
