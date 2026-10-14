/**
 * M2 · Tableau de bord d'un site : attendu / mesuré sur 8 jours, écart du jour, énergie,
 * sondes du digesteur, hypothèses de calcul, clôture de la journée et maintenance.
 */
import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronRight, Lock, Wrench } from 'lucide-react';
import type { DestinationDigestat, ProductionEnergie, StatutDonnee } from '@/api/types';
import { useUtilisateur } from '@/auth/session';
import { Bandeau } from '@/components/greengas/Bandeau';
import { badge, BadgeProvenance, LegendeProvenance } from '@/components/greengas/BadgeProvenance';
import { Carte } from '@/components/greengas/Carte';
import { MiniCourbe } from '@/components/greengas/Courbes';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { EtatChargementPage, EtatErreur } from '@/components/greengas/Etats';
import { GraphiqueAttenduMesure } from '@/components/greengas/GraphiqueAttenduMesure';
import { JaugeEcart } from '@/components/greengas/JaugeEcart';
import { ModaleConfirmation } from '@/components/greengas/ModaleConfirmation';
import { useNotifications } from '@/components/greengas/Notifications';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { ValeurAnimee } from '@/components/greengas/ValeurAnimee';
import { Button } from '@/components/ui/button';
import { ChoixSegmente } from '@/components/ui/choix-segmente';
import { Onglets } from '@/components/ui/onglets';
import { Select } from '@/components/ui/select';
import { useParametres, useSites, valeurParametre } from '@/hooks/referentiel';
import { cascade } from '@/lib/animations';
import { config } from '@/lib/config';
import { decalerJours } from '@/lib/dates';
import { date, jourLong, nombre } from '@/lib/format';
import { LIBELLE_DESTINATION_DIGESTAT } from '@/lib/libelles';
import { STATUT_JOURNEE, STATUT_SITE } from '@/lib/statuts';
import { cn } from '@/lib/utils';
import { useAlertes, useChangerStatutSite, useCloturerJournee, useProductions } from '../hooks/requetes';

/** Historique affiché : les 7 jours qui précèdent la date de travail. */
const DEBUT_HISTORIQUE = decalerJours(config.dateTravail, -7);

export function RedirectionSites() {
  const sites = useSites();
  if (!sites.data) return <EtatChargementPage />;
  const cible = sites.data.find((s) => s.statut === 'alerte') ?? sites.data[0];
  return cible ? <Navigate to={`/methanisation/sites/${cible.id}`} replace /> : <EtatChargementPage />;
}

function Ligne({ libelle, valeur, provenance }: { libelle: string; valeur: ReactNode; provenance?: StatutDonnee }) {
  return (
    <motion.div
      variants={{ cache: { opacity: 0, x: -6 }, visible: { opacity: 1, x: 0 } }}
      className="grid grid-cols-[1fr_auto_74px] items-center gap-2 py-1.5"
    >
      <span>{libelle}</span>
      <b className="text-right tabular-nums">{valeur}</b>
      <span className="flex justify-end">
        <BadgeProvenance statut={provenance} />
      </span>
    </motion.div>
  );
}

