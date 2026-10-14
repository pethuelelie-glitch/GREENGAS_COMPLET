/** Une notification dans une liste (panneau de la cloche, page Notifications). */
import { motion } from 'motion/react';
import { CircleAlert, Info, TriangleAlert } from 'lucide-react';
import type { Notification } from '@/api/types';
import { apparitionLigne } from '@/lib/animations';
import { ilYA } from '@/lib/horloge';
import { cn } from '@/lib/utils';

const STYLE_NIVEAU = {
  info: { icone: Info, classe: 'bg-vert-pale text-vert-foret-encre' },
  attention: { icone: TriangleAlert, classe: 'bg-statut-attention-fond text-statut-attention-texte' },
  critique: { icone: CircleAlert, classe: 'bg-statut-alerte-fond text-statut-alerte-texte' },
} as const;

export function ElementNotification({ notification: n, surClic }: { notification: Notification; surClic: () => void }) {
  const { icone: Icone, classe } = STYLE_NIVEAU[n.niveau];
  return (
    <motion.li variants={apparitionLigne}>
      <button
        type="button"
        onClick={surClic}
        className={cn(
          'flex w-full gap-3 border-b border-bordure px-4 py-3 text-left transition-colors hover:bg-vert-pale focus-visible:bg-vert-pale',
          !n.lue && 'bg-fond',
        )}
      >
        <span className={cn('grid size-8 flex-none place-items-center rounded-full', classe)}>
          <Icone aria-hidden className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <b className="truncate text-[13.5px] text-texte">{n.titre}</b>
            <small className="flex-none text-[11.5px] text-texte-doux">{ilYA(n.date_creation)}</small>
          </span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-texte-doux">{n.message}</span>
        </span>
        {!n.lue && <span aria-label="Non lue" className="mt-1.5 size-2 flex-none rounded-full bg-vert" />}
      </button>
    </motion.li>
  );
}
