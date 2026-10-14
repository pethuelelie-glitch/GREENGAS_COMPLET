/**
 * Tableau de la maquette : en-tête vert forêt, lignes alternées, tri par colonne,
 * lignes qui apparaissent en cascade et se réorganisent quand un filtre change.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EtatChargement, EtatErreur, EtatVide } from './Etats';

export interface Colonne<T> {
  cle: string;
  entete: ReactNode;
  rendu: (ligne: T) => ReactNode;
  /** Valeur de tri (active le tri sur la colonne). */
  tri?: (ligne: T) => string | number | null;
  alignement?: 'gauche' | 'droite' | 'centre';
  largeur?: string;
  className?: string;
}

interface ProprietesTableau<T> {
  colonnes: Colonne<T>[];
  lignes: T[] | undefined;
  cleLigne: (ligne: T) => string;
  chargement?: boolean;
  erreur?: unknown;
  reessayer?: () => void;
  messageVide?: ReactNode;
  surClicLigne?: (ligne: T) => void;
  ligneSurlignee?: (ligne: T) => boolean;
  /** Masque l'en-tête (liste simple de la maquette, ex. vérifications). */
  sansEntete?: boolean;
  etiquette: string;
}

export function TableauDonnees<T>({
  colonnes,
  lignes,
  cleLigne,
  chargement,
  erreur,
  reessayer,
  messageVide = 'Aucune donnée à afficher.',
  surClicLigne,
  ligneSurlignee,
  sansEntete,
  etiquette,
}: ProprietesTableau<T>) {
  const [tri, setTri] = useState<{ cle: string; sens: 1 | -1 } | null>(null);

  const triees = useMemo(() => {
    if (!lignes || !tri) return lignes;
    const col = colonnes.find((c) => c.cle === tri.cle);
    if (!col?.tri) return lignes;
    const lire = col.tri;
    return [...lignes].sort((a, b) => {
      const va = lire(a);
      const vb = lire(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      return (va < vb ? -1 : va > vb ? 1 : 0) * tri.sens;
    });
  }, [lignes, tri, colonnes]);

  if (erreur) return <EtatErreur erreur={erreur} reessayer={reessayer} className="m-2" />;
  if (chargement || !triees) return <EtatChargement lignes={5} className="shadow-none" />;
  if (triees.length === 0) return <EtatVide message={messageVide} />;

  const alignement = (c: Colonne<T>) =>
    c.alignement === 'droite' ? 'text-right' : c.alignement === 'centre' ? 'text-center' : 'text-left';

  return (
    <table className="w-full border-collapse text-[13px]" aria-label={etiquette}>
      {!sansEntete && (
        <thead>
          <tr>
            {colonnes.map((c, i) => {
              const actif = tri?.cle === c.cle;
              const Icone = !actif ? ArrowUpDown : tri.sens === 1 ? ArrowUp : ArrowDown;
              return (
                <th
                  key={c.cle}
                  scope="col"
                  style={{ width: c.largeur }}
                  aria-sort={actif ? (tri.sens === 1 ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'bg-vert-foret px-3 py-[9px] text-[12.5px] font-semibold uppercase tracking-[0.02em] text-white',
                    i === 0 && 'rounded-tl-[10px]',
                    i === colonnes.length - 1 && 'rounded-tr-[10px]',
                    alignement(c),
                  )}
                >
                  {c.tri ? (
                    <button
                      type="button"
                      className="group inline-flex items-center gap-1 uppercase"
                      onClick={() => setTri(actif && tri.sens === -1 ? null : { cle: c.cle, sens: actif ? -1 : 1 })}
                    >
                      {c.entete}
                      <Icone className={cn('size-3.5 transition-opacity', actif ? 'opacity-100' : 'opacity-40 group-hover:opacity-90')} />
                    </button>
                  ) : (
                    c.entete
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
      )}
      <tbody>
        <AnimatePresence initial={true}>
          {triees.map((ligne, index) => {
            const surlignee = ligneSurlignee?.(ligne);
            return (
              <motion.tr
                key={cleLigne(ligne)}
                layout="position"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ duration: 0.3, delay: Math.min(index, 14) * 0.035, ease: [0.22, 1, 0.36, 1] }}
                onClick={surClicLigne ? () => surClicLigne(ligne) : undefined}
                className={cn(
                  'group transition-colors duration-150 [&:nth-child(even)>td]:bg-vert-pale',
                  surClicLigne && 'cursor-pointer [&:hover>td]:!bg-statut-ok-fond',
                  surlignee && '[&>td]:!bg-or-pale',
                )}
              >
                {colonnes.map((c) => (
                  <td key={c.cle} className={cn('px-3 py-2.5 align-middle', alignement(c), c.className)}>
                    {c.rendu(ligne)}
                  </td>
                ))}
              </motion.tr>
            );
          })}
        </AnimatePresence>
      </tbody>
    </table>
  );
}
