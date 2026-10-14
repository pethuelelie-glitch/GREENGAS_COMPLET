/**
 * Préférences personnelles de l'appareil : thème (clair, sombre ou celui du système) et animations réduites.
 * Elles sont gardées dans le navigateur (aucune donnée sensible) et appliquées sur <html> :
 * `data-theme="sombre"` (jetons de src/styles/tokens.css) et `data-mouvement="reduit"` (src/styles/globals.css).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MotionConfig } from 'motion/react';

export type Theme = 'clair' | 'sombre' | 'systeme';
export type Animations = 'normales' | 'reduites';

export interface Preferences {
  theme: Theme;
  animations: Animations;
}

const CLE = 'greengas.preferences';
const PAR_DEFAUT: Preferences = { theme: 'clair', animations: 'normales' };

function lire(): Preferences {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? 'null') as Partial<Preferences> | null;
    return {
      theme: brut?.theme === 'sombre' || brut?.theme === 'systeme' ? brut.theme : PAR_DEFAUT.theme,
      animations: brut?.animations === 'reduites' ? 'reduites' : PAR_DEFAUT.animations,
    };
  } catch {
    return PAR_DEFAUT;
  }
}

function enregistrer(p: Preferences) {
  try {
    localStorage.setItem(CLE, JSON.stringify(p));
  } catch {
    // Stockage indisponible : la préférence vaut pour la session en cours.
  }
}

const requeteSombre = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

/** Thème réellement affiché, une fois « système » résolu. */
function useThemeSysteme(): 'clair' | 'sombre' {
  const [sombre, setSombre] = useState(() => requeteSombre()?.matches ?? false);
  useEffect(() => {
    const requete = requeteSombre();
    if (!requete) return;
    const surChangement = (e: MediaQueryListEvent) => setSombre(e.matches);
    requete.addEventListener('change', surChangement);
    return () => requete.removeEventListener('change', surChangement);
  }, []);
  return sombre ? 'sombre' : 'clair';
}

interface ContextePreferences {
  preferences: Preferences;
  themeApplique: 'clair' | 'sombre';
  modifier: (changement: Partial<Preferences>) => void;
}

const Contexte = createContext<ContextePreferences | null>(null);

export function FournisseurPreferences({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(lire);
  const themeSysteme = useThemeSysteme();
  const themeApplique = preferences.theme === 'systeme' ? themeSysteme : preferences.theme;

  useEffect(() => {
    const racine = document.documentElement;
    if (themeApplique === 'sombre') racine.dataset.theme = 'sombre';
    else delete racine.dataset.theme;
    if (preferences.animations === 'reduites') racine.dataset.mouvement = 'reduit';
    else delete racine.dataset.mouvement;
  }, [themeApplique, preferences.animations]);

  const modifier = useCallback((changement: Partial<Preferences>) => {
    setPreferences((p) => {
      const suivantes = { ...p, ...changement };
      enregistrer(suivantes);
      return suivantes;
    });
  }, []);

  const valeur = useMemo(() => ({ preferences, themeApplique, modifier }), [preferences, themeApplique, modifier]);
  return (
    <Contexte.Provider value={valeur}>
      {/* « user » suit le réglage de l'appareil ; « always » coupe les animations Motion. */}
      <MotionConfig reducedMotion={preferences.animations === 'reduites' ? 'always' : 'user'}>{children}</MotionConfig>
    </Contexte.Provider>
  );
}

export function usePreferences(): ContextePreferences {
  const c = useContext(Contexte);
  if (!c) throw new Error('usePreferences doit être utilisé dans <FournisseurPreferences>');
  return c;
}
