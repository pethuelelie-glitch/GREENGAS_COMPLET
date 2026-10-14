/**
 * Badges Mesuré / Estimé / Simulé : distingués par la forme (plein, contour, pointillés).
 * La valeur vient toujours de `statuts_donnees` renvoyé par l'API, jamais d'une déduction.
 */
import type { StatutDonnee } from '@/api/types';
import { DEFINITION_STATUT_DONNEE, LIBELLE_STATUT_DONNEE } from '@/lib/libelles';
import { cn } from '@/lib/utils';
import { Infobulle } from '@/components/ui/infobulle';

const STYLES: Record<StatutDonnee, string> = {
  mesure: 'border-vert-foret bg-vert-foret text-white',
  estime: 'border-vert-foret-encre bg-surface text-vert-foret-encre',
  simule: 'border-dashed border-statut-neutre bg-surface text-texte-doux',
};

const STYLES_SOMBRE: Record<StatutDonnee, string> = {
  mesure: 'border-white bg-white text-vert-foret',
  estime: 'border-white bg-transparent text-white',
  simule: 'border-dashed border-encre-claire bg-transparent text-encre-claire',
};

export function BadgeProvenance({
  statut,
  sombre = false,
  className,
}: {
  statut: StatutDonnee | null | undefined;
  /** Sur fond vert forêt (indicateur mis en avant). */
  sombre?: boolean;
  className?: string;
}) {
  if (!statut) return null;
  return (
    <Infobulle contenu={`Valeur ${DEFINITION_STATUT_DONNEE[statut]}`}>
      <i
        tabIndex={0}
        className={cn(
          'inline-block w-max cursor-help rounded-full border-[1.5px] px-[9px] py-1 text-xs font-semibold not-italic leading-none',
          (sombre ? STYLES_SOMBRE : STYLES)[statut],
          className,
        )}
      >
        {LIBELLE_STATUT_DONNEE[statut]}
      </i>
    </Infobulle>
  );
}

/** Lecture typée d'un badge dans `statuts_donnees` (objet libre du contrat). */
export function badge(statuts: Record<string, StatutDonnee> | null | undefined, champ: string): StatutDonnee | undefined {
  return statuts?.[champ];
}

/** Légende permanente des trois badges, en bas de chaque tableau de bord (brief §3). */
export function LegendeProvenance({ compacte = false, className }: { compacte?: boolean; className?: string }) {
  const statuts: StatutDonnee[] = ['mesure', 'estime', 'simule'];
  return (
    <div className={cn('flex flex-wrap items-center gap-2.5 text-xs text-texte-doux', className)}>
      <b className="text-texte">{compacte ? 'Provenance' : 'Provenance des données'}</b>
      {statuts.map((s) => (
        <span key={s} className="inline-flex items-center gap-2">
          <BadgeProvenance statut={s} />
          {!compacte && <span>{DEFINITION_STATUT_DONNEE[s]}</span>}
        </span>
      ))}
    </div>
  );
}
