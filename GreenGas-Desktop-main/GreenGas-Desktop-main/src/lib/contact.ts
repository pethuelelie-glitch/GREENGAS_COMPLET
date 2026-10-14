/**
 * Identifiants de contact des comptes (contrat 1.2.0).
 * - Téléphone : le contrat n'accepte que des numéros ivoiriens (`+225` suivi de 10 chiffres). L'indicatif est
 *   affiché devant le champ ; l'utilisateur ne saisit que les 10 chiffres.
 * - E-mail : enregistré en minuscules, il sert aussi d'identifiant de connexion.
 */
import { z } from 'zod';

export const INDICATIF = '+225';

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MESSAGE_TELEPHONE = 'Saisissez les 10 chiffres du numéro';
export const MESSAGE_EMAIL = 'Saisissez une adresse e-mail valide';

/** Chiffres locaux saisis (espaces, points, tirets ou indicatif collé tolérés) → numéro du contrat, ou null. */
export function versTelephone(saisie: string): string | null {
  const chiffres = saisie.replace(/[\s.-]/g, '').replace(/^(\+225|00225)/, '');
  return /^\d{10}$/.test(chiffres) ? INDICATIF + chiffres : null;
}

/** Numéro du contrat → 10 chiffres locaux, pour préremplir un champ. */
export function versSaisieLocale(telephone: string): string {
  return telephone.startsWith(INDICATIF) ? telephone.slice(INDICATIF.length) : telephone;
}

/** Adresse saisie → adresse normalisée (minuscules), ou null si elle est invalide. */
export function versEmail(saisie: string): string | null {
  const email = saisie.trim().toLowerCase();
  return RE_EMAIL.test(email) ? email : null;
}

/** Champ téléphone d'un formulaire : valide les 10 chiffres et renvoie le numéro complet `+225…`. */
export const schemaTelephone = z.string().transform((v, ctx) => {
  const telephone = versTelephone(v);
  if (!telephone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGE_TELEPHONE });
    return z.NEVER;
  }
  return telephone;
});

/** Champ e-mail obligatoire : renvoie l'adresse normalisée. */
export const schemaEmail = z.string().transform((v, ctx) => {
  const email = versEmail(v);
  if (!email) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGE_EMAIL });
    return z.NEVER;
  }
  return email;
});

/** Champ e-mail facultatif : vide → null. */
export const schemaEmailFacultatif = z.string().transform((v, ctx) => {
  if (!v.trim()) return null;
  const email = versEmail(v);
  if (!email) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGE_EMAIL });
    return z.NEVER;
  }
  return email;
});
