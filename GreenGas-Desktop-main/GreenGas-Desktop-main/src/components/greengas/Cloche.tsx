/**
 * Cloche des notifications (contrat 1.4.0), dans la barre du haut, juste avant la zone utilisateur.
 * Pastille : non lues (GET /notifications/compteur/, toutes les 5 s), rouge s'il y a une critique non lue.
 * Panneau (Popover) : les 20 plus récentes ; un clic marque comme lue et ouvre l'écran de l'objet.
 * Une nouvelle notification critique fait osciller la cloche et affiche un toast.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as P from '@radix-ui/react-popover';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, RotateCw } from 'lucide-react';
import type { Notification } from '@/api/types';
import { useUtilisateur } from '@/auth/session';
import { useNotifications } from '@/components/greengas/Notifications';
import { Infobulle } from '@/components/ui/infobulle';
import {
  useCompteurNotifications,
  useListeNotifications,
  useMarquerLue,
  useNotificationsNonLues,
  useToutLire,
} from '@/hooks/notifications';
import { cascade } from '@/lib/animations';
import { ecranDeNotification } from '@/lib/notifications';
import { ElementNotification } from './ElementNotification';
import { cn } from '@/lib/utils';

export function Cloche() {
  const u = useUtilisateur();
  const navigate = useNavigate();
  const { notifier } = useNotifications();
  const [ouvert, setOuvert] = useState(false);
  const compteur = useCompteurNotifications();
  const nonLues = compteur.data?.non_lues ?? 0;
  const critiques = useNotificationsNonLues(nonLues > 0);
  const liste = useListeNotifications(ouvert);
  const marquerLue = useMarquerLue();
  const toutLire = useToutLire();
  const [oscillation, setOscillation] = useState(0);

  const critiqueNonLue = nonLues > 0 && (critiques.data ?? []).some((n) => n.niveau === 'critique');

  // Nouvelle notification critique : la cloche oscille une fois et un toast s'affiche (le bandeau reste).
  const connues = useRef<Set<string> | null>(null);
  // Aucune non lue à l'ouverture : l'état de départ est vide, la première critique qui arrive est « nouvelle ».
  useEffect(() => {
    if (connues.current === null && compteur.data?.non_lues === 0) connues.current = new Set();
  }, [compteur.data]);
  useEffect(() => {
    const resultats = critiques.data;
    if (!resultats) return;
    if (connues.current === null) {
      connues.current = new Set(resultats.map((n) => n.id));
      return;
    }
    for (const n of resultats) {
      if (connues.current.has(n.id)) continue;
      connues.current.add(n.id);
      if (n.niveau !== 'critique') continue;
      setOscillation((o) => o + 1);
      const ecran = ecranDeNotification(n, u.role);
      notifier({
        type: 'alerte',
        titre: n.titre,
        message: n.message,
        action: ecran ? { libelle: 'Ouvrir', surClic: () => navigate(ecran) } : undefined,
      });
    }
  }, [critiques.data, notifier, navigate, u.role]);

  async function ouvrirNotification(n: Notification) {
    setOuvert(false);
    if (!n.lue) await marquerLue.mutateAsync(n.id).catch(() => undefined);
    const ecran = ecranDeNotification(n, u.role);
    if (ecran) navigate(ecran);
  }

  const elements = liste.data;

  return (
    <P.Root open={ouvert} onOpenChange={setOuvert}>
      <Infobulle contenu="Notifications" cote="bottom">
        <P.Trigger asChild>
          <button
            type="button"
            aria-label={nonLues > 0 ? `Notifications (${nonLues} non lues)` : 'Notifications'}
            className="relative grid size-[34px] flex-none place-items-center rounded-full bg-surface text-texte-doux shadow-puce transition-colors hover:text-vert-foret-encre"
          >
            <motion.span
              key={oscillation}
              className="grid place-items-center"
              animate={oscillation > 0 ? { rotate: [0, -16, 14, -10, 6, 0] } : undefined}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              style={{ transformOrigin: '50% 10%' }}
            >
              <Bell aria-hidden className="size-[18px]" strokeWidth={1.9} />
            </motion.span>
            <AnimatePresence>
              {nonLues > 0 && (
                <motion.span
                  key={nonLues}
                  aria-hidden
                  data-testid="pastille-notifications"
                  data-critique={critiqueNonLue || undefined}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 14 }}
                  className={cn(
                    'absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-extrabold',
                    critiqueNonLue ? 'bg-statut-alerte text-white' : 'bg-vert text-white',
                  )}
                >
                  {nonLues > 9 ? '9+' : nonLues}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </P.Trigger>
      </Infobulle>

      <P.Portal>
        <P.Content
          align="end"
          sideOffset={10}
          aria-label="Notifications"
          className="z-[60] w-[380px] overflow-hidden rounded-carte bg-surface shadow-modale data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2"
        >
          <div className="flex items-center justify-between gap-3 border-b border-bordure px-4 py-3">
            <p className="font-bold text-texte">
              Notifications
              {nonLues > 0 && (
                <span className="ml-2 text-[12.5px] font-semibold text-texte-doux">{nonLues} non lues</span>
              )}
            </p>
            <button
              type="button"
              disabled={nonLues === 0 || toutLire.isPending}
              onClick={() => void toutLire.mutateAsync()}
              className="text-[12.5px] font-semibold text-vert hover:underline disabled:cursor-default disabled:text-texte-doux disabled:no-underline"
            >
              Tout marquer comme lu
            </button>
          </div>

          <div className="defilement max-h-[420px] overflow-y-auto">
            {liste.error ? (
              <div
                role="alert"
                className="flex flex-col items-center gap-2 px-4 py-8 text-center text-[13px] text-texte-doux"
              >
                Impossible de charger les notifications.
                <button
                  type="button"
                  onClick={() => void liste.refetch()}
                  className="inline-flex items-center gap-1.5 font-semibold text-vert"
                >
                  <RotateCw className="size-3.5" /> Réessayer
                </button>
              </div>
            ) : !elements ? (
              <div aria-label="Chargement des notifications" className="flex flex-col gap-3 px-4 py-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="size-8 flex-none animate-pulse rounded-full bg-vert-pale" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="h-3 w-2/5 animate-pulse rounded bg-vert-pale" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-vert-pale" />
                    </div>
                  </div>
                ))}
              </div>
            ) : elements.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-texte-doux">Aucune notification</p>
            ) : (
              <motion.ul initial="cache" animate="visible" variants={cascade(0.04)}>
                {elements.map((n) => (
                  <ElementNotification key={n.id} notification={n} surClic={() => void ouvrirNotification(n)} />
                ))}
              </motion.ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOuvert(false);
              navigate('/notifications');
            }}
            className="w-full border-t border-bordure px-4 py-2.5 text-center text-[12.5px] font-semibold text-vert hover:bg-vert-pale"
          >
            Voir toutes les notifications
          </button>
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
