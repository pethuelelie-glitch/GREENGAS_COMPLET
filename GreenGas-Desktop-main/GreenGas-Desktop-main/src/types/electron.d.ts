/** Fonctions exposées par `electron/preload.ts` (absentes dans le navigateur). */
interface PontGreengas {
  jeton: {
    lire(): Promise<string | null>;
    ecrire(valeur: string): Promise<void>;
    effacer(): Promise<void>;
  };
  plateforme: 'electron';
  version: string;
}

interface Window {
  greengas?: PontGreengas;
}
