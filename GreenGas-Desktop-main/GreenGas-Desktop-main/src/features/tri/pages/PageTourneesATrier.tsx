/** T1 · Tournées à trier : tournées collectées (et triées du jour, pour revoir leur résultat). */
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, Truck } from 'lucide-react';
import type { Tournee } from '@/api/types';
import { useUtilisateur } from '@/auth/session';
import { LegendeProvenance } from '@/components/greengas/BadgeProvenance';
import { Carte } from '@/components/greengas/Carte';
import { CodeObjet } from '@/components/greengas/CodeObjet';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { TableauDonnees } from '@/components/greengas/TableauDonnees';
import { Button } from '@/components/ui/button';
import { Infobulle } from '@/components/ui/infobulle';
import { useSecteurs } from '@/hooks/referentiel';
import { cascade } from '@/lib/animations';
import { config } from '@/lib/config';
import { date, kg, nombre } from '@/lib/format';
import { LIBELLE_MOTIF_AFFECTATION, LIBELLE_SECTEUR } from '@/lib/libelles';
import { STATUT_TOURNEE } from '@/lib/statuts';
import { useCollectesAVerifier, useTournees } from '../hooks/requetes';

export function PageTourneesATrier() {
  const navigate = useNavigate();
  const u = useUtilisateur();
  const aTrier = useTournees({ statut: 'collectee' });
  const triees = useTournees({ statut: 'triee', date: config.dateTravail });
  const secteurs = useSecteurs();
  const aVerifier = useCollectesAVerifier();
  const tourneesAVerifier = new Set(aVerifier.data?.map((c) => c.tournee_id));

  const lignes: Tournee[] | undefined = aTrier.data && triees.data ? [...aTrier.data, ...triees.data] : undefined;
  const ouvrir = (t: Tournee) =>
    navigate(t.statut === 'triee' ? `/tri/${t.id}/resultat` : u.role === 'operateur_tri' ? `/tri/${t.id}/saisie` : `/tri`);

  return (
    <motion.div initial="cache" animate="visible" variants={cascade()}>
      <EnTetePage titre="Tournées à trier" sousTitre="Choisissez une tournée collectée, puis saisissez les poids triés." />
      <Carte compacte>
        <TableauDonnees
          etiquette="Tournées à trier"
          lignes={lignes}
          chargement={aTrier.isPending || triees.isPending}
          erreur={aTrier.error ?? triees.error}
          reessayer={() => void aTrier.refetch()}
          cleLigne={(t) => t.id}
          surClicLigne={(t) => (t.statut === 'triee' || u.role === 'operateur_tri') && ouvrir(t)}
          messageVide="Aucune tournée en attente de tri."
          colonnes={[
            {
              cle: 'code',
              entete: 'Tournée',
              rendu: (t) => (
                <span className="inline-flex items-center gap-2">
                  <CodeObjet code={t.code} />
                  {tourneesAVerifier.has(t.id) && (
                    <Infobulle contenu="Cette tournée contient une collecte à vérifier : ses points resteront en attente.">
                      <span className="inline-flex items-center gap-1 rounded-full bg-statut-attention-fond px-2 py-0.5 text-[11.5px] font-bold text-statut-attention-texte">
                        <Clock className="size-3" /> à vérifier
                      </span>
                    </Infobulle>
                  )}
                </span>
              ),
              tri: (t) => t.code,
            },
            { cle: 'date', entete: 'Date', rendu: (t) => date(t.date), tri: (t) => t.date },
            {
              cle: 'secteur',
              entete: 'Secteur',
              rendu: (t) => {
                const s = secteurs.data?.find((x) => x.id === t.secteur_id);
                return s ? LIBELLE_SECTEUR[s.code] : '…';
              },
            },
            {
              cle: 'site',
              entete: 'Site',
              rendu: (t) => (
                <span className="inline-flex items-center gap-1.5">
                  <CodeObjet code={t.code_site} />
                  <small className="text-texte-doux">{LIBELLE_MOTIF_AFFECTATION[t.motif_affectation]}</small>
                </span>
              ),
            },
            { cle: 'bacs', entete: 'Bacs', rendu: (t) => nombre(t.nb_bacs), tri: (t) => t.nb_bacs },
            { cle: 'poids', entete: 'Poids collecté', rendu: (t) => <b>{kg(t.poids_collecte_kg)}</b>, tri: (t) => t.poids_collecte_kg },
            { cle: 'statut', entete: 'Statut', rendu: (t) => <PastilleStatut statut={STATUT_TOURNEE[t.statut]} /> },
            {
              cle: 'action',
              entete: '',
              alignement: 'droite',
              rendu: (t) =>
                t.statut === 'triee' ? (
                  <Button variante="contour" taille="petite" onClick={(e) => { e.stopPropagation(); ouvrir(t); }}>
                    Voir le résultat
                  </Button>
                ) : u.role === 'operateur_tri' ? (
                  <Button taille="petite" onClick={(e) => { e.stopPropagation(); ouvrir(t); }}>
                    <Truck /> Trier
                  </Button>
                ) : (
                  <small className="text-texte-doux">En attente de tri</small>
                ),
            },
          ]}
        />
      </Carte>
      <LegendeProvenance className="mt-[18px]" />
    </motion.div>
  );
}
