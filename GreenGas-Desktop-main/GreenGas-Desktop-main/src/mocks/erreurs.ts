import type { CodeErreur } from '@/api/types';

/** Erreur métier du faux backend, renvoyée au format `{code, message, details}` (Guide commun §11). */
export class ErreurMock extends Error {
  readonly status: number;
  readonly code: CodeErreur;
  readonly details: Record<string, unknown>;

  constructor(status: number, code: CodeErreur, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const introuvable = (objet: string) => new ErreurMock(404, 'INTROUVABLE', `${objet} introuvable`);

export const validation = (champ: string, message: string) =>
  new ErreurMock(400, 'VALIDATION', message, { [champ]: [message] });

export const accesRefuse = (message = "Action non autorisée pour ce rôle") =>
  new ErreurMock(403, 'ACCES_REFUSE', message);
