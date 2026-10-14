/**
 * A9 · Capteurs : compteurs de gaz et sondes des trois digesteurs (simulateur IoT),
 * avec le forçage du facteur de production d'un site (−30 % pour déclencher l'alerte).
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, RotateCcw, TrendingDown } from 'lucide-react';
import { messageErreur } from '@/api/erreurs';
import type { ProductionEnergie, Site } from '@/api/types';
import { badge, BadgeProvenance, LegendeProvenance } from '@/components/greengas/BadgeProvenance';
import { Carte } from '@/components/greengas/Carte';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { EtatChargement, EtatErreur } from '@/components/greengas/Etats';
import { useNotifications } from '@/components/greengas/Notifications';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { ValeurAnimee } from '@/components/greengas/ValeurAnimee';
import { Button } from '@/components/ui/button';
import { useSites } from '@/hooks/referentiel';
import { cascade } from '@/lib/animations';
import { config } from '@/lib/config';
import { date, nombre } from '@/lib/format';
import { STATUT_SITE } from '@/lib/statuts';
import { cn } from '@/lib/utils';
import { useForcerFacteur, useProductionsDuJour, useRetablirNominal, useScenarios } from '../hooks/requetes';

const FACTEUR_BAISSE = 0.7;

export function PageCapteurs() {
  const sites = useSites({ suivi: true });
  const scenarios = useScenarios();
  const globale = useProductionsDuJour(config.dateTravail);

  return (
    <motion.div initial="cache" animate="visible" variants={cascade(0.1)}>
      <EnTetePage titre="Capteurs" sousTitre="Compteurs de gaz et sondes des trois digesteurs." />
      {sites.error || scenarios.error ? (
        <EtatErreur erreur={sites.error ?? scenarios.error} reessayer={() => void Promise.all([sites.refetch(), scenarios.refetch()])} />
      ) : !sites.data || !scenarios.data ? (
        <EtatChargement />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {sites.data.map((s) => (
            <CarteCapteur
              key={s.id}
              site={s}
              facteur={scenarios.data.find((x) => x.site_id === s.id)?.facteur_mesure ?? null}
              production={globale.data?.par_site.find((p) => p.site_id === s.id)}
            />
          ))}
        </div>
      )}
      <p className="mt-3.5 text-[13px] text-texte-doux">
        Les capteurs des digesteurs envoient leurs mesures au serveur par les mêmes points d'entrée qu'un compteur physique.
        Un facteur forcé reste actif jusqu'au rétablissement de la production nominale.
      </p>
      <LegendeProvenance className="mt-[18px]" />
    </motion.div>
  );
}

function CarteCapteur({ site, facteur, production }: { site: Site; facteur: number | null; production: ProductionEnergie | undefined }) {
  const { succes, erreur } = useNotifications();
  const forcer = useForcerFacteur();
  const retablir = useRetablirNominal();
  const [action, setAction] = useState<'baisse' | 'nominal' | null>(null);
  const sd = production?.statuts_donnees;

  async function executer(type: 'baisse' | 'nominal') {
    setAction(type);
    try {
      if (type === 'baisse') {
        await forcer.mutateAsync({ siteId: site.id, facteur: FACTEUR_BAISSE });
        succes(
          production?.poids_organique_recu_kg ? 'Baisse de production injectée' : 'Facteur enregistré',
          production?.poids_organique_recu_kg ? site.code : `s'appliquera à la prochaine mesure de ${site.code}`,
        );
      } else {
        await retablir.mutateAsync(site.id);
        succes('Production nominale rétablie', site.code);
      }
    } catch (e) {
      erreur(messageErreur(e));
    } finally {
      setAction(null);
    }
  }

  return (
    <Carte enAlerte={site.statut === 'alerte'} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[15px] font-bold">
          <span className="font-mono">{site.code}</span>
          <span className="ml-2 text-[12.5px] font-medium text-texte-doux">{site.nom}</span>
        </div>
        <PastilleStatut statut={STATUT_SITE[site.statut]} pulse />
      </div>
      <div className="flex items-center justify-between border-b border-bordure pb-2.5">
        <span>Source des mesures</span>
        <BadgeProvenance statut={badge(sd, 'biogaz_mesure_m3') ?? 'simule'} />
      </div>
      <div className="flex items-center justify-between border-b border-bordure pb-2.5">
        <span>Mesure du jour</span>
        <b className="flex items-center gap-2">
          {production?.biogaz_mesure_m3 != null ? (
            <>
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-statut-ok opacity-60" />
                <span className="relative size-2 rounded-full bg-statut-ok" />
              </span>
              <ValeurAnimee valeur={production.biogaz_mesure_m3} formater={(v) => `${nombre(v, 1)} m³`} />
              <span className="font-normal text-texte-doux">/ {nombre(production.biogaz_attendu_m3, 1)} m³</span>
            </>
          ) : production && production.poids_organique_recu_kg > 0 ? (
            'en attente'
          ) : (
            `aucune matière le ${date(config.dateTravail)}`
          )}
        </b>
      </div>
      <div className="flex items-baseline gap-2">
        <motion.span
          key={facteur ?? 'nominal'}
          initial={{ scale: 1.25, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className={cn('text-[30px] font-bold', facteur != null && facteur < 0.8 && 'text-statut-alerte')}
        >
          {facteur == null ? 'Nominal' : nombre(facteur, 2)}
        </motion.span>
        <small className="text-[12.5px] text-texte-doux">
          {facteur == null ? 'facteur aléatoire 0,95 – 1,05' : 'facteur de production forcé'}
        </small>
      </div>
      <div className="flex items-center gap-2 text-[12.5px] text-texte-doux">
        <Activity className="size-4 text-vert" /> Écart du jour :
        <b className={cn(site.statut === 'alerte' ? 'text-statut-alerte' : 'text-texte')}>
          {production?.ecart_pct == null ? '—' : `${nombre(production.ecart_pct, 1, true)} %`}
        </b>
      </div>
      <Button variante="danger" enCours={action === 'baisse'} disabled={action !== null} onClick={() => void executer('baisse')}>
        <TrendingDown /> Injecter une baisse de production (−30 %)
      </Button>
      <Button variante="contour" enCours={action === 'nominal'} disabled={action !== null || facteur == null} onClick={() => void executer('nominal')}>
        <RotateCcw /> Rétablir la production nominale
      </Button>
    </Carte>
  );
}
