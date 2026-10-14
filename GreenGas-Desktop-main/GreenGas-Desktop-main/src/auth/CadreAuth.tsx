/** Cadre commun de la connexion et de l'inscription : fond animé, carte, logo et titre. */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { usePreferences } from '@/lib/preferences';
import { FondFlux } from './FondFlux';

export function CadreAuth({ titre, accroche, children }: { titre: string; accroche: string; children: ReactNode }) {
  const { themeApplique } = usePreferences();
  return (
    <div className="relative grid h-full place-items-center overflow-hidden bg-fond-cadre">
      <FondFlux />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="relative z-10 flex w-[400px] flex-col gap-3.5 rounded-[22px] bg-surface p-[30px] shadow-[0_2px_20px_rgb(0_0_0/0.13)]"
      >
        <motion.img
          src={themeApplique === 'sombre' ? '/brand/logo-greengas-blanc.png' : '/brand/logo-greengas.png'}
          alt="GREENGAS"
          className="mb-1 h-auto w-[220px]"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        />
        <h1 className="text-[22px] font-bold text-texte">{titre}</h1>
        <p className="text-texte-doux">{accroche}</p>
        {children}
      </motion.div>
    </div>
  );
}
