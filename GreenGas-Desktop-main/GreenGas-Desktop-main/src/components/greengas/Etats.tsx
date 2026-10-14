/** États communs : chargement (squelettes animés), vide, erreur (message de l'API + Réessayer). */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { CloudOff, Inbox, RotateCw, TriangleAlert } from 'lucide-react';
import { codeErreur, messageErreur } from '@/api/erreurs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Squelette({ className }: { className?: string }) {
  return <div aria-hidden className={cn('squelette h-4', className)} />;
}

/** Bloc de chargement générique : quelques lignes de squelette dans un panneau. */
export function EtatChargement({ lignes = 4, className, libelle = 'Chargement…' }: { lignes?: number; className?: string; libelle?: string }) {
  return (
    <div role="status" aria-label={libelle} className={cn('flex flex-col gap-3 rounded-carte bg-surface p-5 shadow-carte', className)}>
      <Squelette className="h-5 w-1/3" />
      {Array.from({ length: lignes }, (_, i) => (
        <Squelette key={i} className={cn('h-9', i % 2 ? 'w-full' : 'w-11/12')} />
      ))}
    </div>
  );
}

/** Squelette d'une page entière (rangée d'indicateurs + deux panneaux). */
export function EtatChargementPage() {
  return (
    <div role="status" aria-label="Chargement de la page" className="flex flex-col gap-4 p-6">
      <Squelette className="h-7 w-64" />
      <Squelette className="h-4 w-96" />
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Squelette key={i} className="h-28 rounded-kpi" />
        ))}
      </div>
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <Squelette className="h-72 rounded-carte" />
        <Squelette className="h-72 rounded-carte" />
      </div>
    </div>
  );
}

export function EtatVide({ titre, message, action, icone, className }: { titre?: string; message: ReactNode; action?: ReactNode; icone?: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center gap-2 px-6 py-8 text-center text-texte-doux', className)}
    >
      <span className="mb-1 grid size-12 place-items-center rounded-full bg-vert-pale text-vert">{icone ?? <Inbox className="size-6" />}</span>
      {titre && <p className="font-semibold text-texte">{titre}</p>}
      <p className="max-w-md text-[13.5px]">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}

export function EtatErreur({ erreur, reessayer, className }: { erreur: unknown; reessayer?: () => void; className?: string }) {
  const injoignable = codeErreur(erreur) === 'SERVEUR_INJOIGNABLE';
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-start gap-4 rounded-carte bg-surface p-5 shadow-[0_0_0_2px_var(--statut-alerte)]', className)}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-statut-alerte-fond text-statut-alerte">
        {injoignable ? <CloudOff className="size-5" /> : <TriangleAlert className="size-5" />}
      </span>
      <div className="flex-1">
        <p className="font-bold text-texte">{messageErreur(erreur)}</p>
        <p className="mt-1 text-[13px] text-texte-doux">
          {injoignable ? 'Le serveur du Control Center est injoignable.' : 'Le serveur ne répond pas comme prévu.'}
        </p>
      </div>
      {reessayer && (
        <Button onClick={reessayer} taille="petite">
          <RotateCw /> Réessayer
        </Button>
      )}
    </motion.div>
  );
}
