/** Bandeau rouge global : visible tant qu'une alerte est ouverte (responsable méthanisation, administrateur). */
import { AnimatePresence, motion } from 'motion/react';
import { TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Alerte } from '@/api/types';

export function BandeauAlerte({ alertes }: { alertes: Alerte[] }) {
  const navigate = useNavigate();
  const premiere = alertes[0];
  return (
    <AnimatePresence initial={false}>
      {premiere && (
        <motion.div
          key="bandeau"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex-none overflow-hidden"
        >
          <motion.button
            type="button"
            initial={{ y: -36 }}
            animate={{ y: 0 }}
            exit={{ y: -36 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={() => navigate(`/methanisation/alertes?alerte=${premiere.id}`)}
            className="group relative flex w-full items-center gap-2.5 overflow-hidden bg-statut-alerte px-4 py-2 text-left font-semibold text-white"
          >
            {/* Reflet qui balaie le bandeau à son arrivée */}
            <motion.span
              aria-hidden
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              initial={{ x: '-120%' }}
              animate={{ x: '420%' }}
              transition={{ duration: 1.4, delay: 0.3, ease: 'easeInOut' }}
            />
            <span className="relative grid place-items-center">
              <span className="absolute size-6 animate-pulsation rounded-full border-2 border-white" aria-hidden />
              <TriangleAlert className="size-[18px]" />
            </span>
            <span className="relative">
              <b>{premiere.code_site}</b> · {premiere.description}
              {alertes.length > 1 && (
                <span className="font-normal opacity-90"> · et {alertes.length - 1} autre(s)</span>
              )}
            </span>
            <u className="relative ml-auto underline-offset-2 group-hover:no-underline">Voir l'alerte</u>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
