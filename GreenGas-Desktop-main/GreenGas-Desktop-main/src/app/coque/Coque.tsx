/**
 * Coque de l'application (maquette) : barre latérale blanche à gauche, panneau principal arrondi,
 * bandeau d'alerte global et transitions entre écrans.
 */
import { motion } from 'motion/react';
import { useLocation, useOutlet } from 'react-router-dom';
import { useUtilisateur } from '@/auth/session';
import { useAlertesOuvertes, useTourneesATrier, useVerifications } from '@/hooks/referentiel';
import { EASE_SORTIE } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { BandeauAlerte } from './BandeauAlerte';
import { BarreLaterale } from './BarreLaterale';

/** Écrans affichés bord à bord (la carte de la vue globale). */
const PLEINE_PAGE = ['/methanisation'];

export function Coque() {
  const u = useUtilisateur();
  const { pathname } = useLocation();
  const outlet = useOutlet();

  const voitAlertes = u.role === 'responsable_methanisation' || u.role === 'administrateur';
  const alertes = useAlertesOuvertes(voitAlertes);
  const verifications = useVerifications(u.role === 'administrateur' || u.role === 'referent');
  const aTrier = useTourneesATrier(u.role === 'operateur_tri');

  const pleinePage = PLEINE_PAGE.includes(pathname);
  // Changer d'onglet de site ne rejoue pas la transition de page.
  const cle = pathname.replace(/\/sites\/[^/]+$/, '/sites');

  return (
    <div className="flex h-full bg-surface">
      <aside className="w-24 flex-none">
        <BarreLaterale
          role={u.role}
          compteurs={{
            alertes: alertes.data?.length,
            verifications: verifications.data?.length,
            tournees: aTrier.data?.length,
          }}
        />
      </aside>
      <div className="relative my-1.5 mr-1.5 flex min-w-0 flex-1 flex-col overflow-hidden rounded-carte bg-fond">
        {voitAlertes && <BandeauAlerte alertes={alertes.data ?? []} />}
        <main
          id="contenu"
          className={cn(
            'defilement relative min-h-0 flex-1',
            pleinePage ? 'overflow-hidden' : 'overflow-auto px-[26px] pb-8 pt-5',
          )}
        >
          <motion.div
            key={cle}
            className={cn(pleinePage && 'h-full')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: EASE_SORTIE }}
          >
            {outlet}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
