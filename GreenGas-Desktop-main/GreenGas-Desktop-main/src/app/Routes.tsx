/** Routes du Control Center (docs/ROUTES.md). */
import { Navigate, Route, Routes } from 'react-router-dom';
import { GardeRole } from '@/auth/GardeRole';
import { PageConnexion } from '@/auth/PageConnexion';
import { PageInscription } from '@/auth/PageInscription';
import { ACCES } from '@/auth/roles';
import { PageAlertes } from '@/features/methanisation/pages/PageAlertes';
import { PageSite, RedirectionSites } from '@/features/methanisation/pages/PageSite';
import { PageVueGlobale } from '@/features/methanisation/pages/PageVueGlobale';
import { PageHistoriqueTris } from '@/features/tri/pages/PageHistoriqueTris';
import { PageResultatTri } from '@/features/tri/pages/PageResultatTri';
import { PageSaisieTri } from '@/features/tri/pages/PageSaisieTri';
import { PageTourneesATrier } from '@/features/tri/pages/PageTourneesATrier';
import { PageBacs } from '@/features/administration/pages/PageBacs';
import { PageCapteurs } from '@/features/administration/pages/PageCapteurs';
import { PageFicheBac } from '@/features/administration/pages/PageFicheBac';
import { PageJournal } from '@/features/administration/pages/PageJournal';
import { PageParametres } from '@/features/administration/pages/PageParametres';
import { PageSupervision } from '@/features/administration/pages/PageSupervision';
import { PageTournees } from '@/features/administration/pages/PageTournees';
import { PageTracabilite } from '@/features/administration/pages/PageTracabilite';
import { PageUtilisateurs } from '@/features/administration/pages/PageUtilisateurs';
import { PageVerifications } from '@/features/administration/pages/PageVerifications';
import { PageNotifications } from '@/features/compte/pages/PageNotifications';
import { PagePreferences } from '@/features/compte/pages/PagePreferences';
import { Coque } from './coque/Coque';
import { PageIntrouvable } from './PageIntrouvable';
import { Accueil } from './Accueil';

export function RoutesApp() {
  return (
    <Routes>
      <Route path="/connexion" element={<PageConnexion />} />
      <Route path="/inscription" element={<PageInscription />} />
      <Route
        element={
          <GardeRole>
            <Coque />
          </GardeRole>
        }
      >
        <Route index element={<Accueil />} />

        <Route
          path="tri"
          element={
            <GardeRole roles={ACCES.triLecture}>
              <PageTourneesATrier />
            </GardeRole>
          }
        />
        <Route
          path="tri/historique"
          element={
            <GardeRole roles={ACCES.triLecture}>
              <PageHistoriqueTris />
            </GardeRole>
          }
        />
        <Route
          path="tri/:tourneeId/saisie"
          element={
            <GardeRole roles={ACCES.triSaisie}>
              <PageSaisieTri />
            </GardeRole>
          }
        />
        <Route
          path="tri/:tourneeId/resultat"
          element={
            <GardeRole roles={ACCES.triLecture}>
              <PageResultatTri />
            </GardeRole>
          }
        />

        <Route
          path="methanisation"
          element={
            <GardeRole roles={ACCES.methanisation}>
              <PageVueGlobale />
            </GardeRole>
          }
        />
        <Route
          path="methanisation/sites"
          element={
            <GardeRole roles={ACCES.methanisation}>
              <RedirectionSites />
            </GardeRole>
          }
        />
        <Route
          path="methanisation/sites/:siteId"
          element={
            <GardeRole roles={ACCES.methanisation}>
              <PageSite />
            </GardeRole>
          }
        />
        <Route
          path="methanisation/alertes"
          element={
            <GardeRole roles={ACCES.methanisation}>
              <PageAlertes />
            </GardeRole>
          }
        />

        <Route
          path="admin"
          element={
            <GardeRole roles={ACCES.administration}>
              <PageSupervision />
            </GardeRole>
          }
        />
        <Route
          path="admin/tracabilite"
          element={
            <GardeRole roles={ACCES.administration}>
              <PageTracabilite />
            </GardeRole>
          }
        />
        <Route
          path="admin/verifications"
          element={
            <GardeRole roles={ACCES.verifications}>
              <PageVerifications />
            </GardeRole>
          }
        />
        <Route
          path="admin/utilisateurs"
          element={
            <GardeRole roles={ACCES.administration}>
              <PageUtilisateurs />
            </GardeRole>
          }
        />
        <Route
          path="admin/bacs"
          element={
            <GardeRole roles={ACCES.administration}>
              <PageBacs />
            </GardeRole>
          }
        />
        <Route
          path="admin/bacs/:bacId"
          element={
            <GardeRole roles={ACCES.administration}>
              <PageFicheBac />
            </GardeRole>
          }
        />
        <Route
          path="admin/tournees"
          element={
            <GardeRole roles={ACCES.administration}>
              <PageTournees />
            </GardeRole>
          }
        />
        <Route
          path="admin/parametres"
          element={
            <GardeRole roles={ACCES.administration}>
              <PageParametres />
            </GardeRole>
          }
        />
        <Route
          path="admin/journal"
          element={
            <GardeRole roles={ACCES.administration}>
              <PageJournal />
            </GardeRole>
          }
        />
        <Route
          path="admin/capteurs"
          element={
            <GardeRole roles={ACCES.administration}>
              <PageCapteurs />
            </GardeRole>
          }
        />

        <Route path="preferences" element={<PagePreferences />} />
        <Route path="notifications" element={<PageNotifications />} />

        <Route path="*" element={<PageIntrouvable />} />
      </Route>
      <Route path="*" element={<Navigate to="/connexion" replace />} />
    </Routes>
  );
}
