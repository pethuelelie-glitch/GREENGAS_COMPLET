/** A8 · Journal d'audit : décisions et modifications, de la plus récente à la plus ancienne. */
import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { TypeObjet } from '@/api/types';
import { BarreFiltres } from '@/components/greengas/BarreFiltres';
import { Carte } from '@/components/greengas/Carte';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { TableauDonnees } from '@/components/greengas/TableauDonnees';
import { cascade } from '@/lib/animations';
import { dateHeure, pluriel } from '@/lib/format';
import { LIBELLE_TYPE_OBJET } from '@/lib/libelles';
import { useJournal } from '../hooks/requetes';

/** Valeur sérialisée en JSON par le serveur → texte lisible. */
function lisible(valeur: string | null): string {
  if (valeur == null) return '—';
  try {
    const v: unknown = JSON.parse(valeur);
    if (v === null) return '—';
    if (typeof v === 'object') {
      return Object.entries(v as Record<string, unknown>)
        .map(([k, x]) => `${k} : ${String(x)}`)
        .join(' · ');
    }
    return String(v).replace(/\./, ',');
  } catch {
    return valeur;
  }
}

export function PageJournal() {
  const [filtres, setFiltres] = useState({ objet_type: '', auteur_id: '' });
  const journal = useJournal({ objet_type: (filtres.objet_type || undefined) as TypeObjet | undefined, auteur_id: filtres.auteur_id || undefined });
  const tout = useJournal();
  const auteurs = [...new Map((tout.data ?? []).map((e) => [e.auteur_id, e.nom_auteur])).entries()];

  return (
    <motion.div initial="cache" animate="visible" variants={cascade()}>
      <EnTetePage titre="Journal" sousTitre="Toutes les décisions et modifications, de la plus récente à la plus ancienne." />
      <BarreFiltres
        filtres={[
          {
            type: 'liste',
            cle: 'objet_type',
            valeur: filtres.objet_type,
            libelleTous: "Tous les types d'objet",
            options: (Object.keys(LIBELLE_TYPE_OBJET) as TypeObjet[]).map((t) => ({ valeur: t, libelle: LIBELLE_TYPE_OBJET[t] })),
          },
          { type: 'liste', cle: 'auteur_id', valeur: filtres.auteur_id, libelleTous: 'Tous les auteurs', options: auteurs.map(([id, nom]) => ({ valeur: id, libelle: nom })) },
        ]}
        surChangement={(cle, valeur) => setFiltres((f) => ({ ...f, [cle]: valeur }))}
        surEffacer={() => setFiltres({ objet_type: '', auteur_id: '' })}
        resultat={journal.data && pluriel(journal.data.length, 'entrée')}
      />
      <Carte compacte>
        <TableauDonnees
          etiquette="Journal d'audit"
          lignes={journal.data}
          erreur={journal.error}
          reessayer={() => void journal.refetch()}
          cleLigne={(e) => e.id}
          messageVide="Le journal est vide. Il se remplit avec chaque tri, décision ou modification."
          colonnes={[
            { cle: 'date', entete: 'Date', rendu: (e) => <span className="font-mono text-[12.5px]">{dateHeure(e.date)}</span>, tri: (e) => e.date },
            { cle: 'auteur', entete: 'Auteur', rendu: (e) => e.nom_auteur, tri: (e) => e.nom_auteur },
            { cle: 'action', entete: 'Action', rendu: (e) => <span className="rounded-md bg-vert-pale px-1.5 py-0.5 font-mono text-[12px] text-vert-foret-encre">{e.action}</span> },
            { cle: 'objet', entete: 'Objet', rendu: (e) => LIBELLE_TYPE_OBJET[e.objet_type] },
            {
              cle: 'valeurs',
              entete: 'Ancienne → nouvelle',
              rendu: (e) => (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <span className="text-texte-doux">{lisible(e.ancienne_valeur)}</span>
                  <ArrowRight className="size-3.5 text-texte-doux" />
                  <b>{lisible(e.nouvelle_valeur)}</b>
                </span>
              ),
            },
            { cle: 'motif', entete: 'Motif', rendu: (e) => <span className="text-texte-doux">{e.motif ?? '—'}</span> },
          ]}
        />
      </Carte>
    </motion.div>
  );
}
