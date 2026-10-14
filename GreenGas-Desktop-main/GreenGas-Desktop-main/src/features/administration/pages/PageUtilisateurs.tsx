/**
 * A4 · Utilisateurs : citoyens, collecteurs préenregistrés et personnel (filtres en paramètres d'URL).
 * Contrat 1.3.0 : l'état du compte est `Utilisateur.statut_validation` ; seul le personnel inscrit lui-même
 * peut être en attente, et seul l'administrateur le valide ou le refuse.
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { CircleCheck, CircleX, ClipboardCheck, Pencil, Plus } from 'lucide-react';
import type { Role, Utilisateur } from '@/api/types';
import { BarreFiltres } from '@/components/greengas/BarreFiltres';
import { Carte } from '@/components/greengas/Carte';
import { CodeObjet } from '@/components/greengas/CodeObjet';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { ModaleConfirmation } from '@/components/greengas/ModaleConfirmation';
import { Anneau } from '@/components/greengas/Graphiques';
import { useNotifications } from '@/components/greengas/Notifications';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { TableauDonnees } from '@/components/greengas/TableauDonnees';
import { Button } from '@/components/ui/button';
import { cascade } from '@/lib/animations';
import { COULEUR, couleurSerie } from '@/lib/couleurs';
import { nombre, pluriel, telephone } from '@/lib/format';
import { LIBELLE_ROLE, LIBELLE_ROLE_COURT } from '@/lib/libelles';
import { STATUT_COMPTE, STATUT_VALIDATION } from '@/lib/statuts';
import { ModaleUtilisateur } from '../components/ModaleUtilisateur';
import { useBacs, useDeciderCompte, useUtilisateurs } from '../hooks/requetes';

const ROLES = Object.keys(LIBELLE_ROLE) as Role[];
/** Comptes qui passent par la validation d'un administrateur (personnel inscrit lui-même). */
const ROLES_PERSONNEL: Role[] = ['operateur_tri', 'responsable_methanisation'];
const enAttente = (u: Utilisateur) => u.statut_validation === 'en_attente' && ROLES_PERSONNEL.includes(u.role);

