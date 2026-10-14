/**
 * M3 · Alertes : liste filtrable (site, statut, type) et panneau de détail avec résolution commentée.
 * Le détail s'ouvre aussi depuis le bandeau global ou la notification (`?alerte=<id>`).
 */
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, CircleCheck, TriangleAlert } from 'lucide-react';
import { messageErreur } from '@/api/erreurs';
import type { Alerte } from '@/api/types';
import { useUtilisateur } from '@/auth/session';
import { BarreFiltres } from '@/components/greengas/BarreFiltres';
import { CodeObjet } from '@/components/greengas/CodeObjet';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { EtatChargement, EtatErreur, EtatVide } from '@/components/greengas/Etats';
import { useNotifications } from '@/components/greengas/Notifications';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { Button } from '@/components/ui/button';
import { Panneau } from '@/components/ui/dialog';
import { Champ, Textarea } from '@/components/ui/input';
import { useSites } from '@/hooks/referentiel';
import { dateHeure, m3, nombre, pluriel, pourcentage } from '@/lib/format';
import { LIBELLE_STATUT_ALERTE, LIBELLE_TYPE_ALERTE } from '@/lib/libelles';
import { STATUT_ALERTE } from '@/lib/statuts';
import { cn } from '@/lib/utils';
import { useAlertes, useResoudreAlerte } from '../hooks/requetes';

const valeurAlerte = (a: Alerte, v: number) => (a.type === 'production' ? m3(v) : `${nombre(v, 1)} %`);

