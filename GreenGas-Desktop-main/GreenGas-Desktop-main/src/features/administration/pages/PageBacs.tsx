/** A5 · Bacs : vue du parc, recherche et filtres, tableau des bacs, secteurs (site normal et de repli). */
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { Collecte } from '@/api/types';
import { BadgeProvenance, LegendeProvenance } from '@/components/greengas/BadgeProvenance';
import { BarreFiltres } from '@/components/greengas/BarreFiltres';
import { Carte } from '@/components/greengas/Carte';
import { CodeObjet } from '@/components/greengas/CodeObjet';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { Anneau, BarresHorizontales } from '@/components/greengas/Graphiques';
import { Indicateur } from '@/components/greengas/Indicateur';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { TableauDonnees } from '@/components/greengas/TableauDonnees';
import { Button } from '@/components/ui/button';
import { useSecteurs, useVerifications } from '@/hooks/referentiel';
import { cascade } from '@/lib/animations';
import { couleurSerie } from '@/lib/couleurs';
import { date, kg, nombre, pluriel } from '@/lib/format';
import { LIBELLE_SECTEUR, LIBELLE_STATUT_BAC } from '@/lib/libelles';
import { apparence, STATUT_BAC, STATUT_CONTROLE } from '@/lib/statuts';
import { ModaleBac } from '../components/ModaleBac';
import { TableauSecteurs } from '../components/TableauSecteurs';
import { useBacs, useCollectes } from '../hooks/requetes';

