/**
 * Repères vivants de la vue globale, communs à la carte satellite et à la carte stylisée de secours :
 * flux de collecte animés des bacs vers leur digesteur, bacs, sites (pulsation en alerte) et bulle
 * d'information du site choisi. Les positions sont fournies en % du conteneur par la carte qui les porte.
 */
import { AnimatePresence, motion } from 'motion/react';
import { Factory, Lock, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Bac, ProductionEnergie, Secteur, Site } from '@/api/types';
import { nombre, TIRET_VIDE } from '@/lib/format';
import { cn } from '@/lib/utils';

export type Sortie = 'biogaz' | 'electricite' | 'chaleur';

const SORTIES: Record<Sortie, { unite: string; lire: (p: ProductionEnergie) => number | null; decimales: number }> = {
  biogaz: { unite: 'm³', lire: (p) => p.biogaz_mesure_m3, decimales: 1 },
  electricite: { unite: 'kWh', lire: (p) => p.electricite_kwh, decimales: 2 },
  chaleur: { unite: 'kWh', lire: (p) => p.chaleur_kwh, decimales: 2 },
};

/** Position d'un site ou d'un bac en % de la carte ([x, y]). */
export type Positionner = (objet: {
  type: 'site' | 'bac';
  code: string;
  latitude: number;
  longitude: number;
}) => [number, number];

export interface DonneesCarte {
  sites: Site[];
  productions: ProductionEnergie[];
  bacs: Bac[];
  secteurs: Secteur[];
  bacsSignales: Set<string>;
  selection: string | null;
  surSelection: (siteId: string) => void;
  sortie: Sortie;
  filtreStatut: string;
  bacsCliquables: boolean;
}

