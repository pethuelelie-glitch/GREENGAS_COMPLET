/**
 * Jetons de connexion (CLAUDE.md §5.11) :
 * - web : en mémoire seulement (perdus au rechargement de la page) ;
 * - Electron : le jeton de rafraîchissement est chiffré par `safeStorage`, via le preload.
 * Jamais de localStorage ni de sessionStorage.
 */

let acces: string | null = null;
let rafraichissement: string | null = null;

const pont = () => (typeof window !== 'undefined' ? window.greengas : undefined);

export const jetons = {
  acces: () => acces,
  rafraichissement: () => rafraichissement,

  async definir(nouveaux: { access: string; refresh: string }): Promise<void> {
    acces = nouveaux.access;
    rafraichissement = nouveaux.refresh;
    await pont()?.jeton.ecrire(nouveaux.refresh);
  },

  definirAcces(nouvelAcces: string): void {
    acces = nouvelAcces;
  },

  async effacer(): Promise<void> {
    acces = null;
    rafraichissement = null;
    await pont()?.jeton.effacer();
  },

  /** Electron : relit le jeton de rafraîchissement chiffré au démarrage. */
  async restaurer(): Promise<boolean> {
    const lu = (await pont()?.jeton.lire()) ?? null;
    rafraichissement = lu;
    return lu !== null;
  },
};
