/**
 * T2 · Saisie du tri (écran clé) : poids par catégorie, contamination, contrôle de cohérence en direct.
 * Seule exception aux règles de calcul (CLAUDE.md §5.1) : l'aperçu du total et de l'écart.
 * Le serveur reste juge (`ECART_TOLERANCE`) et calcule lots, points et envoi au digesteur.
 */
import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleCheck, Eraser, Scale, TriangleAlert } from 'lucide-react';
import { codeErreur, messageErreur } from '@/api/erreurs';
import type { Categorie, NiveauContamination, TourneeDetail } from '@/api/types';
import { LegendeProvenance } from '@/components/greengas/BadgeProvenance';
import { Carte } from '@/components/greengas/Carte';
import { ChampPoids } from '@/components/greengas/ChampPoids';
import { CodeObjet } from '@/components/greengas/CodeObjet';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { EtatChargementPage, EtatErreur } from '@/components/greengas/Etats';
import { Anneau } from '@/components/greengas/Graphiques';
import { ModaleConfirmation } from '@/components/greengas/ModaleConfirmation';
import { useNotifications } from '@/components/greengas/Notifications';
import { Bandeau } from '@/components/greengas/Bandeau';
import { ValeurAnimee } from '@/components/greengas/ValeurAnimee';
import { Button } from '@/components/ui/button';
import { ChoixSegmente } from '@/components/ui/choix-segmente';
import { Textarea } from '@/components/ui/input';
import { useParametres, useSecteurs, valeurParametre } from '@/hooks/referentiel';
import { cascade } from '@/lib/animations';
import { COULEUR_CATEGORIE } from '@/lib/couleurs';
import { kg, nombre, pourcentage } from '@/lib/format';
import {
  CATEGORIES,
  DESTINATION_CATEGORIE,
  LIBELLE_CATEGORIE,
  LIBELLE_CONTAMINATION,
  LIBELLE_DESTINATION,
  LIBELLE_SECTEUR,
} from '@/lib/libelles';
import { cn } from '@/lib/utils';
import { ICONE_CATEGORIE } from '../components/categories';
import { useTournee, useValiderTri } from '../hooks/requetes';

const VIDE = Object.fromEntries(CATEGORIES.map((c) => [c, ''])) as Record<Categorie, string>;
const NIVEAUX: NiveauContamination[] = ['faible', 'moyen', 'eleve'];

const lirePoids = (texte: string) => {
  const v = Number.parseFloat(texte.replace(',', '.'));
  return Number.isFinite(v) && v > 0 ? v : 0;
};

export function PageSaisieTri() {
  const { tourneeId } = useParams();
  const tournee = useTournee(tourneeId);
  const secteurs = useSecteurs();
  const parametres = useParametres();

  if (tournee.error) return <EtatErreur erreur={tournee.error} reessayer={() => void tournee.refetch()} />;
  if (!tournee.data || parametres.isPending) return <EtatChargementPage />;

  const t = tournee.data;
  const secteur = secteurs.data?.find((s) => s.id === t.secteur_id);
  const titre = (
    <span className="inline-flex items-center gap-2">
      Saisie du tri · <span className="font-mono">{t.code}</span>
    </span>
  );
  const sousTitre = `Secteur ${secteur ? LIBELLE_SECTEUR[secteur.code] : '…'} · destination ${t.code_site} · poids collecté ${kg(t.poids_collecte_kg)}`;

  if (t.statut !== 'collectee') {
    return (
      <>
        <EnTetePage titre={titre} sousTitre={sousTitre} />
        <Bandeau
          type="info"
          action={
            t.statut === 'triee' ? (
              <Button asChild taille="petite">
                <Link to={`/tri/${t.id}/resultat`}>Voir le résultat</Link>
              </Button>
            ) : undefined
          }
        >
          {t.statut === 'triee'
            ? 'Cette tournée a déjà été triée.'
            : "Cette tournée n'est pas encore collectée : elle ne peut pas être triée."}
        </Bandeau>
      </>
    );
  }

  return (
    <>
      <EnTetePage titre={titre} sousTitre={sousTitre} />
      <FormulaireTri tournee={t} tolerancePct={valeurParametre(parametres.data, 'tolerance_tri_pct') ?? 2} />
    </>
  );
}

