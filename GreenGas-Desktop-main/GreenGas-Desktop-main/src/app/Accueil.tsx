import { Navigate } from 'react-router-dom';
import { PAGE_ACCUEIL } from '@/auth/roles';
import { useUtilisateur } from '@/auth/session';

/** `/` mène à la page d'arrivée du rôle connecté. */
export function Accueil() {
  return <Navigate to={PAGE_ACCUEIL[useUtilisateur().role]} replace />;
}
