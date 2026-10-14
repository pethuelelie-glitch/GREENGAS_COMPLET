/**
 * Page Notifications (tous les rôles) : historique complet des notifications de l'utilisateur,
 * filtre Toutes / Non lues, « Tout marquer comme lu ». Un clic ouvre l'écran de l'objet.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCheck } from 'lucide-react';
import type { Notification } from '@/api/types';
import { useUtilisateur } from '@/auth/session';
import { Carte } from '@/components/greengas/Carte';
import { ElementNotification } from '@/components/greengas/ElementNotification';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { EtatChargement, EtatErreur, EtatVide } from '@/components/greengas/Etats';
import { Button } from '@/components/ui/button';
import { ChoixSegmente } from '@/components/ui/choix-segmente';
import { useCompteurNotifications, useListeNotifications, useMarquerLue, useToutLire } from '@/hooks/notifications';
import { cascade } from '@/lib/animations';
import { ecranDeNotification } from '@/lib/notifications';

type Filtre = 'toutes' | 'non_lues';

export function PageNotifications() {
  const u = useUtilisateur();
  const navigate = useNavigate();
  const [filtre, setFiltre] = useState<Filtre>('toutes');
  const liste = useListeNotifications(true, 100, filtre === 'non_lues' ? false : undefined);
  const compteur = useCompteurNotifications();
  const marquerLue = useMarquerLue();
  const toutLire = useToutLire();
  const nonLues = compteur.data?.non_lues ?? 0;

  async function ouvrir(n: Notification) {
    if (!n.lue) await marquerLue.mutateAsync(n.id).catch(() => undefined);
    const ecran = ecranDeNotification(n, u.role);
    if (ecran) navigate(ecran);
  }

  return (
    <>
      <EnTetePage
        titre="Notifications"
        sousTitre="Événements qui vous concernent, créés par le serveur. Un clic ouvre l'écran concerné."
      />
      <div className="mb-4 flex max-w-[900px] items-center justify-between gap-3">
        <ChoixSegmente
          etiquette="Filtrer les notifications"
          valeur={filtre}
          surChangement={setFiltre}
          options={[
            { valeur: 'toutes', libelle: 'Toutes' },
            { valeur: 'non_lues', libelle: `Non lues (${nonLues})` },
          ]}
        />
        <Button
          variante="contour"
          disabled={nonLues === 0}
          enCours={toutLire.isPending}
          onClick={() => void toutLire.mutateAsync()}
        >
          <CheckCheck /> Tout marquer comme lu
        </Button>
      </div>
      <Carte compacte className="max-w-[900px] overflow-hidden !p-0">
        {liste.error ? (
          <EtatErreur erreur={liste.error} reessayer={() => void liste.refetch()} />
        ) : !liste.data ? (
          <EtatChargement />
        ) : liste.data.length === 0 ? (
          <EtatVide titre="Aucune notification" message="Vous serez prévenu ici des événements qui vous concernent." />
        ) : (
          <motion.ul initial="cache" animate="visible" variants={cascade(0.03)}>
            {liste.data.map((n) => (
              <ElementNotification key={n.id} notification={n} surClic={() => void ouvrir(n)} />
            ))}
          </motion.ul>
        )}
      </Carte>
    </>
  );
}
