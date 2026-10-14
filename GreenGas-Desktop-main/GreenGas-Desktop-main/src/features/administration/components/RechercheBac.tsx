/** Champ « Code du bac » avec autocomplétion (code ou résidence). */
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search } from 'lucide-react';
import type { Bac } from '@/api/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function RechercheBac({ bacs, valeurInitiale, surChoix }: { bacs: Bac[]; valeurInitiale: string; surChoix: (code: string) => void }) {
  const [texte, setTexte] = useState(valeurInitiale);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(0);
  const q = texte.trim().toLowerCase();
  const suggestions = bacs.filter((b) => !q || `${b.code} ${b.residence}`.toLowerCase().includes(q)).slice(0, 7);

  const choisir = (code: string) => {
    setTexte(code);
    setOuvert(false);
    surChoix(code);
  };

  return (
    <div className="relative flex items-center gap-2.5">
      <label className="flex h-10 w-[260px] items-center gap-2 rounded-full bg-surface px-3.5 shadow-puce focus-within:shadow-[0_0_0_3px_var(--or)]">
        <Search className="size-4 text-texte-doux" aria-hidden />
        <input
          role="combobox"
          aria-expanded={ouvert}
          aria-controls="suggestions-bacs"
          aria-label="Code du bac"
          value={texte}
          placeholder="Code du bac (BAC-014)"
          className="flex-1 bg-transparent font-mono text-[13px] uppercase outline-none placeholder:font-sans placeholder:normal-case"
          onFocus={() => setOuvert(true)}
          onBlur={() => window.setTimeout(() => setOuvert(false), 120)}
          onChange={(e) => {
            setTexte(e.target.value);
            setOuvert(true);
            setActif(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setActif((a) => Math.min(a + 1, suggestions.length - 1));
            else if (e.key === 'ArrowUp') setActif((a) => Math.max(a - 1, 0));
            else if (e.key === 'Enter') {
              e.preventDefault();
              choisir(suggestions[actif]?.code ?? texte.trim().toUpperCase());
            } else if (e.key === 'Escape') setOuvert(false);
          }}
        />
      </label>
      <Button onClick={() => choisir(suggestions[actif]?.code ?? texte.trim().toUpperCase())}>Rechercher</Button>
      <AnimatePresence>
        {ouvert && suggestions.length > 0 && (
          <motion.ul
            id="suggestions-bacs"
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-12 z-30 w-[320px] overflow-hidden rounded-2xl bg-surface p-1.5 shadow-modale"
          >
            {suggestions.map((b, i) => (
              <li
                key={b.id}
                role="option"
                aria-selected={i === actif}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choisir(b.code);
                }}
                onMouseEnter={() => setActif(i)}
                className={cn('flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-[13px]', i === actif && 'bg-vert-pale')}
              >
                <span className="font-mono font-semibold text-vert-foret-encre">{b.code}</span>
                <span className="truncate text-texte-doux">{b.residence}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
