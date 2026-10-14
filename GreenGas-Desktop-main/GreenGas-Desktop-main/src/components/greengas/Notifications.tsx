/**
 * Notifications :
 * - confirmations et erreurs : pilule en haut au centre (comme la maquette) ;
 * - alerte entrante : carte rouge qui glisse en haut à droite, avec un lien vers l'alerte.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type TypeNotification = 'succes' | 'erreur' | 'info' | 'alerte';

interface Notification {
  id: number;
  type: TypeNotification;
  titre: string;
  message?: string;
  action?: { libelle: string; surClic: () => void };
}

type Nouvelle = Omit<Notification, 'id'> & { dureeMs?: number };

interface ContexteNotifications {
  notifier: (n: Nouvelle) => void;
  succes: (titre: string, message?: string) => void;
  erreur: (titre: string, message?: string) => void;
}

const Contexte = createContext<ContexteNotifications | null>(null);

const ICONES = { succes: CircleCheck, erreur: CircleX, info: Info, alerte: TriangleAlert } as const;

export function FournisseurNotifications({ children }: { children: ReactNode }) {
  const [liste, setListe] = useState<Notification[]>([]);
  const compteur = useRef(0);

  const retirer = useCallback((id: number) => setListe((l) => l.filter((n) => n.id !== id)), []);

  const notifier = useCallback(
    ({ dureeMs, ...n }: Nouvelle) => {
      const id = ++compteur.current;
      setListe((l) => [...l.filter((x) => x.type === 'alerte' || n.type === 'alerte'), { ...n, id }].slice(-4));
      window.setTimeout(() => retirer(id), dureeMs ?? (n.type === 'alerte' ? 9000 : 2800));
    },
    [retirer],
  );

  const valeur = useMemo(
    () => ({
      notifier,
      succes: (titre: string, message?: string) => notifier({ type: 'succes', titre, message }),
      erreur: (titre: string, message?: string) => notifier({ type: 'erreur', titre, message, dureeMs: 4500 }),
    }),
    [notifier],
  );

  const pilules = liste.filter((n) => n.type !== 'alerte');
  const alertes = liste.filter((n) => n.type === 'alerte');

  return (
    <Contexte.Provider value={valeur}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed left-1/2 top-5 z-[80] flex -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {pilules.map((n) => {
            const Icone = ICONES[n.type];
            return (
              <motion.div
                key={n.id}
                layout
                role="status"
                initial={{ opacity: 0, y: -24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, transition: { duration: 0.18 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                className={cn(
                  'pointer-events-auto flex max-w-[560px] items-center gap-2.5 rounded-full px-[18px] py-2.5 font-semibold text-white shadow-modale',
                  n.type === 'erreur' ? 'bg-statut-alerte' : 'bg-vert-foret',
                )}
              >
                <Icone className="size-[18px] shrink-0" aria-hidden />
                <span>
                  {n.titre}
                  {n.message && <span className="font-normal opacity-90"> · {n.message}</span>}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div aria-live="assertive" className="pointer-events-none fixed right-5 top-[68px] z-[80] flex w-[360px] flex-col gap-3">
        <AnimatePresence>
          {alertes.map((n) => (
            <motion.div
              key={n.id}
              layout
              role="alert"
              initial={{ opacity: 0, x: 120 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="pointer-events-auto relative overflow-hidden rounded-2xl bg-surface p-4 pl-5 shadow-modale"
            >
              <span className="absolute inset-y-0 left-0 w-1.5 bg-statut-alerte" aria-hidden />
              <div className="flex items-start gap-3">
                <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-statut-alerte-fond text-statut-alerte">
                  <span className="absolute inset-0 animate-pulsation rounded-full border-2 border-statut-alerte" aria-hidden />
                  <TriangleAlert className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold uppercase tracking-wide text-statut-alerte">Nouvelle alerte</p>
                  <p className="mt-0.5 font-semibold text-texte">{n.titre}</p>
                  {n.message && <p className="mt-0.5 text-[13px] text-texte-doux">{n.message}</p>}
                  {n.action && (
                    <button
                      type="button"
                      onClick={() => {
                        n.action?.surClic();
                        retirer(n.id);
                      }}
                      className="mt-2 text-[13px] font-semibold text-statut-alerte underline underline-offset-2"
                    >
                      {n.action.libelle}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Fermer la notification"
                  onClick={() => retirer(n.id)}
                  className="grid size-7 place-items-center rounded-full text-texte-doux hover:bg-vert-pale"
                >
                  <X className="size-4" />
                </button>
              </div>
              <motion.span
                aria-hidden
                className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-statut-alerte-fond"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 9, ease: 'linear' }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Contexte.Provider>
  );
}

export function useNotifications(): ContexteNotifications {
  const c = useContext(Contexte);
  if (!c) throw new Error('useNotifications doit être utilisé dans <FournisseurNotifications>');
  return c;
}
