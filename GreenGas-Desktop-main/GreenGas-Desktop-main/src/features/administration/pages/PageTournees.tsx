/** A6 · Tournées : suivi par statut et planification. */
import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { StatutTournee } from '@/api/types';
import { BarreFiltres } from '@/components/greengas/BarreFiltres';
import { Carte } from '@/components/greengas/Carte';
import { CodeObjet } from '@/components/greengas/CodeObjet';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { Indicateur } from '@/components/greengas/Indicateur';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { TableauDonnees } from '@/components/greengas/TableauDonnees';
import { Button } from '@/components/ui/button';
import { useSecteurs } from '@/hooks/referentiel';
import { cascade } from '@/lib/animations';
import { date, kg, nombre, pluriel } from '@/lib/format';
import { LIBELLE_MOTIF_AFFECTATION, LIBELLE_SECTEUR, LIBELLE_STATUT_TOURNEE } from '@/lib/libelles';
import { STATUT_TOURNEE } from '@/lib/statuts';
import { ModalePlanification } from '../components/ModalePlanification';
import { useToutesTournees, useUtilisateurs } from '../hooks/requetes';

const STATUTS: StatutTournee[] = ['planifiee', 'en_cours', 'collectee', 'triee'];
const TITRES: Record<StatutTournee, string> = { planifiee: 'Planifiées', en_cours: 'En cours', collectee: 'À trier', triee: 'Triées' };

export function PageTournees() {
  const navigate = useNavigate();
  const tournees = useToutesTournees();
  const secteurs = useSecteurs();
  const collecteurs = useUtilisateurs({ role: 'collecteur' });
  const [filtres, setFiltres] = useState({ date: '', secteur: '', statut: '' });
  const [planification, setPlanification] = useState(false);

  const toutes = tournees.data ?? [];
  const visibles = tournees.data?.filter(
    (t) => (!filtres.date || t.date === filtres.date) && (!filtres.secteur || t.secteur_id === filtres.secteur) && (!filtres.statut || t.statut === filtres.statut),
  );

  return (
    <motion.div initial="cache" animate="visible" variants={cascade(0.07)}>
      <EnTetePage titre="Tournées" sousTitre="Planification et suivi des tournées de collecte." />
      <motion.div className="mb-4 grid grid-cols-4 gap-2.5" variants={cascade(0.06)}>
        {STATUTS.map((s) => (
          <Indicateur
            key={s}
            libelle={TITRES[s]}
            valeur={tournees.data ? toutes.filter((t) => t.statut === s).length : null}
            unite="tournées"
            pied={<PastilleStatut statut={STATUT_TOURNEE[s]} />}
          />
        ))}
      </motion.div>
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
          { type: 'liste', cle: 'statut', valeur: filtres.statut, libelleTous: 'Tous les statuts', options: STATUTS.map((s) => ({ valeur: s, libelle: LIBELLE_STATUT_TOURNEE[s] })) },
        ]}
        surChangement={(cle, valeur) => setFiltres((f) => ({ ...f, [cle]: valeur }))}
        surEffacer={() => setFiltres({ date: '', secteur: '', statut: '' })}
        resultat={visibles && `${pluriel(visibles.length, 'tournée')} sur ${nombre(toutes.length)}`}
        actions={
          <Button onClick={() => setPlanification(true)}>
            <Plus /> Planifier une tournée
          </Button>
        }
      />
      <Carte compacte>
        <TableauDonnees
          etiquette="Tournées"
          lignes={visibles}
          erreur={tournees.error}
          reessayer={() => void tournees.refetch()}
          cleLigne={(t) => t.id}
          surClicLigne={(t) => t.statut === 'triee' && navigate(`/tri/${t.id}/resultat`)}
          messageVide="Aucune tournée ne correspond à ces filtres."
          colonnes={[
            { cle: 'code', entete: 'Tournée', rendu: (t) => <CodeObjet code={t.code} />, tri: (t) => t.code },
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
            { cle: 'collecteur', entete: 'Collecteur', rendu: (t) => collecteurs.data?.find((u) => u.id === t.collecteur_id)?.nom ?? '—' },
            { cle: 'bacs', entete: 'Bacs', rendu: (t) => `${nombre(t.nb_bacs_collectes)} / ${nombre(t.nb_bacs)}`, tri: (t) => t.nb_bacs },
            { cle: 'poids', entete: 'Poids collecté', rendu: (t) => (t.poids_collecte_kg ? <b>{kg(t.poids_collecte_kg)}</b> : '—'), tri: (t) => t.poids_collecte_kg },
            { cle: 'statut', entete: 'Statut', rendu: (t) => <PastilleStatut statut={STATUT_TOURNEE[t.statut]} /> },
          ]}
        />
      </Carte>
      <ModalePlanification ouverte={planification} surFermer={() => setPlanification(false)} />
    </motion.div>
  );
}
