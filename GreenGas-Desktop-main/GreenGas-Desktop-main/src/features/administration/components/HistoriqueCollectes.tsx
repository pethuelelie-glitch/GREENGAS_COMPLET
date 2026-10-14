/** Historique des collectes d'un bac : courbe des poids nets et tableau (statut de contrôle renvoyé par l'API). */
import type { Collecte, Tournee } from '@/api/types';
import { Carte } from '@/components/greengas/Carte';
import { CodeObjet } from '@/components/greengas/CodeObjet';
import { CourbeHistorique } from '@/components/greengas/Courbes';
import { BadgeProvenance } from '@/components/greengas/BadgeProvenance';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { TableauDonnees } from '@/components/greengas/TableauDonnees';
import { date, jourMois, kg, nombre } from '@/lib/format';
import { STATUT_CONTROLE } from '@/lib/statuts';

const SIGNALEE = new Set(['a_verifier', 'points_valides', 'points_annules']);

export function HistoriqueCollectes({
  collectes,
  tournees,
  selection,
  surSelection,
  avecTableau = true,
}: {
  /** Collectes du bac, de la plus récente à la plus ancienne. */
  collectes: Collecte[];
  tournees?: Map<string, Pick<Tournee, 'code'>>;
  selection?: string;
  surSelection?: (collecteId: string) => void;
  avecTableau?: boolean;
}) {
  const validees = collectes.filter((c) => c.statut === 'validee' && c.poids_net_kg != null);
  const points = validees
    .slice(0, 6)
    .reverse()
    .map((c) => ({
      etiquette: jourMois(c.date_validation ?? c.date_ouverture),
      valeur: c.poids_net_kg as number,
      couleur: c.statut_controle && SIGNALEE.has(c.statut_controle) ? 'var(--statut-attention)' : undefined,
      detail: c.statut_controle ? STATUT_CONTROLE[c.statut_controle].libelle : undefined,
    }));
  const source = validees[0]?.source;

  return (
    <Carte titre="Historique des collectes du bac" action={source && <BadgeProvenance statut={source === 'capteur' ? 'mesure' : 'simule'} />}>
      {points.length > 0 ? (
        <>
          <CourbeHistorique points={points} unite="kg" />
          <p className="text-[13px] text-texte-doux">
            Poids net par collecte, en kg. En orange : collecte signalée « à vérifier » (puis décidée par l'administrateur).
          </p>
        </>
      ) : (
        <p className="text-[13px] text-texte-doux">Pas encore de collecte pour ce bac.</p>
      )}
      {avecTableau && validees.length > 0 && (
        <div className="mt-3">
          <TableauDonnees
            etiquette="Collectes du bac"
            lignes={validees}
            cleLigne={(c) => c.id}
            surClicLigne={surSelection ? (c) => surSelection(c.id) : undefined}
            ligneSurlignee={(c) => c.id === selection}
            colonnes={[
              { cle: 'date', entete: 'Date', rendu: (c) => date(c.date_validation), tri: (c) => c.date_validation },
              {
                cle: 'tournee',
                entete: 'Tournée',
                rendu: (c) => <CodeObjet code={tournees?.get(c.tournee_id)?.code ?? '…'} />,
              },
              { cle: 'poids', entete: 'Poids net', rendu: (c) => <b>{kg(c.poids_net_kg, 1)}</b>, tri: (c) => c.poids_net_kg },
              { cle: 'scans', entete: 'Scans', rendu: (c) => nombre(c.scans_valides), tri: (c) => c.scans_valides },
              { cle: 'kps', entete: 'kg par scan', rendu: (c) => nombre(c.kg_par_scan, 2) },
              {
                cle: 'controle',
                entete: 'Contrôle',
                rendu: (c) => (c.statut_controle ? <PastilleStatut statut={STATUT_CONTROLE[c.statut_controle]} /> : '—'),
              },
            ]}
          />
        </div>
      )}
    </Carte>
  );
}
