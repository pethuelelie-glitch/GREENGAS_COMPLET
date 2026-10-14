/**
 * A2 · Traçabilité d'un bac (l'écran le plus important de la présentation) :
 * fiche du bac, frise Scans → Collecte → Tournée → Tri → Points → Énergie, historique des collectes.
 * Données : GET /bacs/?code=, GET /bacs/{id}/tracabilite/.
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { Boxes, Coins, ScanLine, Scale, Truck, Zap } from 'lucide-react';
import type { CitoyenTracabilite, EtapeTracabilite, SourceMesure, StatutDonnee } from '@/api/types';
import { badge, BadgeProvenance, LegendeProvenance } from '@/components/greengas/BadgeProvenance';
import { Carte } from '@/components/greengas/Carte';
import { CodeObjet } from '@/components/greengas/CodeObjet';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { EtatChargement, EtatErreur, EtatVide } from '@/components/greengas/Etats';
import { FriseTracabilite, type EtapeFrise } from '@/components/greengas/FriseTracabilite';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { Button } from '@/components/ui/button';
import { useSecteurs } from '@/hooks/referentiel';
import { cascade } from '@/lib/animations';
import { COULEUR_CATEGORIE } from '@/lib/couleurs';
import { date, dateHeure, kg, kwh, m3, nombre, pourcentage } from '@/lib/format';
import { LIBELLE_CATEGORIE, LIBELLE_MOTIF_AFFECTATION, LIBELLE_SECTEUR, LIBELLE_SOURCE } from '@/lib/libelles';
import { STATUT_CONTROLE, STATUT_TOURNEE, STATUT_TRANSACTION, STATUT_VALIDATION } from '@/lib/statuts';
import { HistoriqueCollectes } from '../components/HistoriqueCollectes';
import { RechercheBac } from '../components/RechercheBac';
import { useBacs, useTracabilite } from '../hooks/requetes';

/** Provenance d'un poids de collecte, lue dans le champ `source` renvoyé par l'API. */
const provenanceSource = (source: SourceMesure | null): StatutDonnee | undefined =>
  source === 'simule' ? 'simule' : source === 'capteur' ? 'mesure' : undefined;

function Grille({ lignes }: { lignes: [string, React.ReactNode, StatutDonnee?][] }) {
  return (
    <dl className="grid grid-cols-3 gap-2.5">
      {lignes.map(([libelle, valeur, provenance], i) => (
        <motion.div
          key={libelle}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex flex-col gap-1 rounded-xl bg-vert-pale px-3 py-2"
        >
          <dt className="text-xs font-semibold text-texte-doux">{libelle}</dt>
          <dd className="flex flex-wrap items-center gap-2 font-bold">
            {valeur}
            <BadgeProvenance statut={provenance} />
          </dd>
        </motion.div>
      ))}
    </dl>
  );
}