export function PageBacs() {
  const navigate = useNavigate();
  const bacs = useBacs();
  const secteurs = useSecteurs();
  const collectes = useCollectes();
  const verifications = useVerifications();
  const [filtres, setFiltres] = useState({ q: '', secteur: '', statut: '' });
  const [creation, setCreation] = useState(false);

  const tous = bacs.data ?? [];
  const surinscrits = new Set(verifications.data?.filter((v) => v.type === 'bac_surinscrit').map((v) => v.objet_id));
  const derniereCollecte = useMemo(() => {
    const m = new Map<string, Collecte>();
    for (const c of collectes.data ?? []) if (c.statut === 'validee' && !m.has(c.bac_id)) m.set(c.bac_id, c);
    return m;
  }, [collectes.data]);
  const aVerifier = tous.filter((b) => derniereCollecte.get(b.id)?.statut_controle === 'a_verifier').length;
  // Poids cumulé des 5 dernières collectes de chaque bac (simple regroupement des valeurs de l'API, pour le classement).
  const contributeurs = tous
    .map((b) => ({
      code: b.code,
      total: (collectes.data ?? []).filter((c) => c.bac_id === b.id && c.statut === 'validee').slice(0, 5).reduce((s, c) => s + (c.poids_net_kg ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const q = filtres.q.trim().toLowerCase();
  const visibles = bacs.data?.filter(
    (b) =>
      (!filtres.secteur || b.secteur_id === filtres.secteur) &&
      (!filtres.statut || b.statut === filtres.statut) &&
      (!q || `${b.code} ${b.residence}`.toLowerCase().includes(q)),
  );
  const nomSecteur = (id: string) => {
    const s = secteurs.data?.find((x) => x.id === id);
    return s ? LIBELLE_SECTEUR[s.code] : '…';
  };

  return (
    <motion.div initial="cache" animate="visible" variants={cascade(0.07)}>
      <EnTetePage titre="Bacs" sousTitre="Tous les bacs installés, leurs citoyens et leurs dernières collectes." />
      <div className="mb-4 grid grid-cols-3 gap-4">
        <Carte titre="Bacs par secteur">
          <Anneau
            centre={tous.length}
            sousTitre="bacs"
            segments={(secteurs.data ?? []).map((s, i) => ({
              libelle: LIBELLE_SECTEUR[s.code],
              valeur: tous.filter((b) => b.secteur_id === s.id).length,
              couleur: couleurSerie(i),
            }))}
          />
        </Carte>
        <Carte titre="Bacs les plus contributeurs">
          <BarresHorizontales
            barres={contributeurs.map((c) => ({ libelle: c.code, valeur: c.total, couleur: 'var(--vert)', texte: kg(c.total) }))}
          />
          <p className="mt-2.5 flex items-center gap-2 text-[13px] text-texte-doux">
            Poids net cumulé sur les 5 dernières collectes <BadgeProvenance statut="simule" />
          </p>
        </Carte>
        <Carte titre="État du parc">
          <motion.div className="grid grid-cols-2 gap-2.5" initial="cache" animate="visible" variants={cascade(0.06, 0.2)}>
            <Indicateur discret libelle="Bacs actifs" valeur={tous.filter((b) => b.statut === 'actif').length} unite={`/ ${tous.length}`} />
            <Indicateur
              discret
              libelle="À vérifier"
              valeur={aVerifier}
              unite={aVerifier > 1 ? 'collectes' : 'collecte'}
              pied={<PastilleStatut statut={aVerifier ? STATUT_CONTROLE.a_verifier : STATUT_CONTROLE.normal} />}
            />
            <Indicateur discret libelle="Citoyens validés" valeur={tous.reduce((s, b) => s + b.nb_citoyens_valides, 0)} unite="comptes" />
            <Indicateur
              discret
              libelle="Bacs surinscrits"
              valeur={surinscrits.size}
              unite={surinscrits.size > 1 ? 'bacs' : 'bac'}
              pied={<PastilleStatut statut={surinscrits.size ? STATUT_CONTROLE.a_verifier : STATUT_CONTROLE.normal} />}
            />
          </motion.div>
        </Carte>
      </div>

      <BarreFiltres
        filtres={[
          { type: 'recherche', cle: 'q', valeur: filtres.q, placeholder: 'Rechercher un code ou une résidence' },
          {
            type: 'liste',
            cle: 'secteur',
            valeur: filtres.secteur,
            libelleTous: 'Tous les secteurs',
            options: (secteurs.data ?? []).map((s) => ({ valeur: s.id, libelle: LIBELLE_SECTEUR[s.code] })),
          },
          {
            type: 'liste',
            cle: 'statut',
            valeur: filtres.statut,
            libelleTous: 'Tous les statuts',
            options: (['actif', 'inactif'] as const).map((s) => ({ valeur: s, libelle: LIBELLE_STATUT_BAC[s] })),
          },
        ]}
        surChangement={(cle, valeur) => setFiltres((f) => ({ ...f, [cle]: valeur }))}
        surEffacer={() => setFiltres({ q: '', secteur: '', statut: '' })}
        resultat={visibles && `${pluriel(visibles.length, 'bac')} sur ${nombre(tous.length)}`}
        actions={
          <Button onClick={() => setCreation(true)}>
            <Plus /> Nouveau bac
          </Button>
        }
      />
      <Carte compacte>
        <TableauDonnees
          etiquette="Bacs"
          lignes={visibles}
          erreur={bacs.error}
          reessayer={() => void bacs.refetch()}
          cleLigne={(b) => b.id}
          surClicLigne={(b) => navigate(`/admin/bacs/${b.id}`)}
          messageVide="Aucun bac ne correspond à ces filtres."
          colonnes={[
            { cle: 'code', entete: 'Bac', rendu: (b) => <CodeObjet code={b.code} />, tri: (b) => b.code },
            { cle: 'residence', entete: 'Résidence', rendu: (b) => b.residence, tri: (b) => b.residence },
            { cle: 'secteur', entete: 'Secteur', rendu: (b) => nomSecteur(b.secteur_id) },
            { cle: 'foyers', entete: 'Foyers', rendu: (b) => nombre(b.nb_foyers_declares), tri: (b) => b.nb_foyers_declares },
            {
              cle: 'citoyens',
              entete: 'Citoyens validés',
              tri: (b) => b.nb_citoyens_valides,
              rendu: (b) => (
                <span className="inline-flex items-center gap-2">
                  {nombre(b.nb_citoyens_valides)}
                  {surinscrits.has(b.id) && <PastilleStatut statut={apparence('attention', 'Surinscrit')} />}
                </span>
              ),
            },
            { cle: 'scans', entete: 'Scans période', rendu: (b) => nombre(b.scans_valides_periode), tri: (b) => b.scans_valides_periode },
            {
              cle: 'derniere',
              entete: 'Dernière collecte',
              tri: (b) => b.date_derniere_collecte,
              rendu: (b) => {
                const c = derniereCollecte.get(b.id);
                return c ? (
                  <span>
                    {date(c.date_validation)} · <b>{kg(c.poids_net_kg, 1)}</b>
                  </span>
                ) : (
                  '—'
                );
              },
            },
            {
              cle: 'controle',
              entete: 'Contrôle',
              rendu: (b) => {
                const s = derniereCollecte.get(b.id)?.statut_controle;
                return s ? <PastilleStatut statut={STATUT_CONTROLE[s]} /> : '—';
              },
            },
            { cle: 'statut', entete: 'Statut', rendu: (b) => <PastilleStatut statut={STATUT_BAC[b.statut]} /> },
            {
              cle: 'fiche',
              entete: '',
              alignement: 'droite',
              rendu: (b) => (
                <Button variante="contour" taille="petite" onClick={(e) => { e.stopPropagation(); navigate(`/admin/bacs/${b.id}`); }}>
                  Fiche
                </Button>
              ),
            },
          ]}
        />
      </Carte>

      <TableauSecteurs />
      <LegendeProvenance className="mt-[18px]" />
      <ModaleBac ouverte={creation} surFermer={() => setCreation(false)} surCree={(b) => navigate(`/admin/bacs/${b.id}`)} />
    </motion.div>
  );
}
