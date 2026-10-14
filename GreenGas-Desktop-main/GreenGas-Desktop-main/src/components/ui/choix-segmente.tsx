/** Boutons radio présentés en segments (niveau de contamination, destination du digestat…). */
import * as R from '@radix-ui/react-radio-group';
import { motion } from 'motion/react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

interface ProprietesChoix<T extends string> {
  valeur: T;
  surChangement: (valeur: T) => void;
  options: { valeur: T; libelle: string }[];
  etiquette: string;
  className?: string;
  disabled?: boolean;
}

export function ChoixSegmente<T extends string>({
  valeur,
  surChangement,
  options,
  etiquette,
  className,
  disabled,
}: ProprietesChoix<T>) {
  const groupe = useId();
  return (
    <R.Root
      value={valeur}
      onValueChange={(v) => surChangement(v as T)}
      aria-label={etiquette}
      disabled={disabled}
      className={cn('inline-flex rounded-full bg-vert-pale p-1', className)}
    >
      {options.map((o) => (
        <R.Item
          key={o.valeur}
          value={o.valeur}
          className="relative min-h-8 rounded-full px-4 py-1 text-[13px] font-semibold leading-tight text-texte-doux transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-or data-[state=checked]:text-white"
        >
          {o.valeur === valeur && (
            <motion.span
              layoutId={`segment-${groupe}`}
              className="absolute inset-0 rounded-full bg-vert-foret shadow-sm"
              transition={{ type: 'spring', stiffness: 520, damping: 36 }}
            />
          )}
          <span className="relative z-[1]">{o.libelle}</span>
        </R.Item>
      ))}
    </R.Root>
  );
}