function etapesFrise(e: EtapeTracabilite, citoyens: CitoyenTracabilite[]): EtapeFrise[] {
  const nom = (id: string) => citoyens.find((c) => c.id === id)?.nom ?? 'Citoyen';
  const c = e.collecte;
  const p = e.production;
  const triee = e.lots.length > 0;
  const organique = e.lots.find((l) => l.categorie === 'organique');
  return [
    {
      cle: 'scans',
      titre: 'Scans',
      icone: <ScanLine className="size-4" />,
      valeur: nombre(c.scans_valides),
      unite: 'scans',
      detail:
        e.transactions.length > 0 ? (
          <ul className="grid grid-cols-4 gap-2.5">
            {e.transactions.map((t) => (
              <li key={t.id} className="rounded-xl bg-vert-pale px-3 py-2">
                <div className="text-[13px] font-semibold">{nom(t.citoyen_id)}</div>
                <div className="text-xl font-bold">
                  {nombre(t.scans_citoyen)}{' '}
                  <small className="text-xs font-medium text-texte-doux">scans sur {nombre(t.scans_bac)}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-texte-doux">
            {(c.scans_valides ?? 0) === 0
              ? 'Aucun scan sur la période : le poids compte dans la tournée, mais aucun point n’est distribué.'
              : 'La répartition par citoyen est calculée au tri de la tournée.'}
          </p>
        ),
    },
    {
      cle: 'collecte',
      titre: 'Collecte',
      icone: <Scale className="size-4" />,
      valeur: nombre(c.poids_net_kg, 1),
      unite: 'kg',
      provenance: provenanceSource(c.source),
      detail: (
        <Grille
          lignes={[
            ['Poids brut', kg(c.poids_brut_kg, 1), provenanceSource(c.source)],
            ['Tare du bac', kg(c.tare_kg, 1)],
            ['Poids net', kg(c.poids_net_kg, 1), provenanceSource(c.source)],
            ['Source de la pesée', c.source ? LIBELLE_SOURCE[c.source] : '—'],
            ['kg par scan', c.kg_par_scan == null ? 'aucun scan' : nombre(c.kg_par_scan, 2)],
            ['Contrôle', c.statut_controle ? <PastilleStatut statut={STATUT_CONTROLE[c.statut_controle]} /> : '—'],
          ]}
        />
      ),
    },
    {
      cle: 'tournee',
      titre: 'Tournée',
      icone: <Truck className="size-4" />,
      valeur: <span className="font-mono">{e.tournee.code}</span>,
      detail: (
        <Grille
          lignes={[
            ['Date', date(e.tournee.date)],
            [
              'Site de destination',
              `${e.tournee.code_site} (${LIBELLE_MOTIF_AFFECTATION[e.tournee.motif_affectation]})`,
            ],
            ['Statut', <PastilleStatut key="s" statut={STATUT_TOURNEE[e.tournee.statut]} />],
            ['Bacs collectés', `${nombre(e.tournee.nb_bacs_collectes)} / ${nombre(e.tournee.nb_bacs)}`],
            ['Poids collecté', kg(e.tournee.poids_collecte_kg)],
            ['Validation de la collecte', dateHeure(c.date_validation)],
          ]}
        />
      ),
    },
    {
      cle: 'tri',
      titre: 'Tri',
      icone: <Boxes className="size-4" />,
      valeur: organique ? <span className="font-mono">{organique.code_lot}</span> : 'À trier',
      inactive: !triee,
      provenance: badge(p?.statuts_donnees, 'poids_organique_recu_kg'),
      detail: triee ? (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-wrap gap-2">
            {e.lots.map((l) => (
              <li key={l.id} className="flex items-center gap-2 rounded-full bg-vert-pale py-1 pl-2 pr-3 text-[13px]">
                <i className="size-2.5 rounded-full" style={{ background: COULEUR_CATEGORIE[l.categorie] }} />
                <CodeObjet code={l.code_lot} /> {LIBELLE_CATEGORIE[l.categorie]} <b>{kg(l.poids_kg)}</b>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-texte-doux">
            Valeur de la tournée <b className="text-texte">{nombre(e.valeur_kg, 2)} pts/kg</b> · coefficient de qualité{' '}
            <b className="text-texte">{nombre(e.coef_qualite, 1)}</b>
          </p>
        </div>
      ) : (
        <p className="text-[13px] text-texte-doux">La tournée n'est pas encore triée.</p>
      ),
    },
    {
      cle: 'points',
      titre: 'Points',
      icone: <Coins className="size-4" />,
      valeur: e.points_bac == null ? '—' : nombre(e.points_bac, 0),
      unite: 'pts',
      inactive: !triee,
      detail: !triee ? (
        <p className="text-[13px] text-texte-doux">Les points sont calculés au tri.</p>
      ) : e.transactions.length === 0 ? (
        <p className="text-[13px] text-texte-doux">Aucun scan : aucun point distribué pour ce bac.</p>
      ) : (
        <ul className="grid grid-cols-4 gap-2.5">
          {e.transactions.map((t, i) => (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col gap-1 rounded-xl bg-vert-pale px-3 py-2.5"
            >
              <span className="text-[13px] font-semibold">{nom(t.citoyen_id)}</span>
              <span className="text-[26px] font-bold leading-none">{nombre(t.points)}</span>
              <span className="text-xs text-texte-doux">
                {nombre(t.scans_citoyen)} / {nombre(t.scans_bac)} scans · {kg(t.poids_attribue_kg, 2)}
              </span>
              <PastilleStatut statut={STATUT_TRANSACTION[t.statut]} />
            </motion.li>
          ))}
        </ul>
      ),
    },
    {
      cle: 'energie',
      titre: 'Énergie',
      icone: <Zap className="size-4" />,
      valeur: p ? (p.electricite_kwh == null ? 'en attente' : nombre(p.electricite_kwh, 2)) : '—',
      unite: p?.electricite_kwh != null ? 'kWh' : undefined,
      inactive: !p,
      provenance: badge(p?.statuts_donnees, 'electricite_kwh'),
      detail: p ? (
        <Grille
          lignes={[
            [
              `Organique reçu par ${p.code_site}`,
              kg(p.poids_organique_recu_kg),
              badge(p.statuts_donnees, 'poids_organique_recu_kg'),
            ],
            ['Biogaz attendu', m3(p.biogaz_attendu_m3), badge(p.statuts_donnees, 'biogaz_attendu_m3')],
            [
              'Biogaz mesuré',
              p.biogaz_mesure_m3 == null ? 'en attente' : m3(p.biogaz_mesure_m3),
              badge(p.statuts_donnees, 'biogaz_mesure_m3'),
            ],
            ['Écart', pourcentage(p.ecart_pct), badge(p.statuts_donnees, 'ecart_pct')],
            ['Électricité', kwh(p.electricite_kwh), badge(p.statuts_donnees, 'electricite_kwh')],
            ['Chaleur', kwh(p.chaleur_kwh), badge(p.statuts_donnees, 'chaleur_kwh')],
          ]}
        />
      ) : (
        <p className="text-[13px] text-texte-doux">Disponible après le tri de la tournée.</p>
      ),
    },
  ];
}

export function PageTracabilite() {
  const [params, setParams] = useSearchParams();
  const bacs = useBacs();
  // Sans ?bac= : le premier bac renvoyé par l'API.
  const code = (params.get('bac') ?? bacs.data?.[0]?.code ?? '').toUpperCase();
  const secteurs = useSecteurs();
  const bac = bacs.data?.find((b) => b.code === code);
  const trace = useTracabilite(bac?.id);
  const [etape, setEtape] = useState('points');
  const [collecteChoisie, setCollecteChoisie] = useState<string | null>(null);

  const t = trace.data;
  const historique = t?.historique ?? [];
  const courante = historique.find((h) => h.collecte.id === collecteChoisie) ?? historique[0];
  const secteur = secteurs.data?.find((s) => s.id === bac?.secteur_id);

  return (
    <motion.div initial="cache" animate="visible" variants={cascade(0.08)}>
      <EnTetePage titre="Traçabilité" sousTitre="Remontez du bac jusqu'aux points et à l'énergie." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <RechercheBac
          key={code}
          bacs={bacs.data ?? []}
          valeurInitiale={code}
          surChoix={(c) => {
            setCollecteChoisie(null);
            setParams({ bac: c });
          }}
        />
        {bac && (
          <span className="text-[13px] text-texte-doux">
            <span className="font-mono">{bac.code}</span> · {bac.residence} · secteur{' '}
            {secteur ? LIBELLE_SECTEUR[secteur.code] : '…'} · {nombre(bac.nb_foyers_declares)} foyers déclarés
          </span>
        )}
      </div>

      {bacs.error || trace.error ? (
        <EtatErreur erreur={bacs.error ?? trace.error} reessayer={() => void trace.refetch()} />
      ) : !bacs.data ? (
        <EtatChargement />
      ) : !bac ? (
        <div className="rounded-carte bg-surface shadow-carte">
          <EtatVide
            message={
              bacs.data.length === 0
                ? 'Aucun bac enregistré.'
                : `Aucun bac trouvé avec le code ${code}. Essayez ${bacs.data[0].code}.`
            }
          />
        </div>
      ) : !t ? (
        <EtatChargement />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-[1fr_1.3fr] gap-4">
            <Carte
              titre="Fiche du bac"
              action={
                <Button variante="lien" taille="petite" asChild>
                  <Link to={`/admin/bacs/${bac.id}`}>Ouvrir la fiche</Link>
                </Button>
              }
            >
              <Grille
                lignes={[
                  [
                    'Code',
                    <span key="c" className="font-mono">
                      {bac.code}
                    </span>,
                  ],
                  ['Résidence', bac.residence],
                  ['Secteur', secteur ? LIBELLE_SECTEUR[secteur.code] : '…'],
                  ['Foyers déclarés', nombre(bac.nb_foyers_declares)],
                  ['Citoyens validés', nombre(bac.nb_citoyens_valides)],
                  ['Dernière collecte', dateHeure(bac.date_derniere_collecte)],
                ]}
              />
            </Carte>
            <Carte titre={`Citoyens rattachés (${t.citoyens.length})`}>
              {t.citoyens.length === 0 ? (
                <p className="text-[13px] text-texte-doux">Aucun citoyen inscrit sur ce bac.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-2">
                  {t.citoyens.map((c, i) => (
                    <motion.li
                      key={c.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between gap-2 rounded-xl bg-vert-pale px-3 py-2 text-[13px]"
                    >
                      <span className="truncate font-semibold">{c.nom}</span>
                      <PastilleStatut statut={STATUT_VALIDATION[c.statut_validation]} />
                    </motion.li>
                  ))}
                </ul>
              )}
            </Carte>
          </div>

          {courante ? (
            <>
              {courante !== historique[0] && (
                <p className="mb-2 text-[13px] font-semibold text-or-texte">
                  Collecte du {date(courante.collecte.date_validation)} ·{' '}
                  <button type="button" className="underline" onClick={() => setCollecteChoisie(null)}>
                    revenir à la plus récente
                  </button>
                </p>
              )}
              <FriseTracabilite
                key={courante.collecte.id}
                etapes={etapesFrise(courante, t.citoyens)}
                selection={etape}
                surSelection={setEtape}
              />
            </>
          ) : (
            <div className="rounded-carte bg-surface shadow-carte">
              <EtatVide message="Ce bac n'a encore fait partie d'aucune tournée." />
            </div>
          )}

          <div className="mt-4">
            <HistoriqueCollectes
              collectes={historique.map((h) => h.collecte)}
              tournees={new Map(historique.map((h) => [h.tournee.id, h.tournee]))}
              selection={courante?.collecte.id}
              surSelection={setCollecteChoisie}
            />
          </div>
        </>
      )}
      <LegendeProvenance className="mt-[18px]" />
    </motion.div>
  );
}
