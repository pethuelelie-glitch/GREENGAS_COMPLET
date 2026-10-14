/**
 * Planification d'une tournée : date, secteur, collecteur et bacs.
 * Le site de destination et le motif d'affectation sont fixés par le serveur (affichés en lecture seule).
 */
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { messageErreur } from '@/api/erreurs';
import { useNotifications } from '@/components/greengas/Notifications';
import { CodeObjet } from '@/components/greengas/CodeObjet';
import { Button } from '@/components/ui/button';
import { Modale } from '@/components/ui/dialog';
import { Champ, Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useSecteurs, useSites } from '@/hooks/referentiel';
import { config } from '@/lib/config';
import { decalerJours } from '@/lib/dates';
import { LIBELLE_SECTEUR, LIBELLE_MOTIF_AFFECTATION } from '@/lib/libelles';
import { cn } from '@/lib/utils';
import { useBacs, usePlanifierTournee, useUtilisateurs } from '../hooks/requetes';

const lendemain = (jour: string) => decalerJours(jour, 1);

export function ModalePlanification({ ouverte, surFermer }: { ouverte: boolean; surFermer: () => void }) {
  const secteurs = useSecteurs();
  const sites = useSites();
  const bacs = useBacs({ statut: 'actif' });
  const collecteurs = useUtilisateurs({ role: 'collecteur' });
  const planifier = usePlanifierTournee();
  const { succes } = useNotifications();
  const [jour, setJour] = useState(lendemain(config.dateTravail));
  const [secteurId, setSecteurId] = useState('');
  const [collecteurId, setCollecteurId] = useState('');
  const [bacIds, setBacIds] = useState<string[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  const actifs = (collecteurs.data ?? []).filter((u) => u.actif);
  const bacsSecteur = (bacs.data ?? []).filter((b) => b.secteur_id === secteurId);
  const secteur = secteurs.data?.find((s) => s.id === secteurId);
  const siteNormal = sites.data?.find((s) => s.id === secteur?.site_id);
  const siteRepli = sites.data?.find((s) => s.id === secteur?.site_repli_id);

  useEffect(() => {
    if (!ouverte) return;
    setErreur(null);
    setJour(lendemain(config.dateTravail));
    setSecteurId(secteurs.data?.[0]?.id ?? '');
    setCollecteurId('');
  }, [ouverte, secteurs.data]);

  useEffect(() => {
    if (!collecteurId && actifs[0]) setCollecteurId(actifs[0].id);
  }, [actifs, collecteurId]);

  useEffect(() => {
    setBacIds((bacs.data ?? []).filter((b) => b.secteur_id === secteurId).map((b) => b.id));
  }, [secteurId, bacs.data]);

  async function envoyer() {
    setErreur(null);
    try {
      const t = await planifier.mutateAsync({ date: jour, secteur_id: secteurId, collecteur_id: collecteurId, bac_ids: bacIds });
      succes(`Tournée ${t.code} planifiée`, `destination ${t.code_site} (${LIBELLE_MOTIF_AFFECTATION[t.motif_affectation]})`);
      surFermer();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  return (
    <Modale
      ouverte={ouverte}
      surChangement={(o) => !o && surFermer()}
      titre="Planifier une tournée"
      description="Le code de la tournée, le site de destination et le motif d'affectation sont attribués par le serveur."
      pied={
        <>
          <Button variante="contour" onClick={surFermer}>
            Annuler
          </Button>
          <Button onClick={() => void envoyer()} enCours={planifier.isPending} disabled={!secteurId || !collecteurId || bacIds.length === 0}>
            Planifier
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Champ libelle="Date" htmlFor="date-tournee">
          <Input id="date-tournee" type="date" value={jour} onChange={(e) => setJour(e.target.value)} />
        </Champ>
        <Champ libelle="Secteur">
          <Select
            variante="champ"
            etiquette="Secteur"
            valeur={secteurId}
            surChangement={setSecteurId}
            options={(secteurs.data ?? []).map((s) => ({ valeur: s.id, libelle: `${LIBELLE_SECTEUR[s.code]} · ${s.nom}` }))}
          />
        </Champ>
      </div>
      {siteNormal && (
        <motion.p
          key={siteNormal.id + siteNormal.statut}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('rounded-xl px-3 py-2 text-[13px]', siteNormal.statut === 'maintenance' ? 'bg-statut-attention-fond text-statut-attention-texte' : 'bg-vert-pale text-texte-doux')}
        >
          Destination prévue : <CodeObjet code={siteNormal.code} />{' '}
          {siteNormal.statut === 'maintenance' ? (
            <>
              en maintenance : le serveur enverra la tournée vers le site de repli {siteRepli && <CodeObjet code={siteRepli.code} />}.
            </>
          ) : (
            'site du secteur (confirmé par le serveur).'
          )}
        </motion.p>
      )}
      <Champ libelle="Collecteur">
        <Select
          variante="champ"
          etiquette="Collecteur"
          valeur={collecteurId}
          surChangement={setCollecteurId}
          options={actifs.map((u) => ({ valeur: u.id, libelle: u.nom }))}
        />
      </Champ>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-texte-doux">Bacs de la tournée ({bacIds.length})</span>
        {bacsSecteur.length === 0 ? (
          <span className="text-[13px] text-texte-doux">Aucun bac actif dans ce secteur.</span>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {bacsSecteur.map((b) => {
              const choisi = bacIds.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={choisi}
                  onClick={() => setBacIds((l) => (choisi ? l.filter((x) => x !== b.id) : [...l, b.id]))}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[13px] transition-colors',
                    choisi ? 'border-vert bg-vert-pale' : 'border-bordure bg-surface hover:border-vert',
                  )}
                >
                  <span className={cn('grid size-4 place-items-center rounded border', choisi ? 'border-vert-foret-encre bg-vert-foret text-white' : 'border-bordure')}>
                    {choisi && <Check className="size-3" />}
                  </span>
                  <span className="whitespace-nowrap font-mono font-semibold">{b.code}</span>
                  <span className="truncate text-texte-doux">{b.residence}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <p role="alert" className="min-h-[18px] text-[12.5px] font-semibold text-statut-alerte">
        {erreur}
      </p>
    </Modale>
  );
}
