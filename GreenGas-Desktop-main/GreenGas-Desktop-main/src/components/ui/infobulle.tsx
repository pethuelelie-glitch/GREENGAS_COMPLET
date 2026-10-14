import type { ReactNode } from 'react';
import * as T from '@radix-ui/react-tooltip';

export const FournisseurInfobulles = T.Provider;

/**
 * Infobulle (Radix Tooltip, shadcn/ui) : fondu et léger glissement depuis le déclencheur. L'animation est
 * neutralisée par `prefers-reduced-motion` et par la préférence « Animations réduites » (styles globaux).
 */
export function Infobulle({
  contenu,
  children,
  cote = 'top',
  delai = 250,
}: {
  contenu: ReactNode;
  children: ReactNode;
  cote?: 'top' | 'right' | 'bottom' | 'left';
  /** Délai d'ouverture au survol, en millisecondes (le focus clavier ouvre aussitôt). */
  delai?: number;
}) {
  return (
    <T.Root delayDuration={delai}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={cote}
          sideOffset={8}
          className="z-[70] max-w-[280px] rounded-xl bg-bulle px-3 py-2 text-[12.5px] font-medium leading-snug text-bulle-texte shadow-flottante data-[state=delayed-open]:animate-in data-[state=instant-open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0 data-[state=instant-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[side=right]:slide-in-from-left-1 data-[side=left]:slide-in-from-right-1 data-[side=top]:slide-in-from-bottom-1 data-[side=bottom]:slide-in-from-top-1"
        >
          {contenu}
          <T.Arrow className="fill-[var(--bulle)]" />
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
