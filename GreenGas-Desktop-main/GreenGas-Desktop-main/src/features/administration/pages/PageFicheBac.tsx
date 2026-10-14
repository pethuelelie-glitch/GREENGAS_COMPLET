/** A5 · Fiche d'un bac : QR code imprimable, informations, citoyens rattachés, historique des collectes. */
import { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Power, Printer, Waypoints } from 'lucide-react';
import { useUtilisateur } from '@/auth/session';
import { LegendeProvenance } from '@/components/greengas/BadgeProvenance';
import { Carte } from '@/components/greengas/Carte';
import { CodeObjet } from '@/components/greengas/CodeObjet';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { EtatChargementPage, EtatErreur } from '@/components/greengas/Etats';
import { ModaleConfirmation } from '@/components/greengas/ModaleConfirmation';
import { useNotifications } from '@/components/greengas/Notifications';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { QrCodeBac } from '@/components/greengas/QrCodeBac';
import { Button } from '@/components/ui/button';
import { useSecteurs, useVerifications } from '@/hooks/referentiel';
import { cascade } from '@/lib/animations';
import { dateHeure, kg, nombre, telephone } from '@/lib/format';
import { LIBELLE_SECTEUR } from '@/lib/libelles';
import { apparence, STATUT_BAC, STATUT_COMPTE, STATUT_VALIDATION } from '@/lib/statuts';
import { HistoriqueCollectes } from '../components/HistoriqueCollectes';
import { ModaleBac } from '../components/ModaleBac';
import { useBac, useCollectes, useModifierBac, useToutesTournees, useUtilisateurs } from '../hooks/requetes';

