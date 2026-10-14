/**
 * Point d'entrée du faux backend, utilisé par src/api/client.ts quand VITE_API_MODE=mock.
 *
 * Les requêtes sont résolues directement par les handlers MSW (`getResponse`), sans Service Worker :
 * le même mécanisme fonctionne dans le navigateur, dans Electron (protocole app://) et dans Vitest.
 */
import { getResponse, HttpResponse } from 'msw';
import { reinitialiser } from './base';
import { handlers } from './handlers';

export async function envoyerAuFauxBackend(requete: Request): Promise<Response> {
  const reponse = await getResponse(handlers, requete);
  return (
    reponse ??
    HttpResponse.json(
      {
        code: 'INTROUVABLE',
        message: `Route inconnue : ${requete.method} ${new URL(requete.url).pathname}`,
        details: {},
      },
      { status: 404 },
    )
  );
}

export { reinitialiser as reinitialiserFauxBackend };
