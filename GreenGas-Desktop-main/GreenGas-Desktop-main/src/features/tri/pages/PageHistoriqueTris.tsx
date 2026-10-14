/** T4 · Historique des tris : tournées triées (résultat de chaque tri) et lots créés. */
import { useState } from 'react';
import { motion } from 'motion/react';
import { useQueries } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiTri } from '@/api/tri';
import { BarreFiltres } from '@/components/greengas/BarreFiltres';
import { Carte } from '@/components/greengas/Carte';
import { CodeObjet } from '@/components/greengas/CodeObjet';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { TableauDonnees } from '@/components/greengas/TableauDonnees';
import { useSecteurs } from '@/hooks/referentiel';
import { cascade } from '@/lib/animations';
import { COULEUR_CATEGORIE } from '@/lib/couleurs';
import { date, kg, nombre, pluriel, pourcentage } from '@/lib/format';
import { LIBELLE_CATEGORIE, LIBELLE_CONTAMINATION, LIBELLE_DESTINATION, LIBELLE_SECTEUR } from '@/lib/libelles';
import { useLots, useTournees } from '../hooks/requetes';

export function PageHistoriqueTris() {
  const navigate = useNavigate();
  const [filtres, setFiltres] = useState({ date: '', secteur: '' });
  const triees = useTournees({ statut: 'triee', date: filtres.date || undefined, secteur_id: filtres.secteur || undefined });
  const secteurs = useSecteurs();
  const lots = useLots();
  const resultats = useQueries({
    queries: (triees.data ?? []).map((t) => ({ queryKey: ['tri', t.id], queryFn: () => apiTri.resultat(t.id) })),
  });
  const resultat = (id: string) => resultats.find((r) => r.data?.tournee_id === id)?.data;
  const codeTournee = new Map((triees.data ?? []).map((t) => [t.id, t.code]));

  return (
    <motion.div initial="cache" animate="visible" variants={cascade(0.08)}>
      <EnTetePage titre="Historique des tris" sousTitre="Tournées triées, valeur de chaque tournée et lots envoyés vers leur filière." />
      <BarreFiltres
        filtres={[
          { type: 'date', cle: 'date', valeur: filtres.date, etiquette: 'Date de la tournée' },
          {
            type: 'liste',
            cle: 'secteur',
            valeur: filtres.secteur,
            libelleTous: 'Tous les secteurs',
            options: (secteurs.data ?? []).map((s) => ({ valeur: s.id, libelle: LIBELLE_SECTEUR[s.code] })),
          },
        ]}
        surChangement={(cle, valeur) => setFiltres((f) => ({ ...f, [cle]: valeur }))}
        surEffacer={() => setFiltres({ date: '', secteur: '' })}
        resultat={triees.data && pluriel(triees.data.length, 'tournée triée', 'tournées triées')}
      />
      <Carte compacte className="mb-4">
        <TableauDonnees
          etiquette="Tournées triées"
          lignes={triees.data}
          erreur={triees.error}
          reessayer={() => void triees.refetch()}
          cleLigne={(t) => t.id}
          surClicLigne={(t) => navigate(`/tri/${t.id}/resultat`)}
          messageVide="Aucune tournée triée pour ces filtres."
          colonnes={[
            { cle: 'date', entete: 'Date', rendu: (t) => date(t.date), tri: (t) => t.date },
            { cle: 'code', entete: 'Tournée', rendu: (t) => <CodeObjet code={t.code} />, tri: (t) => t.code },
            { cle: 'site', entete: 'Site', rendu: (t) => <CodeObjet code={t.code_site} /> },
            { cle: 'poids', entete: 'Poids collecté', rendu: (t) => kg(t.poids_collecte_kg), tri: (t) => t.poids_collecte_kg },
            { cle: 'ecart', entete: 'Écart', rendu: (t) => pourcentage(resultat(t.id)?.ecart_pct) },
            {
              cle: 'contamination',
              entete: 'Contamination',
              rendu: (t) => (t.niveau_contamination ? LIBELLE_CONTAMINATION[t.niveau_contamination] : '—'),
            },
            { cle: 'valeur', entete: 'Valeur', rendu: (t) => (resultat(t.id) ? `${nombre(resultat(t.id)?.valeur_kg, 2)} pts/kg` : '…') },
            {
              cle: 'points',
              entete: 'Points',
              rendu: (t) => {
                const r = resultat(t.id);
                return r ? (
                  <span>
                    <b>{nombre(r.points_credites)}</b>
                    {r.points_en_attente > 0 && <span className="text-statut-attention-texte"> + {nombre(r.points_en_attente)} en attente</span>}
                  </span>
                ) : (
                  '…'
                );
              },
            },
          ]}
        />
      </Carte>
      <Carte titre="Lots triés" compacte>
        <TableauDonnees
          etiquette="Lots triés"
          lignes={lots.data?.filter((l) => codeTournee.has(l.tournee_id))}
          erreur={lots.error}
          cleLigne={(l) => l.id}
          messageVide="Aucun lot pour ces filtres."
          colonnes={[
            { cle: 'lot', entete: 'Lot', rendu: (l) => <CodeObjet code={l.code_lot} />, tri: (l) => l.code_lot },
            { cle: 'tournee', entete: 'Tournée', rendu: (l) => <CodeObjet code={codeTournee.get(l.tournee_id) ?? '…'} /> },
            {
              cle: 'categorie',
              entete: 'Catégorie',
              rendu: (l) => (
                <span className="inline-flex items-center gap-2">
                  <i className="size-2.5 rounded-full" style={{ background: COULEUR_CATEGORIE[l.categorie] }} />
                  {LIBELLE_CATEGORIE[l.categorie]}
                </span>
              ),
              tri: (l) => l.categorie,
            },
            { cle: 'poids', entete: 'Poids', rendu: (l) => kg(l.poids_kg, 1), tri: (l) => l.poids_kg },
            { cle: 'part', entete: 'Part', rendu: (l) => `${nombre(l.part_pct, 1)} %` },
            { cle: 'destination', entete: 'Destination', rendu: (l) => LIBELLE_DESTINATION[l.destination] },
          ]}
        />
      </Carte>
    </motion.div>
  );
}