export function CoucheCarte({
  sites,
  productions,
  bacs,
  secteurs,
  bacsSignales,
  selection,
  surSelection,
  sortie,
  filtreStatut,
  bacsCliquables,
  position,
  codesBacs = true,
}: DonneesCarte & {
  position: Positionner;
  /** Affiche le code sous chaque bac (masqué quand la carte est trop dézoomée). */
  codesBacs?: boolean;
}) {
  const navigate = useNavigate();
  const siteParId = new Map(sites.map((s) => [s.id, s]));
  const siteDuBac = (b: Bac) => siteParId.get(secteurs.find((s) => s.id === b.secteur_id)?.site_id ?? '');
  const actifs = bacs.filter((b) => b.statut === 'actif');
  const visible = (s: Site) => !filtreStatut || s.statut === filtreStatut;
  const posSite = (s: Site) => position({ type: 'site', code: s.code, latitude: s.latitude, longitude: s.longitude });
  const posBac = (b: Bac) => position({ type: 'bac', code: b.code, latitude: b.latitude, longitude: b.longitude });

  return (
    <>
      {/* Flux de collecte : bac → digesteur du secteur */}
      <svg
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {actifs.map((b, i) => {
          const site = siteDuBac(b);
          if (!site || !visible(site)) return null;
          const [x1, y1] = posBac(b);
          const [x2, y2] = posSite(site);
          const alerte = site.statut === 'alerte';
          return (
            <motion.line
              key={b.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={alerte ? 'var(--statut-alerte)' : 'var(--vert-foret-encre)'}
              strokeWidth={alerte ? 3 : 2.5}
              strokeDasharray="6 6"
              vectorEffect="non-scaling-stroke"
              className="animate-flux [filter:drop-shadow(0_0_2px_rgb(255_255_255/0.6))]"
              style={{ animationDuration: alerte ? '0.9s' : '1.4s' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: alerte ? 0.85 : 0.75 }}
              transition={{ delay: 0.4 + i * 0.06, duration: 0.6 }}
            />
          );
        })}
      </svg>

      {/* Bacs */}
      {bacs.map((b, i) => {
        const [x, y] = posBac(b);
        const signale = bacsSignales.has(b.id);
        return (
          <div
            key={b.id}
            className="pointer-events-auto absolute z-[2] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <motion.button
              type="button"
              tabIndex={bacsCliquables ? 0 : -1}
              onClick={bacsCliquables ? () => navigate(`/admin/bacs/${b.id}`) : undefined}
              title={`${b.code} · ${b.residence}${signale ? ' · collecte à vérifier' : ''}`}
              className={cn('group flex flex-col items-center gap-[3px]', !bacsCliquables && 'cursor-default')}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.05, type: 'spring', stiffness: 380, damping: 18 }}
              whileHover={{ scale: 1.18 }}
            >
              <i
                className={cn(
                  'size-3.5 rounded-full border-[3px] shadow-[0_1px_4px_rgb(0_0_0/0.27)]',
                  b.statut === 'inactif'
                    ? 'border-statut-neutre bg-surface'
                    : signale
                      ? 'border-statut-attention bg-statut-attention-fond'
                      : 'border-vert-foret-encre bg-surface',
                )}
              />
              {codesBacs && (
                <span className="rounded-md bg-surface px-[5px] py-px font-mono text-[11px] font-semibold text-vert-foret-encre shadow-puce">
                  {b.code}
                </span>
              )}
            </motion.button>
          </div>
        );
      })}

      {/* Sites */}
      {sites.filter(visible).map((s, i) => {
        const p = productions.find((x) => x.site_id === s.id);
        const [x, y] = posSite(s);
        const choisi = s.id === selection;
        const conf = SORTIES[sortie];
        const valeur = p ? conf.lire(p) : null;
        const etiquette =
          valeur != null
            ? `${nombre(valeur, conf.decimales)} ${conf.unite}`
            : p && p.biogaz_attendu_m3 > 0
              ? 'mesure en attente'
              : 'tri en attente';
        const Icone = s.statut === 'alerte' ? TriangleAlert : s.statut === 'maintenance' ? Lock : Factory;
        return (
          <div
            key={s.id}
            className="pointer-events-auto absolute z-[3] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <motion.button
              type="button"
              aria-label={`${s.code} · ${s.nom}`}
              aria-pressed={choisi}
              onClick={() => surSelection(s.id)}
              className="relative block"
              initial={{ opacity: 0, scale: 0.3, y: -24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.12, type: 'spring', stiffness: 300, damping: 15 }}
            >
              <motion.span
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  'relative grid size-[46px] place-items-center rounded-full border-4 bg-surface shadow-[0_3px_10px_rgb(0_0_0/0.27)] transition-colors duration-500',
                  s.statut === 'alerte'
                    ? 'border-statut-alerte text-statut-alerte'
                    : s.statut === 'maintenance'
                      ? 'border-statut-neutre text-texte-doux'
                      : 'border-vert text-vert-foret-encre',
                  choisi && 'outline outline-[3px] outline-offset-2 outline-vert-foret',
                )}
              >
                {s.statut === 'alerte' && (
                  <>
                    <span className="absolute -inset-1 animate-pulsation rounded-full border-2 border-statut-alerte" />
                    <span className="absolute -inset-1 animate-pulsation rounded-full border-2 border-statut-alerte [animation-delay:1s]" />
                  </>
                )}
                <Icone className="size-5" />
              </motion.span>

              <AnimatePresence mode="wait">
                {choisi && p ? (
                  <motion.span
                    key="bulle"
                    initial={{ opacity: 0, y: 10, scale: 0.85, x: x > 78 ? 0 : '-50%' }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: x > 78 ? 0 : '-50%' }}
                    exit={{ opacity: 0, y: 6, scale: 0.9, transition: { duration: 0.12 } }}
                    transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                    className={cn(
                      'absolute bottom-full mb-3.5 flex gap-4 rounded-[14px] bg-bulle px-4 py-2.5 text-bulle-texte shadow-modale',
                      x > 78 ? 'right-[-10px]' : 'left-1/2',
                    )}
                  >
                    {[
                      [p.ecart_pct == null ? TIRET_VIDE : `${nombre(p.ecart_pct, 0, true)} %`, 'écart'],
                      [nombre(p.biogaz_mesure_m3, 1), 'm³'],
                      [nombre(p.electricite_kwh, 0), 'kWh'],
                    ].map(([v, l]) => (
                      <span key={l} className="flex flex-col items-center text-[11.5px] font-medium">
                        <b className="whitespace-nowrap text-xl font-bold">{v}</b>
                        {l}
                      </span>
                    ))}
                    <i
                      className={cn(
                        'absolute -bottom-1.5 size-3 rotate-45 bg-bulle',
                        x > 78 ? 'right-[27px]' : 'left-1/2 -translate-x-1/2',
                      )}
                    />
                  </motion.span>
                ) : (
                  <motion.span
                    key="etiquette"
                    initial={{ opacity: 0, y: -4, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0 }}
                    className="absolute left-1/2 top-full mt-2 whitespace-nowrap rounded-full bg-surface px-2.5 py-1 text-[12.5px] font-semibold shadow-puce"
                  >
                    <span className="font-mono">{s.code}</span> · {etiquette}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        );
      })}
    </>
  );
}
