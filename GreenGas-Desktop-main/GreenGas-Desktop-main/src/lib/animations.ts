/**
 * Préréglages d'animation partagés (Motion). Uniquement `transform` et `opacity` ;
 * `<MotionConfig>` (src/lib/preferences.tsx) les neutralise si l'appareil ou les préférences personnelles le demandent.
 */
import type { Transition, Variants } from 'motion/react';

export const EASE_SORTIE = [0.22, 1, 0.36, 1] as const;

export const RESSORT_DOUX: Transition = { type: 'spring', stiffness: 260, damping: 26 };
export const RESSORT_VIF: Transition = { type: 'spring', stiffness: 420, damping: 30 };

/** Conteneur qui fait apparaître ses enfants en cascade. */
export const cascade = (pas = 0.06, delai = 0): Variants => ({
  cache: {},
  visible: { transition: { staggerChildren: pas, delayChildren: delai } },
});

/** Élément qui monte légèrement en apparaissant. */
export const apparition: Variants = {
  cache: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE_SORTIE } },
};

/** Ligne de tableau. */
export const apparitionLigne: Variants = {
  cache: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_SORTIE } },
};

/** Élément qui grossit en apparaissant (pins de carte, pastilles). */
export const apparitionEchelle: Variants = {
  cache: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: RESSORT_VIF },
};
