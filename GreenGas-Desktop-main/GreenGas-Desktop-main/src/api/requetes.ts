/** Types des paramètres de requête, déduits du contrat. */
import type { operations } from './schema';

type Query<O extends keyof operations> = NonNullable<operations[O]['parameters']['query']>;

export type FiltresTournees = Omit<Query<'tournees_lister'>, 'page' | 'taille_page'>;
export type FiltresBacs = Omit<Query<'bacs_lister'>, 'page' | 'taille_page'>;
export type FiltresUtilisateurs = Omit<Query<'utilisateurs_lister'>, 'page' | 'taille_page'>;
export type FiltresCollectes = Omit<Query<'collectes_lister'>, 'page' | 'taille_page'>;
export type FiltresScans = Omit<Query<'scans_lister'>, 'page' | 'taille_page'>;
export type FiltresLots = Omit<Query<'lots_lister'>, 'page' | 'taille_page'>;
export type FiltresTransactions = Omit<Query<'greenpoints_transactions_lister'>, 'page' | 'taille_page'>;
export type FiltresProductions = Omit<Query<'productions_lister'>, 'page' | 'taille_page'>;
export type FiltresAlertes = Omit<Query<'alertes_lister'>, 'page' | 'taille_page'>;
export type FiltresJournal = Omit<Query<'journal_lister'>, 'page' | 'taille_page'>;
export type FiltresVerifications = Query<'verifications_lister'>;