export function PageSite() {
  const { siteId } = useParams();
  const u = useUtilisateur();
  const navigate = useNavigate();
  const { succes } = useNotifications();
  const sites = useSites({ suivi: true });
  const parametres = useParametres();
  const productions = useProductions({ site_id: siteId, date_debut: DEBUT_HISTORIQUE, date_fin: config.dateTravail }, !!siteId);
  const alertes = useAlertes({ site_id: siteId });
  const cloturer = useCloturerJournee();
  const changerStatut = useChangerStatutSite();
  const [jour, setJour] = useState(config.dateTravail);
  const [modale, setModale] = useState<'cloture' | 'maintenance' | null>(null);
  const [destination, setDestination] = useState<DestinationDigestat>('vente_agricole');

  if (sites.error || productions.error) {
    return <EtatErreur erreur={sites.error ?? productions.error} reessayer={() => void productions.refetch()} />;
  }
  const site = sites.data?.find((s) => s.id === siteId);
  if (sites.data && !site) return <Navigate to="/methanisation/sites" replace />;
  if (!site || !productions.data) return <EtatChargementPage />;

  const chronologique = [...productions.data].sort((a, b) => a.date.localeCompare(b.date));
  const p: ProductionEnergie | undefined = productions.data.find((x) => x.date === jour);
  const sd = p?.statuts_donnees;
  const seuil = valeurParametre(parametres.data, 'seuil_alerte_production_pct') ?? 20;
  const datesEnAlerte = new Set(
    (alertes.data ?? []).filter((a) => a.type === 'production').flatMap((a) => [a.date_creation.slice(0, 10), a.date_derniere_occurrence.slice(0, 10)]),
  );
  const jourEnAlerte = datesEnAlerte.has(jour) && site.statut === 'alerte';
  const cloturee = p?.statut_journee === 'cloturee';
  const mesureRecue = p?.biogaz_mesure_m3 != null;
  const param = (cle: Parameters<typeof valeurParametre>[1]) => valeurParametre(parametres.data, cle);
  const peutGererSite = u.role === 'responsable_methanisation' || u.role === 'administrateur';

  return (
    <motion.div initial="cache" animate="visible" variants={cascade(0.07)}>
      <EnTetePage titre="Sites" sousTitre="Détail par digesteur : production, énergie et sondes." />
      <Onglets
        className="mb-4"
        etiquette="Sites de méthanisation"
        valeur={site.id}
        surChangement={(id) => navigate(`/methanisation/sites/${id}`)}
        onglets={(sites.data ?? []).map((s) => ({
          valeur: s.id,
          libelle: (
            <>
              <span className="font-mono">{s.code}</span> · {s.nom}
            </>
          ),
          compteur: s.alertes_ouvertes,
        }))}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold">
          <span className="font-mono">{site.code}</span> · {site.nom}
        </h2>
        <PastilleStatut statut={STATUT_SITE[site.statut]} pulse />
        <span className="flex-1" />
        <Select
          etiquette="Jour affiché"
          valeur={jour}
          surChangement={setJour}
          options={[...productions.data].map((x) => ({ valeur: x.date, libelle: x.date === config.dateTravail ? `Aujourd'hui · ${date(x.date)}` : date(x.date) }))}
        />
        {peutGererSite &&
          (site.statut === 'maintenance' ? (
            <Button variante="contour" onClick={() => setModale('maintenance')}>
              <Wrench /> Remettre en service
            </Button>
          ) : (
            <Button variante="contour" onClick={() => setModale('maintenance')}>
              <Wrench /> Mettre en maintenance
            </Button>
          ))}
      </div>

      {site.statut === 'maintenance' && (
        <Bandeau type="cloture">Site en maintenance : les nouvelles tournées du secteur sont envoyées vers le site de repli.</Bandeau>
      )}
      {cloturee && p && (
        <Bandeau type="cloture">
          Journée du {date(p.date)} clôturée · digestat :{' '}
          {p.destination_digestat ? LIBELLE_DESTINATION_DIGESTAT[p.destination_digestat].toLowerCase() : '—'}. Les valeurs sont verrouillées.
        </Bandeau>
      )}

      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <Carte
          titre={`${site.code} · biogaz attendu et mesuré (${chronologique.length} jours)`}
          action={<BadgeProvenance statut={badge(sd, 'biogaz_mesure_m3')} />}
        >
          <GraphiqueAttenduMesure productions={chronologique} seuilPct={seuil} datesEnAlerte={datesEnAlerte} />
        </Carte>
        <Carte className="flex flex-col items-center text-center" enAlerte={jourEnAlerte}>
          <div className="w-full max-w-[300px]">
            <JaugeEcart
              ecartPct={p?.ecart_pct}
              seuilPct={seuil}
              enAlerte={jourEnAlerte}
              messageAttente={p && p.poids_organique_recu_kg > 0 ? 'En attente de la mesure' : 'Aucune matière reçue'}
            />
          </div>
          <div className={cn('text-[44px] font-bold leading-none', jourEnAlerte ? 'text-statut-alerte' : 'text-texte')}>
            {p?.ecart_pct != null ? (
              <ValeurAnimee valeur={p.ecart_pct} formater={(v) => `${nombre(v, 1, true)} %`} />
            ) : (
              '—'
            )}
          </div>
          <div className="my-2 flex items-center gap-2 text-[13px] text-texte-doux">
            écart du jour <BadgeProvenance statut={badge(sd, 'ecart_pct')} />
          </div>
          <p className="mb-3 text-xs text-texte-doux">{p ? jourLong(p.date) : ''}</p>
          {p &&
            (cloturee ? (
              <PastilleStatut statut={STATUT_JOURNEE.cloturee} libelle="Journée clôturée" />
            ) : u.role === 'responsable_methanisation' ? (
              <Button
                onClick={() => setModale('cloture')}
                disabled={!mesureRecue}
                title={mesureRecue ? undefined : 'Disponible après la mesure de gaz du site'}
              >
                <Lock /> Clôturer la journée
              </Button>
            ) : (
              <PastilleStatut statut={STATUT_JOURNEE.ouverte} libelle="Journée ouverte" />
            ))}
        </Carte>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <Carte titre="Aujourd'hui">
          <motion.div initial="cache" animate="visible" variants={cascade(0.06, 0.2)}>
            <Ligne libelle="Organique reçu" valeur={<ValeurAnimee valeur={p?.poids_organique_recu_kg} formater={(v) => `${nombre(v)} kg`} />} provenance={badge(sd, 'poids_organique_recu_kg')} />
            <Ligne libelle="Biogaz attendu" valeur={<ValeurAnimee valeur={p?.biogaz_attendu_m3} formater={(v) => `${nombre(v, 1)} m³`} />} provenance={badge(sd, 'biogaz_attendu_m3')} />
            <Ligne libelle="Biogaz mesuré" valeur={mesureRecue ? <ValeurAnimee valeur={p?.biogaz_mesure_m3} formater={(v) => `${nombre(v, 1)} m³`} /> : 'en attente'} provenance={badge(sd, 'biogaz_mesure_m3')} />
          </motion.div>
        </Carte>
        <Carte titre="Énergie">
          {mesureRecue ? (
            <motion.div initial="cache" animate="visible" variants={cascade(0.06, 0.25)}>
              <Ligne libelle="Électricité" valeur={<ValeurAnimee valeur={p?.electricite_kwh} formater={(v) => `${nombre(v, 2)} kWh`} />} provenance={badge(sd, 'electricite_kwh')} />
              <Ligne libelle="Chaleur" valeur={<ValeurAnimee valeur={p?.chaleur_kwh} formater={(v) => `${nombre(v, 2)} kWh`} />} provenance={badge(sd, 'chaleur_kwh')} />
              <Ligne libelle="Digestat" valeur={<ValeurAnimee valeur={p?.digestat_kg} formater={(v) => `${nombre(v)} kg`} />} provenance={badge(sd, 'digestat_kg')} />
              <Ligne libelle="Foyers équivalents" valeur={<ValeurAnimee valeur={p?.foyers_equivalents} decimales={1} />} provenance={badge(sd, 'foyers_equivalents')} />
            </motion.div>
          ) : (
            <div className="rounded-xl bg-vert-pale px-4 py-6 text-center text-[13px] text-texte-doux">
              <span className="mx-auto mb-2 block size-2.5 animate-ping rounded-full bg-statut-attention" />
              {p && p.poids_organique_recu_kg > 0 ? 'En attente de la mesure du compteur' : "Aucune matière reçue aujourd'hui"}
            </div>
          )}
        </Carte>
        <Carte titre="Digesteur">
          <motion.div initial="cache" animate="visible" variants={cascade(0.06, 0.3)}>
            {(
              [
                ['Méthane (CH₄)', 'ch4_pct', 0, ' %'],
                ['Température', 'temperature_c', 1, ' °C'],
                ['pH', 'ph', 1, ''],
              ] as const
            ).map(([libelle, champ, d, unite]) => (
              <motion.div
                key={champ}
                variants={{ cache: { opacity: 0, x: -6 }, visible: { opacity: 1, x: 0 } }}
                className="grid grid-cols-[1fr_84px_auto_74px] items-center gap-2 py-1"
              >
                <span>{libelle}</span>
                <MiniCourbe valeurs={chronologique.map((x) => x[champ])} />
                <b className="text-right">{p?.[champ] == null ? '—' : `${nombre(p[champ], d)}${unite}`}</b>
                <span className="flex justify-end">
                  <BadgeProvenance statut={badge(sd, champ)} />
                </span>
              </motion.div>
            ))}
          </motion.div>
          <Collapsible.Root className="mt-2 rounded-xl bg-vert-pale px-3.5 py-2.5 text-[13px] text-texte-doux">
            <Collapsible.Trigger className="group flex w-full items-center gap-1.5 font-semibold text-texte">
              <ChevronRight className="size-4 transition-transform group-data-[state=open]:rotate-90" />
              Hypothèses de calcul
            </Collapsible.Trigger>
            <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
              <p className="mt-2">
                {nombre(param('coefficient_biogaz_m3_par_kg'), 2)} m³ de biogaz par kg d'organique ;{' '}
                {nombre(param('coefficient_electricite_kwh_par_m3'), 1)} kWh d'électricité et {nombre(param('coefficient_chaleur_kwh_par_m3'), 1)} kWh de
                chaleur par m³ ; {nombre(param('conso_electrique_foyer_kwh_an'))} kWh par foyer et par an ; seuil d'alerte ±{nombre(seuil)} %.
              </p>
              {u.role === 'administrateur' && (
                <Link to="/admin/parametres" className="mt-1 inline-block font-semibold text-vert underline underline-offset-2">
                  Voir les paramètres
                </Link>
              )}
            </Collapsible.Content>
          </Collapsible.Root>
        </Carte>
      </div>
      <LegendeProvenance className="mt-[18px]" />

      <ModaleConfirmation
        ouverte={modale === 'cloture'}
        surFermer={() => setModale(null)}
        titre={`Clôturer la journée du ${p ? date(p.date) : ''}`}
        libelleConfirmer="Clôturer"
        surConfirmer={async () => {
          if (!p) return;
          await cloturer.mutateAsync({ id: p.id, destination });
          succes('Journée clôturée', `${site.code} · ${LIBELLE_DESTINATION_DIGESTAT[destination].toLowerCase()}`);
        }}
      >
        <p className="mb-3">Choisissez la destination du digestat (obligatoire). Les valeurs de la journée seront verrouillées.</p>
        <ChoixSegmente
          etiquette="Destination du digestat"
          valeur={destination}
          surChangement={setDestination}
          options={(['vente_agricole', 'stockage'] as const).map((d) => ({
            valeur: d,
            libelle: d === 'vente_agricole' ? 'Vente agricole' : 'Stockage',
          }))}
        />
      </ModaleConfirmation>

      <ModaleConfirmation
        ouverte={modale === 'maintenance'}
        surFermer={() => setModale(null)}
        titre={site.statut === 'maintenance' ? `Remettre ${site.code} en service` : `Mettre ${site.code} en maintenance`}
        libelleConfirmer="Confirmer"
        surConfirmer={async () => {
          const statut = site.statut === 'maintenance' ? 'nominal' : 'maintenance';
          await changerStatut.mutateAsync({ id: site.id, statut });
          succes(statut === 'maintenance' ? 'Site mis en maintenance' : 'Site remis en service');
        }}
      >
        {site.statut === 'maintenance'
          ? 'Le site reçoit de nouveau les tournées de son secteur.'
          : 'Les prochaines tournées du secteur seront envoyées vers le site de repli. Les alertes ouvertes restent à traiter.'}
      </ModaleConfirmation>
    </motion.div>
  );
}
