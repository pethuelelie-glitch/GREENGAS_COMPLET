/**
 * Barre latérale : « G » du logo en haut, navigation du rôle centrée verticalement, puis « Paramètres »
 * et « Déconnexion » en bas. Deux espaces flexibles identiques encadrent la navigation ; si la fenêtre
 * est trop basse, seule la navigation défile.
 *
 * Chaque bouton n'affiche que son icône (zone cliquable de 48 × 48 px) ; le nom de l'écran apparaît dans
 * une infobulle à droite, au survol ou au focus clavier, et reste dans l'`aria-label`.
 */
import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { LogOut, Settings, type LucideIcon } from 'lucide-react';
import type { RoleControlCenter } from '@/api/types';
import { MENUS, PAGE_PARAMETRES, type CleCompteur, type EntreeMenu } from '@/auth/roles';
import { useSession } from '@/auth/session';
import { Infobulle } from '@/components/ui/infobulle';
import { cn } from '@/lib/utils';

/** Ouverture de l'infobulle au survol : sans délai perceptible. */
const DELAI_INFOBULLE_MS = 60;

function estActive(entree: EntreeMenu, chemin: string): boolean {
  if (chemin === entree.chemin) return true;
  return (entree.actifSur ?? []).some((prefixe) => chemin.startsWith(prefixe));
}

const classeBouton = (actif: boolean) =>
  cn(
    'group relative mx-auto grid size-12 place-items-center rounded-[14px] transition-colors duration-200',
    actif ? 'text-white' : 'text-texte-doux hover:bg-vert-pale hover:text-vert-foret-encre',
  );

/** Contenu commun des boutons de la barre : fond actif animé et icône. */
function ContenuBouton({ actif, icone: Icone, children }: { actif: boolean; icone: LucideIcon; children?: ReactNode }) {
  return (
    <>
      {actif && (
        <motion.span
          layoutId="menu-actif"
          className="absolute inset-0 rounded-[14px] bg-vert-foret"
          transition={{ type: 'spring', stiffness: 480, damping: 36 }}
        />
      )}
      <Icone
        aria-hidden
        className="relative size-[22px] transition-transform duration-200 group-hover:scale-110"
        strokeWidth={1.8}
      />
      {children}
    </>
  );
}

export function BarreLaterale({
  role,
  compteurs,
}: {
  role: RoleControlCenter;
  compteurs: Partial<Record<CleCompteur, number>>;
}) {
  const { pathname } = useLocation();
  const { deconnecter } = useSession();
  const groupes = MENUS[role];
  const pageParametres = PAGE_PARAMETRES[role];
  const parametresActif = pathname === pageParametres || pathname.startsWith(`${pageParametres}/`);
  // Une seule entrée active : la plus précise (aucune quand on est sur la page Paramètres).
  const toutes = groupes.flatMap((g) => g.entrees);
  const active = parametresActif
    ? undefined
    : (toutes.find((e) => e.chemin === pathname) ??
      toutes.filter((e) => estActive(e, pathname)).sort((a, b) => b.chemin.length - a.chemin.length)[0]);

  return (
    <div className="flex h-full min-h-0 flex-col items-center py-3.5">
      <motion.img
        src="/brand/logo-g.png"
        alt="GREENGAS"
        className="mt-0.5 size-[52px] flex-none object-contain"
        initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      />

      {/* Espaces A et B : même croissance, même minimum. */}
      <div aria-hidden data-espace="haut" className="min-h-8 flex-1 basis-0" />

      <nav
        aria-label="Navigation principale"
        className="defilement flex min-h-0 w-full flex-col items-center gap-1.5 overflow-y-auto px-2"
      >
        {groupes.map((groupe, g) => (
          <div key={groupe.titre ?? g} className="flex w-full flex-col items-center gap-1.5">
            {groupe.titre && (
              <div className="mt-2.5 whitespace-nowrap text-[11.5px] font-semibold text-statut-neutre">
                {groupe.titre}
              </div>
            )}
            {groupe.entrees.map((entree, i) => {
              const actif = entree === active;
              const n = entree.compteur ? (compteurs[entree.compteur] ?? 0) : 0;
              return (
                <motion.div
                  key={entree.chemin}
                  className="w-full"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * (g * 3 + i), duration: 0.3 }}
                >
                  <Infobulle contenu={entree.libelle} cote="right" delai={DELAI_INFOBULLE_MS}>
                    <NavLink
                      to={entree.chemin}
                      end
                      aria-label={n > 0 ? `${entree.libelle} (${n} à traiter)` : entree.libelle}
                      aria-current={actif ? 'page' : undefined}
                      className={classeBouton(actif)}
                    >
                      <ContenuBouton actif={actif} icone={entree.icone}>
                        <AnimatePresence>
                          {n > 0 && (
                            <motion.span
                              key={n}
                              aria-hidden
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                              data-compteur={entree.compteur}
                              className={cn(
                                'absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full px-[5px] text-[10px] font-extrabold',
                                entree.compteur === 'alertes'
                                  ? 'bg-statut-alerte text-white'
                                  : 'bg-statut-attention text-texte',
                              )}
                            >
                              {n}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </ContenuBouton>
                    </NavLink>
                  </Infobulle>
                </motion.div>
              );
            })}
          </div>
        ))}
      </nav>

      <div aria-hidden data-espace="bas" className="min-h-8 flex-1 basis-0" />

      <div role="group" aria-label="Compte" className="flex w-full flex-none flex-col items-center gap-1.5 px-2">
        <Infobulle contenu="Paramètres" cote="right" delai={DELAI_INFOBULLE_MS}>
          <NavLink
            to={pageParametres}
            aria-label="Paramètres"
            aria-current={parametresActif ? 'page' : undefined}
            className={classeBouton(parametresActif)}
          >
            <ContenuBouton actif={parametresActif} icone={Settings} />
          </NavLink>
        </Infobulle>
        <Infobulle contenu="Se déconnecter" cote="right" delai={DELAI_INFOBULLE_MS}>
          <button
            type="button"
            aria-label="Déconnexion"
            onClick={() => void deconnecter()}
            className={classeBouton(false)}
          >
            <ContenuBouton actif={false} icone={LogOut} />
          </button>
        </Infobulle>
      </div>
    </div>
  );
}
