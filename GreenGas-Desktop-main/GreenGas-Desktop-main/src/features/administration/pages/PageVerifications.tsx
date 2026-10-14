/**
 * A3 · Vérifications : file des cas suspects, du plus ancien au plus récent, un onglet par type.
 * Chaque décision est commentée et inscrite au journal par le serveur.
 * Contrat 1.3.0 : les comptes en attente sont ceux du personnel inscrit lui-même (opérateur de tri,
 * responsable méthanisation), validés par l'administrateur seulement. Le référent voit les autres
 * signaux de sa résidence.
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircleCheck, CircleX, ClipboardCheck } from 'lucide-react';
import type { ElementVerification, Role, TypeVerification } from '@/api/types';
import { useUtilisateur } from '@/auth/session';
import { Carte } from '@/components/greengas/Carte';
import { CodeObjet } from '@/components/greengas/CodeObjet';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { ModaleConfirmation } from '@/components/greengas/ModaleConfirmation';
import { useNotifications } from '@/components/greengas/Notifications';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { TableauDonnees, type Colonne } from '@/components/greengas/TableauDonnees';
import { Button } from '@/components/ui/button';
import { Onglets } from '@/components/ui/onglets';
import { cascade } from '@/lib/animations';
import { dateHeure, telephone, TIRET_VIDE } from '@/lib/format';
import { LIBELLE_ROLE, LIBELLE_TYPE_VERIFICATION } from '@/lib/libelles';
import { apparence } from '@/lib/statuts';
import { useDeciderCollecte, useDeciderCompte, useListeVerifications } from '../hooks/requetes';

type Decision =
  | { element: ElementVerification; type: 'collecte'; decision: 'valider_points' | 'annuler_points' }
  | { element: ElementVerification; type: 'compte'; decision: 'valider' | 'refuser' };

const ORDRE: TypeVerification[] = ['compte_en_attente', 'collecte_a_verifier', 'bac_surinscrit', 'scan_hors_zone', 'scan_non_localise'];
const detail = (e: ElementVerification, cle: string) => (e.details as Record<string, unknown>)[cle];

export function PageVerifications() {
  const u = useUtilisateur();
  const admin = u.role === 'administrateur';
  const navigate = useNavigate();
  const { succes } = useNotifications();
  const verifications = useListeVerifications();
  const deciderCollecte = useDeciderCollecte();
  const deciderCompte = useDeciderCompte();
  // Une notification peut ouvrir directement un onglet (?onglet=compte_en_attente).
  const [params] = useSearchParams();
  const [onglet, setOnglet] = useState<TypeVerification | 'tous'>(
    (ORDRE as string[]).includes(params.get('onglet') ?? '') ? (params.get('onglet') as TypeVerification) : 'tous',
  );
  const [decision, setDecision] = useState<Decision | null>(null);

  const elements = verifications.data ?? [];
  const types = ORDRE.filter((t) => elements.some((e) => e.type === t));
  const visibles = onglet === 'tous' ? elements : elements.filter((e) => e.type === onglet);

  async function confirmer(commentaire: string) {
    if (!decision) return;
    if (decision.type === 'collecte') {
      await deciderCollecte.mutateAsync({ id: decision.element.objet_id, decision: decision.decision, commentaire });
    } else {
      await deciderCompte.mutateAsync({ id: decision.element.objet_id, decision: decision.decision, commentaire });
    }
    succes('Décision enregistrée dans le journal');
  }

  const titreDecision = decision
    ? {
        valider_points: 'Valider les points',
        annuler_points: 'Annuler les points',
        valider: 'Valider le compte',
        refuser: 'Refuser le compte',
      }[decision.decision]
    : '';

  const actionsCompte = (e: ElementVerification) =>
    admin && (
      <>
        <Button taille="petite" onClick={() => setDecision({ element: e, type: 'compte', decision: 'valider' })}>
          <CircleCheck /> Valider
        </Button>
        <Button variante="contour" taille="petite" onClick={() => setDecision({ element: e, type: 'compte', decision: 'refuser' })}>
          <CircleX /> Refuser
        </Button>
      </>
    );

  // Onglet « Compte en attente » : une ligne par membre du personnel qui attend un administrateur.
  const colonnesComptes: Colonne<ElementVerification>[] = [
    { cle: 'nom', entete: 'Nom', rendu: (e) => <span className="font-semibold">{String(detail(e, 'nom') ?? e.libelle)}</span> },
    { cle: 'role', entete: 'Rôle', rendu: (e) => LIBELLE_ROLE[detail(e, 'role') as Role] ?? TIRET_VIDE },
    { cle: 'telephone', entete: 'Téléphone', rendu: (e) => telephone(detail(e, 'telephone') as string | undefined) },
    { cle: 'email', entete: 'E-mail', rendu: (e) => (detail(e, 'email') as string | null | undefined) ?? TIRET_VIDE },
    { cle: 'date', entete: 'Demande du', rendu: (e) => dateHeure(e.date), tri: (e) => e.date },
    {
      cle: 'actions',
      entete: '',
      alignement: 'droite',
      rendu: (e) => <span className="inline-flex flex-wrap justify-end gap-2">{actionsCompte(e)}</span>,
    },
  ];

  const colonnesFile: Colonne<ElementVerification>[] = [
    {
      cle: 'bac',
      entete: 'Bac',
      rendu: (e) => {
        const code = detail(e, 'code_bac') as string | undefined;
        return code ? <CodeObjet code={code} vers={admin ? `/admin/tracabilite?bac=${code}` : undefined} /> : TIRET_VIDE;
      },
    },
    { cle: 'libelle', entete: 'Cas', rendu: (e) => <span className="font-semibold">{e.libelle}</span> },
    {
      cle: 'type',
      entete: 'Type',
      rendu: (e) => <PastilleStatut statut={apparence('attention', LIBELLE_TYPE_VERIFICATION[e.type])} />,
    },
    { cle: 'date', entete: 'Depuis', rendu: (e) => dateHeure(e.date), tri: (e) => e.date },
    {
      cle: 'actions',
      entete: '',
      alignement: 'droite',
      rendu: (e) => (
        <span className="inline-flex flex-wrap justify-end gap-2">
          {e.type === 'collecte_a_verifier' && admin && (
            <>
              <Button taille="petite" onClick={() => setDecision({ element: e, type: 'collecte', decision: 'valider_points' })}>
                <CircleCheck /> Valider les points
              </Button>
              <Button variante="contour" taille="petite" onClick={() => setDecision({ element: e, type: 'collecte', decision: 'annuler_points' })}>
                <CircleX /> Annuler les points
              </Button>
            </>
          )}
          {e.type === 'compte_en_attente' && actionsCompte(e)}
          {e.type === 'bac_surinscrit' && admin && (
            <Button variante="contour" taille="petite" onClick={() => navigate(`/admin/utilisateurs?bac=${String(detail(e, 'bac_id'))}`)}>
              Voir les comptes du bac
            </Button>
          )}
          {(e.type === 'scan_hors_zone' || e.type === 'scan_non_localise') && (
            <small className="text-texte-doux">Le scan ne compte pas dans la répartition</small>
          )}
        </span>
      ),
    },
  ];

  return (
    <motion.div initial="cache" animate="visible" variants={cascade()}>
      <EnTetePage
        titre="Vérifications"
        sousTitre={
          admin
            ? 'Validez les comptes du personnel et traitez les cas suspects : chaque décision est journalisée.'
            : 'Signaux de votre résidence : collectes à vérifier, scans hors zone, bac surinscrit.'
        }
      />
      {types.length > 1 && (
        <Onglets
          className="mb-4"
          etiquette="Types de vérification"
          valeur={onglet}
          surChangement={setOnglet}
          onglets={[
            { valeur: 'tous', libelle: 'Tout', compteur: elements.length },
            ...types.map((t) => ({
              valeur: t,
              libelle: LIBELLE_TYPE_VERIFICATION[t],
              compteur: elements.filter((e) => e.type === t).length,
            })),
          ]}
        />
      )}
      <Carte compacte>
        <TableauDonnees
          key={onglet === 'compte_en_attente' ? 'comptes' : 'file'}
          etiquette={onglet === 'compte_en_attente' ? 'Comptes du personnel en attente' : 'File de vérification'}
          lignes={verifications.data ? visibles : undefined}
          erreur={verifications.error}
          reessayer={() => void verifications.refetch()}
          cleLigne={(e) => `${e.type}-${e.objet_id}`}
          messageVide="Rien à vérifier pour le moment."
          colonnes={onglet === 'compte_en_attente' ? colonnesComptes : colonnesFile}
        />
      </Carte>

      <ModaleConfirmation
        ouverte={!!decision}
        surFermer={() => setDecision(null)}
        titre={titreDecision}
        icone={<ClipboardCheck className="mt-0.5 size-5 text-vert" />}
        libelleConfirmer={titreDecision}
        danger={decision?.decision === 'annuler_points' || decision?.decision === 'refuser'}
        commentaire="obligatoire"
        surConfirmer={confirmer}
      >
        {decision && (
          <>
            <p className="font-semibold">{decision.element.libelle}</p>
            <p className="mt-1 text-texte-doux">
              {decision.type === 'collecte'
                ? detail(decision.element, 'tournee_triee')
                  ? 'Les points en attente des citoyens de ce bac seront crédités ou annulés.'
                  : 'La décision s’appliquera aux points calculés lors du tri de la tournée.'
                : decision.decision === 'valider'
                  ? 'La personne pourra se connecter au Control Center dès la validation.'
                  : 'La connexion restera impossible pour ce compte.'}{' '}
              Cette décision est définitive et inscrite au journal.
            </p>
          </>
        )}
      </ModaleConfirmation>
    </motion.div>
  );
}
