/**
 * Chiffre qui défile jusqu'à sa valeur, à l'affichage puis à chaque mise à jour.
 * Le texte est écrit directement dans le DOM à chaque image (pas de rendu React par image).
 */
import { useEffect, useRef } from 'react';
import { animate, useReducedMotionConfig } from 'motion/react';
import { nombre, TIRET_VIDE } from '@/lib/format';

interface ProprietesValeur {
  valeur: number | null | undefined;
  decimales?: number;
  signe?: boolean;
  duree?: number;
  className?: string;
  /** Mise en forme personnalisée (doit rester une mise en forme, jamais un calcul métier). */
  formater?: (v: number) => string;
}

export function ValeurAnimee({ valeur, decimales = 0, signe = false, duree = 1.1, className, formater }: ProprietesValeur) {
  const ref = useRef<HTMLSpanElement>(null);
  const precedente = useRef<number | null>(null);
  const reduit = useReducedMotionConfig();
  const mettreEnForme = formater ?? ((v: number) => nombre(v, decimales, signe));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (valeur == null) {
      el.textContent = TIRET_VIDE;
      precedente.current = null;
      return;
    }
    const depart = precedente.current ?? (reduit ? valeur : 0);
    precedente.current = valeur;
    if (reduit || depart === valeur) {
      el.textContent = mettreEnForme(valeur);
      return;
    }
    const controle = animate(depart, valeur, {
      duration: duree,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = mettreEnForme(v);
      },
    });
    return () => controle.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la mise en forme ne doit pas relancer l'animation
  }, [valeur, reduit, duree]);

  return (
    <span ref={ref} className={className} aria-label={valeur == null ? 'non disponible' : mettreEnForme(valeur)}>
      {valeur == null ? TIRET_VIDE : mettreEnForme(precedente.current ?? (reduit ? valeur : 0))}
    </span>
  );
}
