import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { RoleControlCenter } from '@/api/types';
import { EtatChargementPage } from '@/components/greengas/Etats';
import { PAGE_ACCUEIL } from './roles';
import { useSession } from './session';

/** Protège une route : connexion obligatoire, puis rôle autorisé (sinon retour à l'accueil du rôle). */
export function GardeRole({ roles, children }: { roles?: readonly RoleControlCenter[]; children: ReactNode }) {
  const { etat } = useSession();
  const location = useLocation();
  if (etat.statut === 'chargement') return <EtatChargementPage />;
  if (etat.statut === 'deconnecte') {
    // Après une expiration de session ou une ouverture directe, la connexion ramène à la page demandée.
    const state = etat.volontaire ? undefined : { depuis: location.pathname + location.search };
    return <Navigate to="/connexion" replace state={state} />;
  }
  if (roles && !roles.includes(etat.utilisateur.role)) {
    return <Navigate to={PAGE_ACCUEIL[etat.utilisateur.role]} replace />;
  }
  return <>{children}</>;
}
