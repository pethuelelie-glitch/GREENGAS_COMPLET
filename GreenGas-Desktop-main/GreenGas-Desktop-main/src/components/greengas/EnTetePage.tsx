/**
 * En-tête de page de la maquette : titre et sous-titre à gauche ; date de travail,
 * fraîcheur des données et utilisateur à droite.
 */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useSession } from '@/auth/session';
import { useDerniereMiseAJour } from '@/hooks/useDerniereMiseAJour';
import { config } from '@/lib/config';
import { date, initiales } from '@/lib/format';
import { LIBELLE_ROLE } from '@/lib/libelles';
import { cn } from '@/lib/utils';
import { Infobulle } from '@/components/ui/infobulle';
import { Cloche } from './Cloche';

export function PucesSession({ className }: { className?: string }) {
  const { etat } = useSession();
  const secondes = useDerniereMiseAJour();
  if (etat.statut !== 'connecte') return null;
  const u = etat.utilisateur;
  return (
    <div className={cn('flex flex-none items-center gap-2', className)}>
      <Infobulle contenu="Date de travail · temps écoulé depuis la dernière mise à jour des données">
        <span className="inline-flex h-[34px] items-center gap-[7px] whitespace-nowrap rounded-full bg-surface px-3.5 text-xs font-semibold shadow-puce">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-statut-ok opacity-60" />
            <span className="relative size-2 rounded-full bg-statut-ok" />
          </span>
          {date(config.dateTravail)} · il y a <b className="inline-block min-w-[1ch] text-center">{secondes}</b> s
        </span>
      </Infobulle>
      <Cloche />
      {/* Simple affichage de l'utilisateur connecté (profil de la session, /auth/moi/) : aucune action ici. */}
      <div
        data-testid="zone-utilisateur"
        className="inline-flex h-[34px] items-center gap-2 whitespace-nowrap rounded-full bg-surface pl-1 pr-3.5 text-xs font-semibold shadow-puce"
      >
        <span
          aria-hidden
          className="grid size-[26px] place-items-center rounded-full bg-vert-foret text-[10.5px] font-bold text-white"
        >
          {initiales(u.nom)}
        </span>
        <span className="flex flex-col leading-tight">
          {u.nom}
          <span className="text-[10.5px] font-medium text-texte-doux">{LIBELLE_ROLE[u.role]}</span>
        </span>
      </div>
    </div>
  );
}

export function EnTetePage({
  titre,
  sousTitre,
  actions,
  className,
}: {
  titre: ReactNode;
  sousTitre?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-[18px] flex items-start justify-between gap-4', className)}>
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-[22px] font-bold tracking-[-0.01em] text-texte">{titre}</h1>
        {sousTitre && <p className="mt-1 text-[13px] text-texte-doux">{sousTitre}</p>}
      </motion.div>
      <div className="flex flex-none items-center gap-2">
        {actions}
        <PucesSession />
      </div>
    </div>
  );
}
