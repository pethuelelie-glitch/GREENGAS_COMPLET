/**
 * Vraie carte d'Abidjan pour la vue globale : imagerie satellite (avec les noms de lieux) ou carte
 * topographique, au choix. Sites et bacs sont placés à leurs coordonnées GPS (contrat : `latitude`,
 * `longitude`) et suivent les déplacements et le zoom.
 *
 * Les images viennent d'Internet (Esri, sans clé). Si elles ne se chargent pas (hors ligne, réseau
 * bloqué), la vue globale reprend la carte stylisée de secours (`CarteAbidjan`) avec les mêmes repères.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AttributionControl, MapContainer, TileLayer, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import { RotateCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChoixSegmente } from '@/components/ui/choix-segmente';
import { cn } from '@/lib/utils';
import { CarteAbidjan } from './CarteAbidjan';
import { CoucheCarte, type DonneesCarte, type Positionner } from './CoucheCarte';

export type FondCarte = 'satellite' | 'relief';

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

const FONDS: Record<FondCarte, { url: string; attribution: string }> = {
  satellite: {
    url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
    attribution: 'Imagerie © Esri — Maxar, Earthstar Geographics, communauté des utilisateurs SIG',
  },
  relief: {
    url: `${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`,
    attribution: 'Carte © Esri — HERE, Garmin, USGS, OpenStreetMap',
  },
};

/** Noms des lieux posés sur l'imagerie satellite. */
const NOMS_DE_LIEUX = `${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`;

const OPTIONS_FOND: { valeur: FondCarte; libelle: string }[] = [
  { valeur: 'satellite', libelle: 'Satellite' },
  { valeur: 'relief', libelle: 'Relief' },
];

/** Délai au-delà duquel, sans aucune image reçue, on passe à la carte de secours. */
const DELAI_IMAGES_MS = 8000;
const CENTRE_ABIDJAN: L.LatLngTuple = [5.35, -4.01];

/**
 * Marges du cadrage initial : panneau du site à gauche, barre du haut, indicateurs en bas
 * (mise en page de la vue globale).
 */
const MARGE_HAUT_GAUCHE: L.PointTuple = [380, 80];
const MARGE_BAS_DROITE: L.PointTuple = [50, 210];

/** Recalcule la position des repères à chaque mouvement de la carte. */
function SuiviCarte({ surChangement, surZoom }: { surChangement: () => void; surZoom: (enCours: boolean) => void }) {
  useMapEvents({
    move: surChangement,
    resize: surChangement,
    viewreset: surChangement,
    zoomstart: () => surZoom(true),
    zoomend: () => {
      surChangement();
      surZoom(false);
    },
  });
  return null;
}

/**
 * Cadre la carte sur les sites et les bacs. Tant que l'utilisateur n'a ni déplacé ni zoomé la carte,
 * le cadrage est refait quand la taille du conteneur change (mise en page, transition d'écran).
 */
function Cadrage({ points, surCadre }: { points: L.LatLngTuple[]; surCadre: () => void }) {
  const map = useMap();
  const libre = useRef(true);
  const cle = JSON.stringify(points);

  const cadrer = useCallback(() => {
    const liste = JSON.parse(cle) as L.LatLngTuple[];
    const taille = map.getSize();
    if (!libre.current || liste.length === 0 || taille.x === 0 || taille.y === 0) return;
    map.fitBounds(L.latLngBounds(liste), {
      paddingTopLeft: MARGE_HAUT_GAUCHE,
      paddingBottomRight: MARGE_BAS_DROITE,
      maxZoom: 15,
      animate: false,
    });
    // Les événements du cadrage peuvent précéder l'abonnement de SuiviCarte : on recalcule les repères.
    surCadre();
  }, [map, cle, surCadre]);

  useEffect(() => {
    cadrer();
  }, [cadrer]);

  // Leaflet ne voit que les changements de taille de la fenêtre : on surveille aussi le conteneur.
  useEffect(() => {
    const conteneur = map.getContainer();
    const observateur = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
      cadrer();
    });
    observateur.observe(conteneur);
    const prendreLaMain = () => {
      libre.current = false;
    };
    const evenements = ['wheel', 'mousedown', 'touchstart', 'keydown'] as const;
    evenements.forEach((e) => conteneur.addEventListener(e, prendreLaMain, { passive: true }));
    return () => {
      observateur.disconnect();
      evenements.forEach((e) => conteneur.removeEventListener(e, prendreLaMain));
    };
  }, [map, cadrer]);
  return null;
}

/**
 * À l'échelle de la ville, les bacs sont à quelques centaines de mètres de leur digesteur : leurs codes
 * se chevaucheraient. Ils s'affichent à partir de ce niveau de zoom (les points restent toujours visibles).
 */
const ZOOM_CODES_BACS = 15;