function FormulaireTri({ tournee, tolerancePct }: { tournee: TourneeDetail; tolerancePct: number }) {
  const navigate = useNavigate();
  const { succes, erreur: notifierErreur } = useNotifications();
  const valider = useValiderTri(tournee.id);
  const [poids, setPoids] = useState<Record<Categorie, string>>(VIDE);
  const [contamination, setContamination] = useState<NiveauContamination>('faible');
  const [motif, setMotif] = useState('');
  const [motifExige, setMotifExige] = useState(false);
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const champs = useRef<(HTMLInputElement | null)[]>([]);
  const champMotif = useRef<HTMLTextAreaElement>(null);

  // Aperçu indicatif (le serveur recalcule et décide).
  const valeurs = useMemo(
    () => Object.fromEntries(CATEGORIES.map((c) => [c, lirePoids(poids[c])])) as Record<Categorie, number>,
    [poids],
  );
  const total = CATEGORIES.reduce((s, c) => s + valeurs[c], 0);
  const collecte = tournee.poids_collecte_kg;
  const ecart = collecte > 0 ? ((total - collecte) / collecte) * 100 : 0;
  // L'écart ne s'affiche qu'une fois la saisie commencée (le formulaire s'ouvre vide).
  const saisieCommencee = total > 0;
  const horsTolerance = saisieCommencee && Math.abs(ecart) > tolerancePct;
  const motifRequis = horsTolerance || motifExige;
  const peutValider = total > 0 && (!motifRequis || motif.trim().length > 0);

  function changer(c: Categorie, v: string) {
    setPoids((p) => ({ ...p, [c]: v }));
    setErreurServeur(null);
  }

  async function envoyer() {
    try {
      await valider.mutateAsync({
        niveau_contamination: contamination,
        lots: CATEGORIES.map((c) => ({ categorie: c, poids_kg: valeurs[c] })),
        motif_ecart: motif.trim() || null,
      });
      succes('Tri validé', `${kg(valeurs.organique)} d'organique envoyés à ${tournee.code_site}`);
      navigate(`/tri/${tournee.id}/resultat`);
    } catch (e) {
      const code = codeErreur(e);
      if (code === 'ECART_TOLERANCE') {
        setMotifExige(true);
        setErreurServeur(messageErreur(e));
        window.setTimeout(() => champMotif.current?.focus(), 250);
        return;
      }
      if (code === 'CONFLIT') {
        notifierErreur('Cette tournée a déjà été triée');
        navigate('/tri');
        return;
      }
      throw e;
    }
  }

  return (
    <motion.div initial="cache" animate="visible" variants={cascade(0.08)}>
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <Carte>
          <div role="group" aria-label="Poids triés par catégorie">
            {CATEGORIES.map((c, i) => {
              const Icone = ICONE_CATEGORIE[c];
              const destination =
                c === 'organique' ? `Digesteur ${tournee.code_site}` : LIBELLE_DESTINATION[DESTINATION_CATEGORIE[c]];
              return (
                <motion.label
                  key={c}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="grid grid-cols-[150px_auto_1fr_170px] items-center gap-3.5 border-b border-bordure py-2"
                >
                  <b className="flex items-center gap-2.5">
                    <span
                      className="grid size-7 place-items-center rounded-lg text-white"
                      style={{ background: COULEUR_CATEGORIE[c] }}
                    >
                      <Icone className="size-4" aria-hidden />
                    </span>
                    {LIBELLE_CATEGORIE[c]}
                  </b>
                  <ChampPoids
                    ref={(el) => {
                      champs.current[i] = el;
                    }}
                    value={poids[c]}
                    placeholder="0"
                    aria-label={`${LIBELLE_CATEGORIE[c]} en kg`}
                    onChange={(e) => changer(c, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        champs.current[i + 1]?.focus();
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                  <i className="h-2 overflow-hidden rounded bg-vert-pale" aria-hidden>
                    <motion.u
                      className="block h-full origin-left rounded"
                      style={{ background: COULEUR_CATEGORIE[c] }}
                      animate={{ scaleX: total > 0 ? valeurs[c] / total : 0 }}
                      transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                    />
                  </i>
                  <small className="text-[13px] text-texte-doux">{destination}</small>
                </motion.label>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-3.5">
            <b>Contamination</b>
            <ChoixSegmente
              etiquette="Niveau de contamination"
              valeur={contamination}
              surChangement={setContamination}
              options={NIVEAUX.map((n) => ({ valeur: n, libelle: LIBELLE_CONTAMINATION[n] }))}
            />
            <span className="flex-1" />
            <Button variante="fantome" taille="petite" onClick={() => setPoids(VIDE)}>
              <Eraser /> Vider la saisie
            </Button>
          </div>
        </Carte>

        <Carte className="flex flex-col">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-texte-doux">
            <Scale className="size-4" aria-hidden /> Contrôle de cohérence
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <ValeurAnimee valeur={total} duree={0.45} className="text-[34px] font-bold" />
            <small className="text-[13px] text-texte-doux">/ {kg(collecte)} triés</small>
          </div>
          {saisieCommencee ? (
            <motion.span
              key={horsTolerance ? 'hors' : 'ok'}
              initial={{ scale: 0.9, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className={cn(
                'mt-1 inline-flex w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-bold',
                horsTolerance
                  ? 'bg-statut-attention-fond text-statut-attention-texte'
                  : 'bg-statut-ok-fond text-statut-ok-texte',
              )}
            >
              {horsTolerance ? <TriangleAlert className="size-[13px]" /> : <CircleCheck className="size-[13px]" />}
              Écart {pourcentage(Math.round(ecart * 10) / 10)}
              {horsTolerance && ` · hors tolérance de ${nombre(tolerancePct)} %`}
            </motion.span>
          ) : (
            <span className="mt-1 text-[12.5px] text-texte-doux">Saisissez les poids triés par catégorie.</span>
          )}

          <AnimatePresence initial={false}>
            {motifRequis && (
              <motion.label
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex flex-col gap-1.5 overflow-hidden text-xs font-semibold text-texte-doux"
              >
                Motif de l'écart (obligatoire)
                <Textarea
                  ref={champMotif}
                  value={motif}
                  onChange={(e) => {
                    setMotif(e.target.value);
                    setErreurServeur(null);
                  }}
                  aria-invalid={motifExige && !motif.trim() ? true : undefined}
                  placeholder="Ex. humidité évaporée pendant le transport"
                />
              </motion.label>
            )}
          </AnimatePresence>
          <p role="alert" className="mt-2 min-h-[18px] text-[12.5px] font-semibold text-statut-alerte">
            {erreurServeur}
          </p>
          <Button className="mt-1 w-max" onClick={() => setConfirmation(true)} disabled={!peutValider}>
            Valider le tri
          </Button>

          <div className="my-4 h-px bg-bordure" />
          <h3 className="mb-2 text-sm font-bold">Composition de la tournée</h3>
          <Anneau
            centre={total}
            sousTitre="kg triés"
            segments={CATEGORIES.map((c) => ({
              libelle: LIBELLE_CATEGORIE[c],
              valeur: valeurs[c],
              couleur: COULEUR_CATEGORIE[c],
            }))}
          />
          <p className="mt-3 text-[13px] text-texte-doux">
            Aperçu de la saisie avant validation. Les points et l'énergie sont calculés par le serveur.
          </p>
        </Carte>
      </div>
      <p className="mt-3 text-[13px] text-texte-doux">
        Les points, la valeur de la tournée et l'envoi au site sont calculés par le serveur après validation.
      </p>
      <LegendeProvenance className="mt-[18px]" />

      <ModaleConfirmation
        ouverte={confirmation}
        surFermer={() => setConfirmation(false)}
        titre={`Valider le tri de ${tournee.code}`}
        libelleConfirmer="Valider le tri"
        surConfirmer={envoyer}
      >
        <p>
          <b>{kg(valeurs.organique)}</b> d'organique seront envoyés au digesteur <CodeObjet code={tournee.code_site} />.
          Cette saisie lance le calcul des points des citoyens.
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
          <li className="rounded-xl bg-vert-pale px-3 py-2">
            Total trié <b className="block text-base">{kg(total)}</b>
          </li>
          <li className="rounded-xl bg-vert-pale px-3 py-2">
            Contamination <b className="block text-base">{LIBELLE_CONTAMINATION[contamination]}</b>
          </li>
        </ul>
      </ModaleConfirmation>
    </motion.div>
  );
}
