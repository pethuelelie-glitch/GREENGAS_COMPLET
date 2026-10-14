/**
 * A7 · Paramètres : tous les coefficients, regroupés par famille, modifiables sur place.
 * Le serveur les relit à chaque calcul ; une valeur impossible est refusée (`PARAMETRE_INVALIDE`).
 * Les réglages oui / non (validation des comptes du personnel, contrat 1.5.0) se choisissent par Activée / Désactivée.
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, SlidersHorizontal } from 'lucide-react';
import type { Parametre } from '@/api/types';
import { Carte } from '@/components/greengas/Carte';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { EtatChargement, EtatErreur } from '@/components/greengas/Etats';
import { ModaleConfirmation } from '@/components/greengas/ModaleConfirmation';
import { useNotifications } from '@/components/greengas/Notifications';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { TableauDonnees } from '@/components/greengas/TableauDonnees';
import { Button } from '@/components/ui/button';
import { ChoixSegmente } from '@/components/ui/choix-segmente';
import { Onglets } from '@/components/ui/onglets';
import { useParametres } from '@/hooks/referentiel';
import { cascade } from '@/lib/animations';
import { config } from '@/lib/config';
import { dateHeure, nombre } from '@/lib/format';
import { FAMILLES_PARAMETRES, PARAMETRES, PARAMETRES_OUI_NON, type FamilleParametre } from '@/lib/libelles';
import { STATUT_PARAMETRE } from '@/lib/statuts';
import { cn } from '@/lib/utils';
import { useModifierParametre } from '../hooks/requetes';

const lireNombre = (t: string) => Number(t.replace(',', '.').trim());

type OuiNon = 'active' | 'desactive';
const OPTIONS_OUI_NON: { valeur: OuiNon; libelle: string }[] = [
  { valeur: 'active', libelle: 'Activée' },
  { valeur: 'desactive', libelle: 'Désactivée' },
];
const libelleOuiNon = (valeur: number) => (valeur === 1 ? 'Activée' : 'Désactivée');

/** Conséquence de la nouvelle valeur, affichée dans la confirmation. */
function effet(p: Parametre, valeur: number): string {
  if (p.cle === 'validation_comptes_personnel') {
    return valeur === 1
      ? 'Chaque opérateur de tri ou responsable méthanisation qui crée son compte devra être validé par un administrateur (écran Vérifications) avant de se connecter.'
      : 'Les opérateurs de tri et responsables méthanisation qui créent leur compte pourront se connecter aussitôt, sans validation. La modification est inscrite au journal.';
  }
  return "La nouvelle valeur s'applique au prochain calcul. La modification est inscrite au journal.";
}

