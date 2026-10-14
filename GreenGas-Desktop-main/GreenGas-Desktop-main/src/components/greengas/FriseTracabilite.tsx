/**
 * Frise de traçabilité : étapes reliées par des flèches, chacune dépliable.
 * Scans → Collecte → Tournée → Tri → Points → Énergie.
 */
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import type { StatutDonnee } from '@/api/types';
import { cn } from '@/lib/utils';
import { BadgeProvenance } from './BadgeProvenance';

export interface EtapeFrise {
  cle: string;
  titre: string;
  icone: ReactNode;
  valeur: ReactNode;
  unite?: string;
  provenance?: StatutDonnee;
  /** Étape pas encore atteinte (ex. tournée non triée). */
  inactive?: boolean;
  detail: ReactNode;
}

export function FriseTracabilite({
  etapes,
  selection,
  surSelection,
}: {
  etapes: EtapeFrise[];
  selection: string;
  surSelection: (cle: string) => void;
}) {
  const active = etapes.find((e) => e.cle === selection) ?? etapes[0];
  return (
    <div>
      <ol className="mb-4 flex items-stretch gap-2" aria-label="Chaîne de traçabilité">
        {etapes.map((e, i) => (
          <li key={e.cle} className="flex flex-1 items-stretch gap-2">
            <motion.button
              type="button"
              aria-pressed={e.cle === active.cle}
              onClick={() => surSelection(e.cle)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: e.inactive ? 0.55 : 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex min-w-0 flex-1 flex-col gap-[7px] rounded-[14px] border-2 bg-surface p-3 text-left shadow-carte transition-[border-color,box-shadow]',
                e.cle === active.cle ? 'border-vert-foret-encre shadow-flottante' : 'border-transparent hover:shadow-flottante',
              )}
            >
              <small className="flex items-center gap-1.5 text-[12.5px] font-semibold text-texte-doux">
                <span className="text-vert">{e.icone}</span>
                {e.titre}
              </small>
              <b className="truncate text-[17px] font-bold text-texte">
                {e.valeur} {e.unite && <small className="text-[12.5px] font-semibold text-texte-doux">{e.unite}</small>}
              </b>
              <span className="min-h-[20px]">
                <BadgeProvenance statut={e.provenance} />
              </span>
            </motion.button>
            {i < etapes.length - 1 && (
              <motion.span
                aria-hidden
                className="flex items-center text-statut-neutre"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 + 0.2 }}
              >
                <ChevronRight className="size-5" />
              </motion.span>
            )}
          </li>
        ))}
      </ol>
      <AnimatePresence mode="wait">
        <motion.div
          key={active.cle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
          transition={{ duration: 0.28 }}
          className="rounded-carte bg-surface px-5 py-[18px] shadow-carte"
        >
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <span className="text-vert">{active.icone}</span>
            {active.titre}
          </h3>
          {active.detail}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
