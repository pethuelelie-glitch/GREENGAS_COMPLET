/** Secteurs NORD, EST, OUEST : site normal et site de repli (PATCH /secteurs/{id}/). */
import { ArrowRight } from 'lucide-react';
import { messageErreur } from '@/api/erreurs';
import { Carte } from '@/components/greengas/Carte';
import { useNotifications } from '@/components/greengas/Notifications';
import { PastilleStatut } from '@/components/greengas/PastilleStatut';
import { Select } from '@/components/ui/select';
import { useSecteurs, useSites } from '@/hooks/referentiel';
import { LIBELLE_SECTEUR } from '@/lib/libelles';
import { STATUT_SITE } from '@/lib/statuts';
import { useModifierSecteur } from '../hooks/requetes';

export function TableauSecteurs() {
  const secteurs = useSecteurs();
  const sites = useSites();
  const modifier = useModifierSecteur();
  const { succes, erreur } = useNotifications();
  const options = (sites.data ?? []).map((s) => ({ valeur: s.id, libelle: `${s.code} · ${s.nom}` }));

  async function changer(id: string, champ: 'site_id' | 'site_repli_id', valeur: string) {
    try {
      await modifier.mutateAsync({ id, corps: { [champ]: valeur } });
      succes('Secteur modifié et journalisé');
    } catch (e) {
      erreur(messageErreur(e));
    }
  }

  return (
    <Carte titre="Secteurs : site normal et site de repli" className="mt-4">
      <p className="-mt-1 mb-3 text-[13px] text-texte-doux">
        Une tournée part vers le site de son secteur ; si ce site est en maintenance, le serveur choisit le site de repli.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {(secteurs.data ?? []).map((s) => {
          const normal = sites.data?.find((x) => x.id === s.site_id);
          return (
            <div key={s.id} className="flex flex-col gap-2.5 rounded-kpi bg-vert-pale p-3.5">
              <div className="flex items-center justify-between">
                <b>Secteur {LIBELLE_SECTEUR[s.code]}</b>
                {normal && <PastilleStatut statut={STATUT_SITE[normal.statut]} />}
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 text-xs font-semibold text-texte-doux">
                <label className="flex flex-col gap-1">
                  Site normal
                  <Select variante="champ" etiquette={`Site normal du secteur ${s.code}`} valeur={s.site_id} options={options} surChangement={(v) => void changer(s.id, 'site_id', v)} />
                </label>
                <ArrowRight className="mb-3 size-4" />
                <label className="flex flex-col gap-1">
                  Site de repli
                  <Select variante="champ" etiquette={`Site de repli du secteur ${s.code}`} valeur={s.site_repli_id} options={options} surChangement={(v) => void changer(s.id, 'site_repli_id', v)} />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </Carte>
  );
}
