import { cn } from '@/lib/utils';
import type { ApparenceStatut, Ton } from '@/lib/statuts';

const TONS: Record<Ton, string> = {
  ok: 'bg-statut-ok-fond text-statut-ok-texte',
  alerte: 'bg-statut-alerte-fond text-statut-alerte-texte',
  attention: 'bg-statut-attention-fond text-statut-attention-texte',
  neutre: 'bg-statut-neutre-fond text-statut-neutre-texte',
};

/** Pastille de statut : couleur + icône + texte (jamais la couleur seule). */
export function PastilleStatut({
  statut,
  libelle,
  className,
  pulse = false,
}: {
  statut: ApparenceStatut;
  /** Remplace le libellé par défaut (ex. « Surinscrit »). */
  libelle?: string;
  className?: string;
  /** Halo pulsé pour attirer l'œil sur une alerte en cours. */
  pulse?: boolean;
}) {
  const Icone = statut.icone;
  return (
    <span
      className={cn(
        'relative inline-flex w-max items-center gap-[5px] whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-bold leading-none',
        TONS[statut.ton],
        className,
      )}
    >
      {pulse && statut.ton === 'alerte' && (
        <span aria-hidden className="absolute inset-0 animate-halo rounded-full border-2 border-statut-alerte" />
      )}
      <Icone className="size-[13px]" aria-hidden strokeWidth={2.2} />
      {libelle ?? statut.libelle}
    </span>
  );
}
