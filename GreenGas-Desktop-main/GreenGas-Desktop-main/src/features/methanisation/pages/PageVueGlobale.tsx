/**
 * M1 · Vue globale : carte vivante des trois sites, panneau du site choisi et indicateurs du jour.
 * Données : GET /productions/globale/, /sites/, /bacs/, /secteurs/, /collectes/ (à vérifier), /parametres/.
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Factory, Flame, Zap } from 'lucide-react';
import type { ProductionEnergie, Site } from '@/api/types';
import { useUtilisateur } from '@/auth/session';
import { badge, BadgeProvenance, LegendeProvenance } from '@/components/greengas/BadgeProvenance';
import { PucesSession } from '@/components/greengas/EnTetePage';
import { EtatErreur } from '@/components/greengas/Etats';
import { Anneau, BarresHorizontales } from '@/components/greengas/Graphiques';
import { Indicateur } from '@/components/greengas/Indicateur';
import { JaugeEcart } from '@/components/greengas/JaugeEcart';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { ValeurAnimee } from '@/components/greengas/ValeurAnimee';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useParametres, useSecteurs, useSites, valeurParametre } from '@/hooks/referentiel';
import { cascade } from '@/lib/animations';
import { config } from '@/lib/config';
import { couleurSerie } from '@/lib/couleurs';
import { m3, nombre } from '@/lib/format';
import { LIBELLE_SECTEUR, LIBELLE_STATUT_SITE } from '@/lib/libelles';
import { STATUT_SITE } from '@/lib/statuts';
import { CarteSatellite } from '../components/CarteSatellite';
import type { Sortie } from '../components/CoucheCarte';
import { useBacsCarte, useCollectesSignalees, useProductionGlobale } from '../hooks/requetes';

/** Site affiché par défaut : celui en alerte, sinon le premier qui a une mesure. */
function siteParDefaut(sites: Site[], productions: ProductionEnergie[]): string | null {
  const enAlerte = sites.find((s) => s.statut === 'alerte');
  if (enAlerte) return enAlerte.id;
  const mesure = productions.find((p) => p.ecart_pct != null);
  return mesure?.site_id ?? sites[0]?.id ?? null;
}