export function PageParametres() {
  const parametres = useParametres();
  const modifier = useModifierParametre();
  const { succes } = useNotifications();
  const [famille, setFamille] = useState<FamilleParametre | 'toutes'>('toutes');
  const [saisies, setSaisies] = useState<Record<string, string>>({});
  const [enCours, setEnCours] = useState<{ p: Parametre; valeur: number } | null>(null);

  const familles = famille === 'toutes' ? FAMILLES_PARAMETRES : [famille];
  const saisie = (p: Parametre) => saisies[p.cle] ?? String(p.valeur).replace('.', ',');
  const change = (p: Parametre) => {
    const v = lireNombre(saisie(p));
    return Number.isFinite(v) && saisie(p).trim() !== '' && v !== p.valeur;
  };

  return (
    <motion.div initial="cache" animate="visible" variants={cascade(0.08)}>
      <EnTetePage
        titre="Paramètres"
        sousTitre="Tous les chiffres ajustables. Le serveur les lit à chaque calcul : une modification s'applique au calcul suivant."
      />
      <Onglets
        className="mb-4"
        etiquette="Familles de paramètres"
        valeur={famille}
        surChangement={setFamille}
        onglets={[{ valeur: 'toutes' as const, libelle: 'Toutes' }, ...FAMILLES_PARAMETRES.map((f) => ({ valeur: f, libelle: f }))]}
      />
      {parametres.error ? (
        <EtatErreur erreur={parametres.error} reessayer={() => void parametres.refetch()} />
      ) : !parametres.data ? (
        <EtatChargement />
      ) : (
        <div className="flex flex-col gap-4">
          {familles.map((f) => (
            <Carte key={f} titre={f} compacte>
              <TableauDonnees
                etiquette={`Paramètres ${f}`}
                sansEntete
                lignes={parametres.data.filter((p) => PARAMETRES[p.cle].famille === f)}
                cleLigne={(p) => p.cle}
                colonnes={[
                  {
                    cle: 'libelle',
                    entete: 'Paramètre',
                    rendu: (p) => (
                      <span className="flex flex-col gap-0.5">
                        <b>{PARAMETRES[p.cle].libelle}</b>
                        <span className="font-mono text-[11.5px] text-texte-doux">{p.cle}</span>
                      </span>
                    ),
                  },
                  {
                    cle: 'valeur',
                    entete: 'Valeur',
                    largeur: '230px',
                    rendu: (p) =>
                      PARAMETRES_OUI_NON.has(p.cle) ? (
                        <ChoixSegmente
                          etiquette={PARAMETRES[p.cle].libelle}
                          valeur={p.valeur === 1 ? 'active' : 'desactive'}
                          surChangement={(v) => setEnCours({ p, valeur: v === 'active' ? 1 : 0 })}
                          options={OPTIONS_OUI_NON}
                        />
                      ) : (
                        <span className="flex items-center gap-2">
                          <input
                            aria-label={`Valeur de ${p.cle}`}
                            inputMode="decimal"
                            value={saisie(p)}
                            onChange={(e) => setSaisies((s) => ({ ...s, [p.cle]: e.target.value }))}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && change(p) && setEnCours({ p, valeur: lireNombre(saisie(p)) })
                            }
                            className={cn(
                              'h-9 w-24 rounded-[10px] border bg-surface px-2.5 text-right font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-vert-pale',
                              change(p) ? 'border-or' : 'border-bordure',
                            )}
                          />
                          <small className="text-texte-doux">{p.unite}</small>
                        </span>
                      ),
                  },
                  {
                    cle: 'statut',
                    entete: 'Statut',
                    largeur: '120px',
                    rendu: (p) => <PastilleStatut statut={STATUT_PARAMETRE[p.statut]} />,
                  },
                  {
                    cle: 'source',
                    entete: 'Source',
                    rendu: (p) => (
                      <span className="text-[12.5px] text-texte-doux">
                        {p.source ?? p.description}
                        {p.date_modification.slice(0, 10) === config.dateTravail && (
                          <span className="block">Modifié le {dateHeure(p.date_modification)}</span>
                        )}
                      </span>
                    ),
                  },
                  {
                    cle: 'action',
                    entete: '',
                    alignement: 'droite',
                    largeur: '120px',
                    rendu: (p) =>
                      PARAMETRES_OUI_NON.has(p.cle) ? null : (
                        <Button
                          taille="petite"
                          variante={change(p) ? 'principal' : 'contour'}
                          disabled={!change(p)}
                          onClick={() => setEnCours({ p, valeur: lireNombre(saisie(p)) })}
                        >
                          <SlidersHorizontal /> Modifier
                        </Button>
                      ),
                  },
                ]}
              />
            </Carte>
          ))}
        </div>
      )}

      <ModaleConfirmation
        ouverte={!!enCours}
        surFermer={() => setEnCours(null)}
        titre={enCours ? `Modifier « ${PARAMETRES[enCours.p.cle].libelle} »` : ''}
        libelleConfirmer="Enregistrer"
        surConfirmer={async () => {
          if (!enCours) return;
          await modifier.mutateAsync({ cle: enCours.p.cle, valeur: enCours.valeur });
          setSaisies((s) => {
            const { [enCours.p.cle]: _ignore, ...reste } = s;
            return reste;
          });
          succes('Paramètre modifié et journalisé', enCours.p.cle);
        }}
      >
        {enCours && (
          <>
            {PARAMETRES_OUI_NON.has(enCours.p.cle) ? (
              <p className="flex items-center gap-3 text-lg">
                <span className="text-texte-doux line-through">{libelleOuiNon(enCours.p.valeur)}</span>
                <ArrowRight className="size-4 text-texte-doux" />
                <b>{libelleOuiNon(enCours.valeur)}</b>
              </p>
            ) : (
              <p className="flex items-center gap-3 text-lg">
                <span className="text-texte-doux line-through">{nombre(enCours.p.valeur, 2).replace(/,00$/, '')}</span>
                <ArrowRight className="size-4 text-texte-doux" />
                <b>{nombre(enCours.valeur, 3).replace(/,?0+$/, '')}</b>
                <small className="text-texte-doux">{enCours.p.unite}</small>
              </p>
            )}
            <p className="mt-2 text-texte-doux">{effet(enCours.p, enCours.valeur)}</p>
          </>
        )}
      </ModaleConfirmation>
    </motion.div>
  );
}
