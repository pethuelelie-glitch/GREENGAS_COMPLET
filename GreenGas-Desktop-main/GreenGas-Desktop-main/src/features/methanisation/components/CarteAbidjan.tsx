/**
 * Carte stylisée d'Abidjan (fond dessiné, hors ligne) : carte de secours de la vue globale quand
 * les images satellite ou topographiques ne peuvent pas être chargées.
 */
import fondCarte from '@/assets/carte/carte-abidjan.svg';
import { CoucheCarte, type DonneesCarte, type Positionner } from './CoucheCarte';
import { positionBac, positionSite, QUARTIERS } from './positions';

const position: Positionner = (o) =>
  o.type === 'site' ? positionSite(o.code, o.latitude, o.longitude) : positionBac(o.code, o.latitude, o.longitude);

export function CarteAbidjan(props: DonneesCarte) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-carte-terre">
      <img
        src={fondCarte}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full select-none object-fill"
        draggable={false}
      />
      {QUARTIERS.map(([nom, x, y]) => (
        <span
          key={nom}
          className="pointer-events-none absolute z-[1] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[11.5px] font-bold uppercase tracking-[0.08em] text-carte-quartier"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          {nom}
        </span>
      ))}
      <CoucheCarte {...props} position={position} />
    </div>
  );
}
