/** Barre de recherche et de filtres de la maquette (pilules), avec « Effacer les filtres ». */
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { Select, type OptionSelect } from '@/components/ui/select';

export type Filtre =
  | { type: 'recherche'; cle: string; valeur: string; placeholder: string }
  | { type: 'liste'; cle: string; valeur: string; libelleTous: string; options: OptionSelect[] }
  | { type: 'date'; cle: string; valeur: string; etiquette: string };

export function BarreFiltres({
  filtres,
  surChangement,
  surEffacer,
  actions,
  resultat,
}: {
  filtres: Filtre[];
  surChangement: (cle: string, valeur: string) => void;
  surEffacer: () => void;
  actions?: ReactNode;
  /** Ex. « 3 bacs sur 7 ». */
  resultat?: ReactNode;
}) {
  const actifs = filtres.some((f) => f.valeur !== '');
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {filtres.map((f) => {
        if (f.type === 'recherche') {
          return (
            <label
              key={f.cle}
              className="flex h-10 min-w-[280px] items-center gap-2 rounded-full bg-surface px-3.5 shadow-puce transition-shadow focus-within:shadow-[0_0_0_3px_var(--or)]"
            >
              <Search className="size-4 text-texte-doux" aria-hidden />
              <input
                type="search"
                value={f.valeur}
                placeholder={f.placeholder}
                aria-label={f.placeholder}
                onChange={(e) => surChangement(f.cle, e.target.value)}
                className="flex-1 border-0 bg-transparent py-2.5 text-[13px] outline-none placeholder:text-texte-doux"
              />
              {f.valeur && (
                <button type="button" aria-label="Vider la recherche" onClick={() => surChangement(f.cle, '')}>
                  <X className="size-4 text-texte-doux hover:text-texte" />
                </button>
              )}
            </label>
          );
        }
        if (f.type === 'date') {
          return (
            <input
              key={f.cle}
              type="date"
              value={f.valeur}
              aria-label={f.etiquette}
              onChange={(e) => surChangement(f.cle, e.target.value)}
              className="h-10 rounded-full border-0 bg-surface px-3.5 text-[13px] font-semibold shadow-puce outline-none focus-visible:shadow-[0_0_0_3px_var(--or)]"
            />
          );
        }
        return (
          <Select
            key={f.cle}
            valeur={f.valeur}
            surChangement={(v) => surChangement(f.cle, v)}
            options={f.options}
            libelleTous={f.libelleTous}
            etiquette={f.libelleTous}
          />
        );
      })}
      <AnimatePresence>
        {actifs && (
          <motion.button
            type="button"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            onClick={surEffacer}
            className="text-[13px] font-semibold text-vert underline underline-offset-2 hover:text-vert-foret-encre"
          >
            Effacer les filtres
          </motion.button>
        )}
      </AnimatePresence>
      {resultat && <span className="text-[12.5px] text-texte-doux">{resultat}</span>}
      <span className="flex-1" />
      {actions}
    </div>
  );
}