export function PageVueGlobale() {
  const u = useUtilisateur();
  const navigate = useNavigate();
  const globale = useProductionGlobale(config.dateTravail);
  const sites = useSites({ suivi: true });
  const secteurs = useSecteurs();
  const bacs = useBacsCarte();
  const signalees = useCollectesSignalees();
  const parametres = useParametres();
  const [choixManuel, setChoixManuel] = useState<string | null>(null);
  const [sortie, setSortie] = useState<Sortie>('biogaz');
  const [filtreStatut, setFiltreStatut] = useState('');

  const erreur = globale.error ?? sites.error;
  if (erreur) {
    return (
      <div className="p-6">
        <EtatErreur erreur={erreur} reessayer={() => void Promise.all([globale.refetch(), sites.refetch()])} />
      </div>
    );
  }

  const g = globale.data;
  const listeSites = sites.data ?? [];
  const productions = g?.par_site ?? [];
  const selection = choixManuel ?? siteParDefaut(listeSites, productions);
  const site = listeSites.find((s) => s.id === selection);
  const p = productions.find((x) => x.site_id === selection);
  const secteurDuSite = secteurs.data?.find((s) => s.site_id === site?.id);
  const seuil = valeurParametre(parametres.data, 'seuil_alerte_production_pct') ?? 20;
  const sd = p?.statuts_donnees;
  // Le contrat ne donne pas de badges pour les totaux : on lit ceux des productions des sites.
  const badgeTotal = (champ: string) => productions.map((x) => badge(x.statuts_donnees, champ)).find(Boolean);

  return (
    <div className="relative h-full">
      {g && sites.data && (
        <CarteSatellite
          sites={listeSites}
          productions={productions}
          bacs={bacs.data ?? []}
          secteurs={secteurs.data ?? []}
          bacsSignales={new Set(signalees.data?.map((c) => c.bac_id))}
          selection={selection}
          surSelection={setChoixManuel}
          sortie={sortie}
          filtreStatut={filtreStatut}
          bacsCliquables={u.role === 'administrateur'}
        />
      )}

      {/* Barre du haut flottante */}
      <div className="absolute left-[366px] right-3.5 top-3 z-[5] flex items-center gap-2">
        <Select
          etiquette="Sortie affichée sur la carte"
          valeur={sortie}
          surChangement={(v) => setSortie(v as Sortie)}
          options={[
            { valeur: 'biogaz', libelle: 'Biogaz' },
            { valeur: 'electricite', libelle: 'Électricité' },
            { valeur: 'chaleur', libelle: 'Chaleur' },
          ]}
        />
        <Select
          etiquette="Filtrer par statut"
          valeur={filtreStatut}
          surChangement={setFiltreStatut}
          libelleTous="Tous statuts"
          options={(['nominal', 'alerte', 'maintenance'] as const).map((s) => ({
            valeur: s,
            libelle: LIBELLE_STATUT_SITE[s],
          }))}
        />
        <span className="flex-1" />
        <PucesSession />
      </div>

      {/* Panneau du site choisi */}
      <motion.aside
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26, delay: 0.1 }}
        className="defilement absolute bottom-[62px] left-3.5 top-3.5 z-[4] flex w-[338px] flex-col gap-[9px] overflow-auto rounded-carte bg-surface px-5 py-[18px] shadow-carte"
      >
        {site && p ? (
          <motion.div
            key={site.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-1 flex-col gap-[9px]"
          >
            <div className="mx-auto w-full max-w-[170px]">
              <JaugeEcart
                ecartPct={p.ecart_pct}
                seuilPct={seuil}
                enAlerte={site.statut === 'alerte'}
                graduations={false}
              />
            </div>
            <div className="-mt-2 text-center">
              {p.ecart_pct != null && (
                <ValeurAnimee
                  valeur={p.ecart_pct}
                  decimales={1}
                  signe
                  formater={(v) => `${nombre(v, 1, true)} %`}
                  className={
                    site.statut === 'alerte'
                      ? 'block text-2xl font-bold text-statut-alerte'
                      : 'block text-2xl font-bold'
                  }
                />
              )}
              <small className="text-texte-doux">
                {p.ecart_pct != null
                  ? 'écart mesuré / attendu'
                  : p.poids_organique_recu_kg > 0
                    ? 'En attente de la mesure de gaz'
                    : 'Aucune matière reçue : tri en attente'}
              </small>
            </div>
            <div className="flex items-center justify-between gap-2.5">
              <div>
                <div className="text-[15px] font-bold">
                  <span className="font-mono">{site.code}</span>
                  <span className="ml-2 text-[12.5px] font-medium text-texte-doux">{site.nom}</span>
                </div>
                {secteurDuSite && (
                  <div className="text-[13px] text-texte-doux">Secteur {LIBELLE_SECTEUR[secteurDuSite.code]}</div>
                )}
              </div>
              <PastilleStatut statut={STATUT_SITE[site.statut]} pulse />
            </div>
            <motion.div className="grid grid-cols-3 gap-1.5" initial="cache" animate="visible" variants={cascade(0.07)}>
              {[
                {
                  icone: Factory,
                  libelle: 'Biogaz mesuré',
                  valeur: p.biogaz_mesure_m3,
                  unite: 'm³',
                  d: 1,
                  champ: 'biogaz_mesure_m3',
                },
                {
                  icone: Zap,
                  libelle: 'Électricité',
                  valeur: p.electricite_kwh,
                  unite: 'kWh',
                  d: 2,
                  champ: 'electricite_kwh',
                },
                { icone: Flame, libelle: 'Chaleur', valeur: p.chaleur_kwh, unite: 'kWh', d: 2, champ: 'chaleur_kwh' },
              ].map(({ icone: Icone, libelle, valeur, unite, d, champ }) => (
                <motion.div
                  key={libelle}
                  variants={{ cache: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                  className="flex flex-col gap-1 rounded-[14px] bg-vert-pale p-[9px] text-vert-foret-encre"
                >
                  <Icone className="size-4" />
                  <div className="flex flex-wrap items-baseline gap-1 text-texte">
                    <ValeurAnimee valeur={valeur} decimales={d} className="text-lg font-bold" />
                    <small className="text-[11.5px] text-texte-doux">{unite}</small>
                  </div>
                  <span className="text-[12.5px] text-texte-doux">{libelle}</span>
                  <BadgeProvenance statut={badge(sd, champ)} />
                </motion.div>
              ))}
            </motion.div>
            <div className="my-1 h-px bg-bordure" />
            <h3 className="flex items-center gap-2 text-sm font-bold">
              Électricité du jour par site <BadgeProvenance statut={badgeTotal('electricite_kwh')} />
            </h3>
            {g && g.electricite_kwh > 0 ? (
              <Anneau
                taille={104}
                centre={g.electricite_kwh}
                sousTitre="kWh"
                segments={productions.map((x, i) => ({
                  libelle: x.code_site,
                  valeur: x.electricite_kwh ?? 0,
                  couleur: couleurSerie(i),
                }))}
              />
            ) : (
              <p className="text-[13px] text-texte-doux">En attente des premières mesures.</p>
            )}
            <h3 className="mt-1.5 text-sm font-bold">Biogaz mesuré / attendu</h3>
            <BarresHorizontales
              largeurLibelle={60}
              largeurValeur={112}
              max={Math.max(...productions.map((x) => Math.max(x.biogaz_attendu_m3, x.biogaz_mesure_m3 ?? 0)), 1)}
              barres={productions.map((x, i) => {
                const s = listeSites.find((y) => y.id === x.site_id);
                return {
                  libelle: x.code_site,
                  valeur: x.biogaz_mesure_m3 ?? 0,
                  couleur: s?.statut === 'alerte' ? 'var(--statut-alerte)' : couleurSerie(i),
                  texte:
                    x.biogaz_mesure_m3 != null
                      ? `${nombre(x.biogaz_mesure_m3, 1)} / ${nombre(x.biogaz_attendu_m3, 0)} m³`
                      : x.biogaz_attendu_m3 > 0
                        ? 'mesure en attente'
                        : 'tri en attente',
                };
              })}
            />
            <div className="mt-auto flex items-center justify-between border-t border-bordure pt-3 text-[13px] text-texte-doux">
              <span>Attendu {m3(p.biogaz_attendu_m3)}</span>
              <Button onClick={() => navigate(`/methanisation/sites/${site.id}`)}>Voir le détail</Button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="squelette mx-auto h-24 w-40" />
            <div className="squelette h-6 w-2/3" />
            <div className="squelette h-24" />
            <div className="squelette h-32" />
          </div>
        )}
      </motion.aside>

      {/* Indicateurs du jour */}
      <motion.div
        className="absolute bottom-[62px] left-[366px] right-3.5 z-[4] grid grid-cols-4 gap-2"
        initial="cache"
        animate={g ? 'visible' : 'cache'}
        variants={cascade(0.08, 0.2)}
      >
        <Indicateur
          sombre
          libelle="Organique reçu"
          valeur={g?.poids_organique_recu_kg}
          unite="kg"
          pied={<BadgeProvenance sombre statut={badgeTotal('poids_organique_recu_kg')} />}
        />
        <Indicateur
          libelle="Biogaz mesuré"
          valeur={g?.biogaz_mesure_m3}
          decimales={1}
          unite={`/ ${nombre(g?.biogaz_attendu_m3, 0)} m³`}
          pied={
            <>
              <BadgeProvenance statut={badgeTotal('biogaz_mesure_m3')} />
              <BadgeProvenance statut={badgeTotal('biogaz_attendu_m3')} />
            </>
          }
        />
        <Indicateur
          libelle="Électricité"
          valeur={g?.electricite_kwh}
          decimales={2}
          unite={`kWh · ${nombre(g?.foyers_equivalents, 1)} foyers`}
          pied={<BadgeProvenance statut={badgeTotal('electricite_kwh')} />}
        />
        <Indicateur
          libelle="Alertes ouvertes"
          valeur={g?.alertes_ouvertes}
          unite={g?.alertes_ouvertes ? 'à traiter' : 'aucune'}
          enAlerte={!!g?.alertes_ouvertes}
          pied={<PastilleStatut statut={STATUT_SITE[g?.alertes_ouvertes ? 'alerte' : 'nominal']} pulse />}
        />
      </motion.div>

      <div className="absolute bottom-[18px] right-4 z-[3] rounded-full bg-surface px-3 py-[5px] shadow-puce">
        <LegendeProvenance compacte />
      </div>
    </div>
  );
}