function CoucheProjetee({ donnees, masquee }: { donnees: DonneesCarte; masquee: boolean }) {
  const map = useMap();
  const codesBacs = map.getZoom() >= ZOOM_CODES_BACS;
  const position: Positionner = (o) => {
    const taille = map.getSize();
    if (taille.x === 0 || taille.y === 0) return [50, 50];
    const p = map.latLngToContainerPoint([o.latitude, o.longitude]);
    return [(p.x / taille.x) * 100, (p.y / taille.y) * 100];
  };
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-[450] transition-opacity duration-150',
        masquee ? 'opacity-0' : 'opacity-100',
      )}
    >
      <CoucheCarte {...donnees} position={position} codesBacs={codesBacs} />
    </div>
  );
}

function CarteEnLigne({
  fond,
  donnees,
  surIndisponible,
}: {
  fond: FondCarte;
  donnees: DonneesCarte;
  surIndisponible: () => void;
}) {
  const [, setVersion] = useState(0);
  const [zoomEnCours, setZoomEnCours] = useState(false);
  const imagesRecues = useRef(0);
  const erreurs = useRef(0);
  const actualiser = useCallback(() => setVersion((v) => v + 1), []);

  // Aucune image reçue au bout du délai : réseau indisponible.
  useEffect(() => {
    const minuteur = window.setTimeout(() => {
      if (imagesRecues.current === 0) surIndisponible();
    }, DELAI_IMAGES_MS);
    return () => window.clearTimeout(minuteur);
  }, [fond, surIndisponible]);

  const evenementsImages = {
    tileload: () => {
      imagesRecues.current += 1;
    },
    tileerror: () => {
      erreurs.current += 1;
      if (imagesRecues.current === 0 && erreurs.current >= 4) surIndisponible();
    },
  };

  const points: L.LatLngTuple[] = [
    ...donnees.sites.map((s): L.LatLngTuple => [s.latitude, s.longitude]),
    ...donnees.bacs.map((b): L.LatLngTuple => [b.latitude, b.longitude]),
  ];

  return (
    <MapContainer
      center={CENTRE_ABIDJAN}
      zoom={13}
      minZoom={10}
      maxZoom={18}
      zoomControl={false}
      attributionControl={false}
      className="carte-vue-globale h-full w-full bg-carte-terre"
    >
      {/* Le panneau du site occupe la gauche et les indicateurs le bas à droite. */}
      <ZoomControl position="topright" zoomInTitle="Zoomer" zoomOutTitle="Dézoomer" />
      <AttributionControl position="bottomleft" prefix={false} />
      <TileLayer
        key={fond}
        url={FONDS[fond].url}
        attribution={FONDS[fond].attribution}
        maxNativeZoom={18}
        eventHandlers={evenementsImages}
      />
      {fond === 'satellite' && <TileLayer url={NOMS_DE_LIEUX} maxNativeZoom={18} opacity={0.9} />}
      <Cadrage points={points} surCadre={actualiser} />
      <SuiviCarte surChangement={actualiser} surZoom={setZoomEnCours} />
      <CoucheProjetee donnees={donnees} masquee={zoomEnCours} />
    </MapContainer>
  );
}

export function CarteSatellite(donnees: DonneesCarte) {
  const [fond, setFond] = useState<FondCarte>('satellite');
  const [indisponible, setIndisponible] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false,
  );
  const [essai, setEssai] = useState(0);
  const signalerIndisponible = useCallback(() => setIndisponible(true), []);

  // Retour du réseau : on retente la vraie carte.
  useEffect(() => {
    const surRetour = () => {
      setIndisponible(false);
      setEssai((e) => e + 1);
    };
    window.addEventListener('online', surRetour);
    return () => window.removeEventListener('online', surRetour);
  }, []);

  return (
    <div className="absolute inset-0 isolate overflow-hidden">
      {indisponible ? (
        <CarteAbidjan {...donnees} />
      ) : (
        <CarteEnLigne key={essai} fond={fond} donnees={donnees} surIndisponible={signalerIndisponible} />
      )}

      {/* Choix du fond, sous la barre du haut */}
      <div className="absolute right-3.5 top-[58px] z-[500] flex items-center gap-2">
        {indisponible ? (
          <span className="inline-flex h-[34px] items-center gap-2 rounded-full bg-surface pl-3.5 pr-1.5 text-xs font-semibold text-texte-doux shadow-puce">
            <WifiOff className="size-4" aria-hidden />
            Carte satellite indisponible (hors ligne)
            <Button
              variante="fantome"
              taille="petite"
              onClick={() => {
                setIndisponible(false);
                setEssai((e) => e + 1);
              }}
            >
              <RotateCw /> Réessayer
            </Button>
          </span>
        ) : (
          <ChoixSegmente
            etiquette="Fond de carte"
            valeur={fond}
            surChangement={setFond}
            options={OPTIONS_FOND}
            className="bg-surface shadow-puce"
          />
        )}
      </div>
    </div>
  );
}
