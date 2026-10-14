/**
 * Modale et panneau latéral (Radix Dialog) animés avec Motion :
 * ouverture avec un ressort, fermeture en fondu, voile qui s'estompe.
 */
import type { ReactNode } from 'react';
import * as D from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const RESSORT = { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 } as const;

/** Voile sombre : rendu comme élément (et non composant) car le portail Radix lui transmet une ref. */
function voile() {
  return (
    <D.Overlay asChild forceMount>
      <motion.div
        className="fixed inset-0 z-50 bg-[var(--voile)] backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      />
    </D.Overlay>
  );
}

interface ProprietesModale {
  ouverte: boolean;
  surChangement: (ouverte: boolean) => void;
  titre: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  pied?: ReactNode;
  className?: string;
  /** Icône ou pastille affichée à gauche du titre. */
  icone?: ReactNode;
}

export function Modale({ ouverte, surChangement, titre, description, children, pied, className, icone }: ProprietesModale) {
  return (
    <D.Root open={ouverte} onOpenChange={surChangement}>
      <AnimatePresence>
        {ouverte && (
          <D.Portal forceMount>
            {voile()}
            <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
              <D.Content asChild forceMount>
                <motion.div
                  className={cn(
                    'pointer-events-auto flex max-h-[88vh] w-[480px] max-w-full flex-col gap-3 overflow-auto rounded-carte bg-surface p-[22px] shadow-modale focus:outline-none',
                    className,
                  )}
                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.14 } }}
                  transition={RESSORT}
                >
                  <div className="flex items-start gap-3">
                    {icone}
                    <div className="min-w-0 flex-1">
                      <D.Title className="text-[15px] font-bold leading-snug text-texte">{titre}</D.Title>
                      {description ? (
                        <D.Description className="mt-1 text-[13px] text-texte-doux">{description}</D.Description>
                      ) : (
                        <D.Description className="sr-only">{typeof titre === 'string' ? titre : 'Fenêtre'}</D.Description>
                      )}
                    </div>
                    <D.Close
                      className="-mr-1 -mt-1 grid size-8 place-items-center rounded-full text-texte-doux transition-colors hover:bg-vert-pale hover:text-vert-foret-encre"
                      aria-label="Fermer"
                    >
                      <X className="size-4" />
                    </D.Close>
                  </div>
                  {children}
                  {pied && <div className="mt-1 flex flex-wrap items-center justify-end gap-2.5">{pied}</div>}
                </motion.div>
              </D.Content>
            </div>
          </D.Portal>
        )}
      </AnimatePresence>
    </D.Root>
  );
}

interface ProprietesPanneau {
  ouvert: boolean;
  surChangement: (ouvert: boolean) => void;
  titre: ReactNode;
  sousTitre?: ReactNode;
  children: ReactNode;
  pied?: ReactNode;
  largeur?: number;
}

/** Panneau latéral de détail (alerte, vérification…), qui glisse depuis la droite. */
export function Panneau({ ouvert, surChangement, titre, sousTitre, children, pied, largeur = 460 }: ProprietesPanneau) {
  return (
    <D.Root open={ouvert} onOpenChange={surChangement}>
      <AnimatePresence>
        {ouvert && (
          <D.Portal forceMount>
            {voile()}
            <D.Content asChild forceMount>
              <motion.aside
                className="fixed bottom-3 right-3 top-3 z-50 flex max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-carte bg-surface shadow-modale focus:outline-none"
                style={{ width: largeur }}
                initial={{ x: largeur + 40, opacity: 0.6 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: largeur + 40, opacity: 0.6, transition: { duration: 0.2, ease: 'easeIn' } }}
                transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              >
                <header className="flex items-start gap-3 border-b border-bordure px-6 py-5">
                  <div className="min-w-0 flex-1">
                    <D.Title className="text-lg font-bold text-texte">{titre}</D.Title>
                    {sousTitre ? (
                      <D.Description className="mt-1 text-[13px] text-texte-doux">{sousTitre}</D.Description>
                    ) : (
                      <D.Description className="sr-only">Détail</D.Description>
                    )}
                  </div>
                  <D.Close
                    className="grid size-8 place-items-center rounded-full text-texte-doux transition-colors hover:bg-vert-pale hover:text-vert-foret-encre"
                    aria-label="Fermer le panneau"
                  >
                    <X className="size-4" />
                  </D.Close>
                </header>
                <div className="defilement flex-1 overflow-auto px-6 py-5">{children}</div>
                {pied && <footer className="border-t border-bordure px-6 py-4">{pied}</footer>}
              </motion.aside>
            </D.Content>
          </D.Portal>
        )}
      </AnimatePresence>
    </D.Root>
  );
}
