import { handlersAuth } from './auth';
import { handlersEnergie } from './energie';
import { handlersNotifications } from './notifications';
import { handlersReferentiel } from './referentiel';
import { handlersSupervision } from './supervision';
import { handlersTournees } from './tournees';
import { handlersUtilisateurs } from './utilisateurs';

/** Tous les endpoints simulés (mêmes URL, champs et codes d'erreur que openapi.yaml). */
export const handlers = [
  ...handlersAuth,
  ...handlersReferentiel,
  ...handlersUtilisateurs,
  ...handlersTournees,
  ...handlersEnergie,
  ...handlersSupervision,
  ...handlersNotifications,
];