export function PageUtilisateurs() {
  const [params, setParams] = useSearchParams();
  const filtres = { q: params.get('q') ?? '', role: params.get('role') ?? '', statut: params.get('statut') ?? '', bac: params.get('bac') ?? '' };
  const utilisateurs = useUtilisateurs();
  const bacs = useBacs();
  const decider = useDeciderCompte();
  const { succes } = useNotifications();
  const [modale, setModale] = useState<{ utilisateur?: Utilisateur; role?: Role } | null>(null);
  const [decision, setDecision] = useState<{ utilisateur: Utilisateur; decision: 'valider' | 'refuser' } | null>(null);

  const tous = utilisateurs.data ?? [];
  const q = filtres.q.trim().toLowerCase();
  const visibles = utilisateurs.data?.filter(
    (u) =>
      (!filtres.role || u.role === filtres.role) &&
      (!filtres.statut || (filtres.statut === 'desactive' ? !u.actif : u.statut_validation === filtres.statut)) &&
      (!filtres.bac || u.profil_citoyen?.bac_id === filtres.bac) &&
      (!q || `${u.nom} ${u.telephone}`.toLowerCase().includes(q)),
  );

  const changerFiltre = (cle: string, valeur: string) => {
    const suivant = new URLSearchParams(params);
    if (valeur) suivant.set(cle, valeur);
    else suivant.delete(cle);
    setParams(suivant, { replace: true });
  };

  async function confirmerDecision(commentaire: string) {
    if (!decision) return;
    const { utilisateur: u, decision: choix } = decision;
    await decider.mutateAsync({ id: u.id, decision: choix, commentaire });
    succes(choix === 'valider' ? 'Compte validé et journalisé' : 'Compte refusé et journalisé', u.nom);
  }

  return (
    <motion.div initial="cache" animate="visible" variants={cascade(0.07)}>
      <EnTetePage titre="Utilisateurs" sousTitre="Tous les comptes : citoyens, collecteurs préenregistrés et personnel." />
      <div className="mb-4 grid grid-cols-3 gap-4">
        <Carte titre="Comptes par rôle">
          <Anneau
            centre={tous.length}
            sousTitre="comptes"
            segments={ROLES.map((r, i) => ({ libelle: LIBELLE_ROLE_COURT[r], valeur: tous.filter((u) => u.role === r).length, couleur: couleurSerie(i) })).filter((s) => s.valeur > 0)}
          />
        </Carte>
        <Carte titre="Comptes par statut">
          <Anneau
            centre={tous.length}
            sousTitre="comptes"
            segments={[
              { libelle: 'Validés', valeur: tous.filter((u) => u.statut_validation === 'valide').length, couleur: COULEUR.ok },
              { libelle: 'En attente', valeur: tous.filter((u) => u.statut_validation === 'en_attente').length, couleur: COULEUR.attention },
              { libelle: 'Refusés', valeur: tous.filter((u) => u.statut_validation === 'refuse').length, couleur: COULEUR.neutre },
            ]}
          />
        </Carte>
        <Carte titre="Collecteurs préenregistrés">
          <p className="-mt-1 mb-2 text-[13px] text-texte-doux">Aucune inscription collecteur dans l'application mobile : les comptes sont créés ici.</p>
          <ul className="max-h-[120px] overflow-auto text-[13.5px]">
            {tous
              .filter((u) => u.role === 'collecteur')
              .map((u) => (
                <motion.li layout key={u.id} className="flex items-center justify-between border-b border-bordure py-1.5 last:border-0">
                  <span>
                    {u.nom}
                    <br />
                    <small className="font-mono text-texte-doux">{telephone(u.telephone)}</small>
                  </span>
                  <PastilleStatut statut={u.actif ? STATUT_COMPTE.actif : STATUT_COMPTE.desactive} />
                </motion.li>
              ))}
          </ul>
          <Button taille="petite" className="mt-2.5" onClick={() => setModale({ role: 'collecteur' })}>
            <Plus /> Ajouter un collecteur
          </Button>
        </Carte>
      </div>

      <BarreFiltres
        filtres={[
          { type: 'recherche', cle: 'q', valeur: filtres.q, placeholder: 'Rechercher un nom ou un téléphone' },
          { type: 'liste', cle: 'role', valeur: filtres.role, libelleTous: 'Tous les rôles', options: ROLES.map((r) => ({ valeur: r, libelle: LIBELLE_ROLE[r] })) },
          {
            type: 'liste',
            cle: 'statut',
            valeur: filtres.statut,
            libelleTous: 'Tous les statuts',
            options: [
              { valeur: 'valide', libelle: 'Validé' },
              { valeur: 'en_attente', libelle: 'En attente' },
              { valeur: 'refuse', libelle: 'Refusé' },
              { valeur: 'desactive', libelle: 'Désactivé' },
            ],
          },
          { type: 'liste', cle: 'bac', valeur: filtres.bac, libelleTous: 'Tous les bacs', options: (bacs.data ?? []).map((b) => ({ valeur: b.id, libelle: b.code })) },
        ]}
        surChangement={changerFiltre}
        surEffacer={() => setParams({}, { replace: true })}
        resultat={visibles && `${pluriel(visibles.length, 'compte')} sur ${nombre(tous.length)}`}
        actions={
          <Button onClick={() => setModale({})}>
            <Plus /> Nouveau compte
          </Button>
        }
      />
      <Carte compacte>
        <TableauDonnees
          etiquette="Utilisateurs"
          lignes={visibles}
          erreur={utilisateurs.error}
          reessayer={() => void utilisateurs.refetch()}
          cleLigne={(u) => u.id}
          messageVide="Aucun compte ne correspond à ces filtres."
          colonnes={[
            { cle: 'nom', entete: 'Nom', rendu: (u) => <b>{u.nom}</b>, tri: (u) => u.nom },
            { cle: 'tel', entete: 'Téléphone', rendu: (u) => <span className="font-mono text-[12.5px]">{telephone(u.telephone)}</span> },
            { cle: 'role', entete: 'Rôle', rendu: (u) => LIBELLE_ROLE_COURT[u.role], tri: (u) => u.role },
            { cle: 'bac', entete: 'Bac', rendu: (u) => (u.profil_citoyen ? <CodeObjet code={u.profil_citoyen.code_bac} vers={`/admin/bacs/${u.profil_citoyen.bac_id}`} /> : '—') },
            {
              cle: 'validation',
              entete: 'Validation',
              rendu: (u) => <PastilleStatut statut={STATUT_VALIDATION[u.statut_validation]} />,
            },
            { cle: 'compte', entete: 'Compte', rendu: (u) => <PastilleStatut statut={u.actif ? STATUT_COMPTE.actif : STATUT_COMPTE.desactive} /> },
            {
              cle: 'actions',
              entete: '',
              alignement: 'droite',
              rendu: (u) => (
                <span className="inline-flex justify-end gap-2">
                  {enAttente(u) && (
                    <>
                      <Button taille="petite" onClick={() => setDecision({ utilisateur: u, decision: 'valider' })}>
                        <CircleCheck /> Valider
                      </Button>
                      <Button taille="petite" variante="contour" onClick={() => setDecision({ utilisateur: u, decision: 'refuser' })}>
                        <CircleX /> Refuser
                      </Button>
                    </>
                  )}
                  <Button taille="petite" variante="contour" onClick={() => setModale({ utilisateur: u })}>
                    <Pencil /> Modifier
                  </Button>
                </span>
              ),
            },
          ]}
        />
      </Carte>
      <ModaleConfirmation
        ouverte={!!decision}
        surFermer={() => setDecision(null)}
        titre={decision?.decision === 'refuser' ? 'Refuser le compte' : 'Valider le compte'}
        icone={<ClipboardCheck className="mt-0.5 size-5 text-vert" />}
        libelleConfirmer={decision?.decision === 'refuser' ? 'Refuser le compte' : 'Valider le compte'}
        danger={decision?.decision === 'refuser'}
        commentaire="obligatoire"
        surConfirmer={confirmerDecision}
      >
        {decision && (
          <>
            <p className="font-semibold">
              {decision.utilisateur.nom} · {LIBELLE_ROLE[decision.utilisateur.role]}
            </p>
            <p className="mt-1 text-texte-doux">
              {decision.decision === 'valider'
                ? 'La personne pourra se connecter au Control Center dès la validation.'
                : 'La connexion restera impossible pour ce compte.'}{' '}
              Cette décision est définitive et inscrite au journal.
            </p>
          </>
        )}
      </ModaleConfirmation>
      <ModaleUtilisateur ouverte={!!modale} surFermer={() => setModale(null)} utilisateur={modale?.utilisateur} roleInitial={modale?.role} />
    </motion.div>
  );
}