export function PageAlertes() {
  const [params, setParams] = useSearchParams();
  const [filtres, setFiltres] = useState({ site_id: '', statut: '', type: '' });
  const sites = useSites();
  const alertes = useAlertes({
    site_id: filtres.site_id || undefined,
    statut: (filtres.statut || undefined) as Alerte['statut'] | undefined,
    type: (filtres.type || undefined) as Alerte['type'] | undefined,
  });
  const toutes = useAlertes();
  const idOuvert = params.get('alerte');
  const ouverte = toutes.data?.find((a) => a.id === idOuvert) ?? null;

  const ouvrir = (id: string | null) => setParams(id ? { alerte: id } : {}, { replace: true });

  return (
    <>
      <EnTetePage
        titre="Alertes"
        sousTitre="Un écart de production de 20 % ou plus déclenche une alerte, à la baisse comme à la hausse."
      />
      <BarreFiltres
        filtres={[
          {
            type: 'liste',
            cle: 'site_id',
            valeur: filtres.site_id,
            libelleTous: 'Tous les sites',
            options: (sites.data ?? []).map((s) => ({ valeur: s.id, libelle: `${s.code} · ${s.nom}` })),
          },
          {
            type: 'liste',
            cle: 'statut',
            valeur: filtres.statut,
            libelleTous: 'Tous les statuts',
            options: (['ouverte', 'resolue'] as const).map((s) => ({ valeur: s, libelle: LIBELLE_STATUT_ALERTE[s] })),
          },
          {
            type: 'liste',
            cle: 'type',
            valeur: filtres.type,
            libelleTous: 'Tous les types',
            options: (['production', 'composition'] as const).map((t) => ({ valeur: t, libelle: LIBELLE_TYPE_ALERTE[t] })),
          },
        ]}
        surChangement={(cle, valeur) => setFiltres((f) => ({ ...f, [cle]: valeur }))}
        surEffacer={() => setFiltres({ site_id: '', statut: '', type: '' })}
        resultat={alertes.data ? pluriel(alertes.data.length, 'alerte') : undefined}
      />

      {alertes.error ? (
        <EtatErreur erreur={alertes.error} reessayer={() => void alertes.refetch()} />
      ) : !alertes.data ? (
        <EtatChargement />
      ) : alertes.data.length === 0 ? (
        <div className="rounded-carte bg-surface shadow-carte">
          <EtatVide
            icone={<CircleCheck className="size-6" />}
            message="Aucune alerte. Les trois sites produisent dans la tolérance de ±20 %."
          />
        </div>
      ) : (
        <motion.ul layout className="flex flex-col gap-3">
          <AnimatePresence initial>
            {alertes.data.map((a, i) => (
              <motion.li
                key={a.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <button
                  type="button"
                  onClick={() => ouvrir(a.id)}
                  className={cn(
                    'flex w-full items-center gap-5 rounded-carte bg-surface px-5 py-4 text-left shadow-carte transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-flottante',
                    a.statut === 'ouverte' && 'shadow-[0_0_0_2px_var(--statut-alerte)]',
                  )}
                >
                  <span
                    className={cn(
                      'relative grid size-11 shrink-0 place-items-center rounded-full',
                      a.statut === 'ouverte' ? 'bg-statut-alerte-fond text-statut-alerte' : 'bg-statut-ok-fond text-statut-ok',
                    )}
                  >
                    {a.statut === 'ouverte' && <span className="absolute inset-0 animate-pulsation rounded-full border-2 border-statut-alerte" />}
                    {a.statut === 'ouverte' ? <TriangleAlert className="size-5" /> : <CircleCheck className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <PastilleStatut statut={STATUT_ALERTE[a.statut]} />
                      <CodeObjet code={a.code_site} />
                      <span className="rounded-full bg-vert-pale px-2 py-0.5 text-xs font-semibold text-vert-foret-encre">
                        {LIBELLE_TYPE_ALERTE[a.type]}
                      </span>
                      <span className="text-xs text-texte-doux">{pluriel(a.nb_occurrences, 'occurrence')}</span>
                    </span>
                    <span className="mt-1.5 block font-bold">{a.description}</span>
                    <span className="mt-0.5 block text-[13px] text-texte-doux">
                      Attendu {valeurAlerte(a, a.valeur_attendue)} · mesuré {valeurAlerte(a, a.valeur_mesuree)} · depuis le{' '}
                      {dateHeure(a.date_creation)}
                    </span>
                  </span>
                  <span className={cn('text-[28px] font-bold', a.statut === 'ouverte' ? 'text-statut-alerte' : 'text-texte-doux')}>
                    {pourcentage(a.ecart_pct)}
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <DetailAlerte alerte={ouverte} surFermer={() => ouvrir(null)} />
    </>
  );
}

function DetailAlerte({ alerte, surFermer }: { alerte: Alerte | null; surFermer: () => void }) {
  const u = useUtilisateur();
  const { succes } = useNotifications();
  const resoudre = useResoudreAlerte();
  const [commentaire, setCommentaire] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const peutResoudre = u.role === 'responsable_methanisation' && alerte?.statut === 'ouverte';

  async function valider() {
    if (!alerte) return;
    setErreur(null);
    try {
      await resoudre.mutateAsync({ id: alerte.id, commentaire: commentaire.trim() });
      succes('Alerte résolue et journalisée', alerte.code_site);
      setCommentaire('');
      surFermer();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  return (
    <Panneau
      ouvert={!!alerte}
      surChangement={(o) => !o && surFermer()}
      titre={alerte ? `${alerte.code_site} · alerte de ${LIBELLE_TYPE_ALERTE[alerte.type].toLowerCase()}` : ''}
      sousTitre={alerte?.description}
      pied={
        peutResoudre ? (
          <div className="flex flex-col gap-3">
            <Champ libelle="Commentaire de résolution (obligatoire)" htmlFor="commentaire-alerte" erreur={erreur ?? undefined}>
              <Textarea
                id="commentaire-alerte"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Ex. agitateur relancé, température rétablie à 37 °C"
              />
            </Champ>
            <Button onClick={() => void valider()} enCours={resoudre.isPending} disabled={!commentaire.trim()}>
              <CircleCheck /> Marquer comme résolue
            </Button>
          </div>
        ) : alerte?.statut === 'ouverte' ? (
          <p className="text-[13px] text-texte-doux">La résolution est réservée au responsable méthanisation.</p>
        ) : undefined
      }
    >
      {alerte && (
        <div className="flex flex-col gap-4">
          <PastilleStatut statut={STATUT_ALERTE[alerte.statut]} pulse />
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Attendu', valeurAlerte(alerte, alerte.valeur_attendue)],
              ['Mesuré', valeurAlerte(alerte, alerte.valeur_mesuree)],
              ['Écart', pourcentage(alerte.ecart_pct)],
            ].map(([l, v], i) => (
              <motion.div
                key={l}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className={cn('rounded-kpi bg-vert-pale px-3 py-2.5', l === 'Écart' && alerte.statut === 'ouverte' && 'bg-statut-alerte-fond text-statut-alerte-texte')}
              >
                <div className="text-xs font-semibold opacity-80">{l}</div>
                <div className="text-xl font-bold">{v}</div>
              </motion.div>
            ))}
          </div>
          <section>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
              <CalendarClock className="size-4 text-vert" /> Historique des occurrences
            </h4>
            <ol className="relative ml-2 border-l-2 border-bordure pl-4 text-[13px]">
              <li className="relative mb-3">
                <span className="absolute -left-[23px] top-1 size-3 rounded-full bg-statut-alerte" />
                <b>Ouverture</b> · {dateHeure(alerte.date_creation)}
              </li>
              {alerte.nb_occurrences > 1 && (
                <li className="relative mb-3">
                  <span className="absolute -left-[23px] top-1 size-3 rounded-full bg-statut-attention" />
                  <b>{pluriel(alerte.nb_occurrences, 'jour')} regroupés</b> · dernière occurrence le {dateHeure(alerte.date_derniere_occurrence)}
                </li>
              )}
              {alerte.statut === 'resolue' && (
                <li className="relative">
                  <span className="absolute -left-[23px] top-1 size-3 rounded-full bg-statut-ok" />
                  <b>Résolue</b> · {dateHeure(alerte.date_resolution)}
                  {alerte.commentaire_resolution && <p className="mt-1 text-texte-doux">« {alerte.commentaire_resolution} »</p>}
                </li>
              )}
            </ol>
          </section>
        </div>
      )}
    </Panneau>
  );
}
