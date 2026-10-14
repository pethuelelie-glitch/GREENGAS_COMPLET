import { config } from '@/lib/config';
import { client, executer } from './client';

export const apiSimulation = {
  scenarios: () => executer(client.GET('/simulation/scenarios/')),
  forcerFacteur: (site_id: string, facteur_mesure: number) =>
    executer(client.POST('/simulation/scenarios/', { body: { site_id, facteur_mesure } })),
  retablir: (site_id: string) =>
    executer(client.DELETE('/simulation/scenarios/{site_id}/', { params: { path: { site_id } } })),
};

/**
 * Recharge les données de départ du faux backend (utilisé par les tests).
 * Sans effet face au vrai backend.
 */
export async function reinitialiserDonnees(): Promise<boolean> {
  if (config.modeApi !== 'mock') return false;
  const { reinitialiserFauxBackend } = await import('@/mocks/envoi');
  reinitialiserFauxBackend();
  return true;
}
