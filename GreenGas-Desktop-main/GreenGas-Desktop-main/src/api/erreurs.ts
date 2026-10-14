/**
 * Lecture du format d'erreur commun `{code, message, details}` (Guide commun §11).
 * Les écrans décident selon `code` et affichent `message` tel quel.
 */
import type { CodeErreur } from './types';

/**
 * Codes propres au client, absents du contrat : `SERVEUR_INJOIGNABLE` (pas de réponse du serveur) et
 * `COMPTE_MOBILE` (compte citoyen, collecteur ou capteur, refusé par le Control Center).
 */
export type CodeErreurClient = CodeErreur | 'SERVEUR_INJOIGNABLE' | 'COMPTE_MOBILE';

export class ErreurApi extends Error {
  readonly status: number;
  readonly code: CodeErreurClient;
  readonly details: Record<string, unknown>;

  constructor(status: number, code: CodeErreurClient, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ErreurApi';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Construit l'erreur à partir du corps renvoyé par l'API. */
  static depuis(status: number, corps: unknown): ErreurApi {
    if (corps && typeof corps === 'object' && 'code' in corps && 'message' in corps) {
      const c = corps as { code: CodeErreur; message: string; details?: Record<string, unknown> };
      return new ErreurApi(status, c.code, c.message, c.details ?? {});
    }
    return new ErreurApi(status, 'ERREUR_SERVEUR', 'Le serveur a renvoyé une réponse inattendue.');
  }

  static injoignable(): ErreurApi {
    return new ErreurApi(0, 'SERVEUR_INJOIGNABLE', 'Le serveur ne répond pas. Vérifiez la connexion, puis réessayez.');
  }
}

export const MESSAGE_ACCES_REFUSE = 'Action non autorisée pour votre rôle';

/** Message à afficher pour une erreur quelconque (le 403 a un texte fixe, CLAUDE.md §5.12). */
export function messageErreur(erreur: unknown): string {
  if (erreur instanceof ErreurApi) {
    return erreur.code === 'ACCES_REFUSE' ? MESSAGE_ACCES_REFUSE : erreur.message;
  }
  return 'Une erreur inattendue est survenue.';
}

export function codeErreur(erreur: unknown): CodeErreurClient | null {
  return erreur instanceof ErreurApi ? erreur.code : null;
}

/** Messages de validation par champ (`details` d'une erreur `VALIDATION`). */
export function erreursDeChamps(erreur: unknown): Record<string, string> {
  if (!(erreur instanceof ErreurApi) || erreur.code !== 'VALIDATION') return {};
  const sortie: Record<string, string> = {};
  for (const [champ, messages] of Object.entries(erreur.details)) {
    if (Array.isArray(messages) && typeof messages[0] === 'string') sortie[champ] = messages[0];
  }
  return sortie;
}
