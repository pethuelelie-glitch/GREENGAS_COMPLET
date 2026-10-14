/**
 * Formats d'affichage français (CLAUDE.md §5.9). Aucune valeur métier n'est calculée ici :
 * ces fonctions mettent seulement en forme ce que l'API renvoie.
 */

const MOINS = '−'; // signe moins typographique
const ESPACE_INSECABLE = ' ';
export const TIRET_VIDE = '—';

const formateurs = new Map<string, Intl.NumberFormat>();

function formateur(decimales: number, signe: boolean): Intl.NumberFormat {
  const cle = `${decimales}-${signe}`;
  let f = formateurs.get(cle);
  if (!f) {
    f = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
      signDisplay: signe ? 'exceptZero' : 'auto',
    });
    formateurs.set(cle, f);
  }
  return f;
}

/** Nombre au format français : `1 785`, `8,54`, `−30,0`. `null` → « — ». */
export function nombre(valeur: number | null | undefined, decimales = 0, signe = false): string {
  if (valeur == null || Number.isNaN(valeur)) return TIRET_VIDE;
  return formateur(decimales, signe).format(valeur).replace('-', MOINS);
}

/** Nombre suivi de son unité, séparés par une espace insécable : `34,0 kg`. */
export function avecUnite(valeur: number | null | undefined, unite: string, decimales = 0): string {
  if (valeur == null) return TIRET_VIDE;
  return `${nombre(valeur, decimales)}${ESPACE_INSECABLE}${unite}`;
}

export const kg = (v: number | null | undefined, d = 0) => avecUnite(v, 'kg', d);
export const m3 = (v: number | null | undefined, d = 1) => avecUnite(v, 'm³', d);
export const kwh = (v: number | null | undefined, d = 2) => avecUnite(v, 'kWh', d);

/** Pourcentage déjà exprimé en points (20 = 20 %), signé : `−30,0 %`, `+2,0 %`. */
export function pourcentage(valeur: number | null | undefined, decimales = 1, signe = true): string {
  if (valeur == null) return TIRET_VIDE;
  return `${nombre(valeur, decimales, signe)}${ESPACE_INSECABLE}%`;
}

/** Points GreenPoints (entiers). */
export const points = (v: number | null | undefined) => nombre(v, 0);

const FUSEAU = 'Africa/Abidjan'; // UTC+0, sans heure d'été

const fmtDate = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: FUSEAU,
});
const fmtHeure = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: FUSEAU,
});
const fmtJourMois = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', timeZone: FUSEAU });
const fmtJourLong = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: FUSEAU,
});

function versDate(valeur: string): Date {
  // Une date seule (AAAA-MM-JJ) est lue à midi UTC pour ne jamais changer de jour.
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(valeur) ? `${valeur}T12:00:00Z` : valeur);
}

/** `2026-09-12` ou `2026-09-12T08:30:00Z` → `12/09/2026`. */
export function date(valeur: string | null | undefined): string {
  if (!valeur) return TIRET_VIDE;
  return fmtDate.format(versDate(valeur));
}

/** `2026-09-12T08:30:00Z` → `12/09/2026 08:30`. */
export function dateHeure(valeur: string | null | undefined): string {
  if (!valeur) return TIRET_VIDE;
  const d = versDate(valeur);
  return `${fmtDate.format(d)} ${fmtHeure.format(d)}`;
}

/** `2026-09-12T08:30:00Z` → `08:30`. */
export function heure(valeur: string | null | undefined): string {
  if (!valeur) return TIRET_VIDE;
  return fmtHeure.format(versDate(valeur));
}

/** `2026-09-12` → `12/09` (axes des graphiques). */
export function jourMois(valeur: string | null | undefined): string {
  if (!valeur) return TIRET_VIDE;
  return fmtJourMois.format(versDate(valeur));
}

/** `2026-09-12` → `samedi 12 septembre 2026`. */
export function jourLong(valeur: string): string {
  return fmtJourLong.format(versDate(valeur));
}

/** Téléphone `+2250701020304` → `+225 07 01 02 03 04`. */
export function telephone(valeur: string | null | undefined): string {
  if (!valeur) return TIRET_VIDE;
  const m = /^\+225(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(valeur);
  return m ? `+225 ${m.slice(1).join(' ')}` : valeur;
}

/** Initiales d'un avatar : première lettre du premier et du dernier mot (`Aya Opératrice` → `AO`). */
export function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return '?';
  const derniere = mots.length > 1 ? mots[mots.length - 1][0] : '';
  return (mots[0][0] + derniere).toUpperCase();
}

/** Accord simple : `1 occurrence`, `3 occurrences`. */
export function pluriel(n: number, singulier: string, plurielForme = `${singulier}s`): string {
  return `${nombre(n)}${ESPACE_INSECABLE}${Math.abs(n) > 1 ? plurielForme : singulier}`;
}