export function PageFicheBac() {
  const { bacId } = useParams();
  const navigate = useNavigate();
  const u = useUtilisateur();
  const { succes } = useNotifications();
  const bac = useBac(bacId);
  const secteurs = useSecteurs();
  const citoyens = useUtilisateurs({ bac_id: bacId }, !!bacId);
  const collectes = useCollectes({ bac_id: bacId }, !!bacId);
  const tournees = useToutesTournees();
  const verifications = useVerifications(u.role === 'administrateur');
  const modifier = useModifierBac();
  const [modale, setModale] = useState<'edition' | 'statut' | null>(null);

  if (bac.error) return <EtatErreur erreur={bac.error} reessayer={() => void bac.refetch()} />;
  if (!bac.data) return <EtatChargementPage />;
  const b = bac.data;
  const secteur = secteurs.data?.find((s) => s.id === b.secteur_id);
  const surinscrit = verifications.data?.some((v) => v.type === 'bac_surinscrit' && v.objet_id === b.id);
  const listeCitoyens = (citoyens.data ?? []).filter((c) => c.role === 'citoyen');

  return (
    <motion.div initial="cache" animate="visible" variants={cascade(0.08)}>
      <EnTetePage
        titre={
          <>
            Bac <span className="font-mono">{b.code}</span>
          </>
        }
        sousTitre={`${b.residence} · secteur ${secteur ? LIBELLE_SECTEUR[secteur.code] : '…'}`}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <Button variante="contour" onClick={() => navigate('/admin/bacs')}>
          <ArrowLeft /> Tous les bacs
        </Button>
        <span className="flex-1" />
        <Button variante="contour" asChild>
          <Link to={`/admin/tracabilite?bac=${b.code}`}>
            <Waypoints /> Voir la traçabilité
          </Link>
        </Button>
        <Button variante="contour" onClick={() => setModale('edition')}>
          <Pencil /> Modifier
        </Button>
        <Button variante={b.statut === 'actif' ? 'danger' : 'principal'} onClick={() => setModale('statut')}>
          <Power /> {b.statut === 'actif' ? 'Désactiver le bac' : 'Réactiver le bac'}
        </Button>
      </div>

      <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-4">
        <Carte titre="QR code du bac" className="flex flex-col items-center text-center">
          <div className="zone-impression flex flex-col items-center">
            <motion.div initial={{ scale: 0.85, opacity: 0, rotate: -4 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.2 }}>
              <QrCodeBac code={b.code} />
            </motion.div>
            <CodeObjet code={b.code} className="my-2.5 text-sm" />
            <p className="hidden text-sm print:block">{b.residence}</p>
          </div>
          <p className="text-[13px] text-texte-doux">Le QR contient uniquement le code du bac, jamais une adresse web.</p>
          <Button variante="contour" className="mt-3" onClick={() => window.print()}>
            <Printer /> Imprimer le QR
          </Button>
        </Carte>
        <Carte titre="Informations">
          <dl className="text-[13.5px]">
            {[
              ['Résidence', b.residence],
              ['Secteur', secteur ? LIBELLE_SECTEUR[secteur.code] : '…'],
              ['Foyers déclarés', nombre(b.nb_foyers_declares)],
              ['Citoyens validés', nombre(b.nb_citoyens_valides)],
              ['Scans depuis la dernière collecte', nombre(b.scans_valides_periode)],
              ['Tare', kg(b.tare_kg, 1)],
              ['Capacité', kg(b.capacite_kg)],
              ['Dernière collecte', dateHeure(b.date_derniere_collecte)],
              ['Statut', <PastilleStatut key="s" statut={STATUT_BAC[b.statut]} />],
            ].map(([l, v]) => (
              <div key={String(l)} className="flex items-center justify-between gap-3 border-b border-bordure py-2 last:border-0">
                <dt className="text-texte-doux">{l}</dt>
                <dd className="font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </Carte>
        <Carte
          titre={`Citoyens rattachés (${listeCitoyens.length})`}
          action={surinscrit && <PastilleStatut statut={apparence('attention', 'Surinscrit')} />}
        >
          {listeCitoyens.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-texte-doux">Aucun citoyen inscrit sur ce bac.</p>
          ) : (
            <ul className="text-[13.5px]">
              {listeCitoyens.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 border-b border-bordure py-2 last:border-0">
                  <span>
                    {c.nom}
                    <br />
                    <small className="font-mono text-texte-doux">{telephone(c.telephone)}</small>
                  </span>
                  {!c.actif ? (
                    <PastilleStatut statut={STATUT_COMPTE.desactive} />
                  ) : c.profil_citoyen ? (
                    <PastilleStatut statut={STATUT_VALIDATION[c.profil_citoyen.statut_validation]} />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <Button variante="contour" taille="petite" className="mt-2.5" onClick={() => navigate(`/admin/utilisateurs?bac=${b.id}`)}>
            Gérer ces comptes
          </Button>
        </Carte>
      </div>

      <div className="mt-4">
        <HistoriqueCollectes
          collectes={collectes.data ?? []}
          tournees={new Map((tournees.data ?? []).map((t) => [t.id, t]))}
          surSelection={() => navigate(`/admin/tracabilite?bac=${b.code}`)}
        />
      </div>
      <LegendeProvenance className="mt-[18px]" />

      <ModaleBac ouverte={modale === 'edition'} surFermer={() => setModale(null)} bac={b} />
      <ModaleConfirmation
        ouverte={modale === 'statut'}
        surFermer={() => setModale(null)}
        titre={b.statut === 'actif' ? `Désactiver ${b.code}` : `Réactiver ${b.code}`}
        libelleConfirmer="Confirmer"
        danger={b.statut === 'actif'}
        surConfirmer={async () => {
          await modifier.mutateAsync({ id: b.id, corps: { statut: b.statut === 'actif' ? 'inactif' : 'actif' } });
          succes(b.statut === 'actif' ? 'Bac désactivé et journalisé' : 'Bac réactivé et journalisé', b.code);
        }}
      >
        {b.statut === 'actif'
          ? "Le bac n'acceptera plus de scans et ne sera plus proposé dans les tournées. Son historique est conservé."
          : 'Le bac acceptera de nouveau les scans et pourra être ajouté aux tournées.'}
      </ModaleConfirmation>
    </motion.div>
  );
}
