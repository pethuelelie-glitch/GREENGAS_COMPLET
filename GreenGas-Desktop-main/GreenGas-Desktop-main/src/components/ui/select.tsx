/** Liste déroulante « pilule » de la maquette (Radix Select). */
import * as S from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Valeur interne de l'option « tous » (Radix n'accepte pas la chaîne vide). */
const TOUS = '__tous__';

export interface OptionSelect {
  valeur: string;
  libelle: string;
}

interface ProprietesSelect {
  valeur: string;
  surChangement: (valeur: string) => void;
  options: OptionSelect[];
  /** Libellé de l'option vide (« Tous les secteurs ») ; absent = choix obligatoire. */
  libelleTous?: string;
  etiquette: string;
  className?: string;
  variante?: 'pilule' | 'champ';
  id?: string;
  disabled?: boolean;
}

export function Select({
  valeur,
  surChangement,
  options,
  libelleTous,
  etiquette,
  className,
  variante = 'pilule',
  id,
  disabled,
}: ProprietesSelect) {
  const choix = libelleTous ? [{ valeur: TOUS, libelle: libelleTous }, ...options] : options;
  return (
    <S.Root
      value={valeur === '' && libelleTous ? TOUS : valeur}
      onValueChange={(v) => surChangement(v === TOUS ? '' : v)}
      disabled={disabled}
    >
      <S.Trigger
        id={id}
        aria-label={etiquette}
        className={cn(
          'inline-flex items-center justify-between gap-2 text-[13px] font-semibold text-texte transition-[box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-or data-[disabled]:opacity-50',
          variante === 'pilule'
            ? 'h-10 rounded-full bg-surface pl-[18px] pr-3.5 shadow-puce hover:shadow-flottante'
            : 'h-[41px] w-full rounded-[10px] border border-bordure bg-surface px-3 font-normal hover:border-vert',
          className,
        )}
      >
        <S.Value />
        <S.Icon>
          <ChevronDown className="size-4 text-texte" />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content
          position="popper"
          sideOffset={6}
          className="z-[60] max-h-[320px] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl bg-surface p-1.5 shadow-modale data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
        >
          <S.Viewport>
            {choix.map((o) => (
              <S.Item
                key={o.valeur}
                value={o.valeur}
                className="relative flex cursor-pointer select-none items-center gap-2 rounded-xl py-2 pl-8 pr-3 text-[13px] text-texte outline-none transition-colors data-[highlighted]:bg-vert-pale data-[state=checked]:font-semibold data-[highlighted]:text-vert-foret-encre"
              >
                <S.ItemIndicator className="absolute left-2.5">
                  <Check className="size-4 text-vert" />
                </S.ItemIndicator>
                <S.ItemText>{o.libelle}</S.ItemText>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}
