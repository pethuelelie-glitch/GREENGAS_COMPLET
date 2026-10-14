/** QR code d'un bac : il contient seulement le code (`BAC-014`), jamais une URL (Guide commun §4). */
import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

export function QrCodeBac({ code, taille = 168 }: { code: string; taille?: number }) {
  const { chemin, n } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(code);
    qr.make();
    const nb = qr.getModuleCount();
    let d = '';
    for (let y = 0; y < nb; y++) for (let x = 0; x < nb; x++) if (qr.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
    return { chemin: d, n: nb };
  }, [code]);
  return (
    <svg
      viewBox={`-2 -2 ${n + 4} ${n + 4}`}
      width={taille}
      height={taille}
      role="img"
      aria-label={`QR code du bac ${code}`}
      className="rounded-xl border border-bordure bg-surface"
      shapeRendering="crispEdges"
    >
      <path d={chemin} fill="var(--vert-foret)" />
    </svg>
  );
}
