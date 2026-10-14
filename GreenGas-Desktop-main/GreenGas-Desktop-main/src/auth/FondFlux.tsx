/** Fond décoratif de la connexion : des flux de collecte convergent lentement vers trois digesteurs. */
const FLUX = [
  'M-40 120 C 240 160, 420 260, 560 330',
  'M120 -40 C 220 140, 420 200, 560 330',
  'M-40 520 C 200 470, 380 380, 560 330',
  'M1480 90 C 1260 140, 1060 260, 900 300',
  'M1480 420 C 1240 400, 1080 340, 900 300',
  'M1100 -40 C 1060 120, 980 220, 900 300',
  'M300 940 C 420 820, 620 700, 720 640',
  'M1200 940 C 1060 820, 840 700, 720 640',
  'M-40 760 C 240 720, 520 680, 720 640',
];
const SITES: [number, number][] = [
  [560, 330],
  [900, 300],
  [720, 640],
];

export function FondFlux() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <g fill="none" stroke="var(--vert)" strokeWidth="2" strokeLinecap="round" opacity="0.22">
        {FLUX.map((d, i) => (
          <path
            key={d}
            d={d}
            strokeDasharray="4 14"
            className="animate-flux"
            style={{ animationDuration: `${2.4 + (i % 3) * 0.7}s` }}
          />
        ))}
      </g>
      {SITES.map(([x, y]) => (
        <g key={`${x}-${y}`} opacity="0.35">
          <circle
            cx={x}
            cy={y}
            r="26"
            fill="none"
            stroke="var(--vert-foret)"
            strokeWidth="2"
            className="origin-center animate-pulsation"
            style={{ transformBox: 'fill-box' }}
          />
          <circle cx={x} cy={y} r="9" fill="var(--vert-foret)" />
        </g>
      ))}
    </svg>
  );
}
