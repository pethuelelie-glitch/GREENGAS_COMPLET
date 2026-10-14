/** Création ou modification d'un bac (POST / PATCH /bacs/). Le code BAC-NNN est attribué par le serveur. */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { erreursDeChamps, messageErreur } from '@/api/erreurs';
import type { Bac } from '@/api/types';
import { useNotifications } from '@/components/greengas/Notifications';
import { Button } from '@/components/ui/button';
import { Modale } from '@/components/ui/dialog';
import { Champ, Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useSecteurs } from '@/hooks/referentiel';
import { LIBELLE_SECTEUR } from '@/lib/libelles';
import { useCreerBac, useModifierBac } from '../hooks/requetes';

const nombrePositif = (message: string) => z.coerce.number({ invalid_type_error: message }).positive(message);
const schema = z
  .object({
    residence: z.string().trim().min(2, 'La résidence est obligatoire'),
    secteur_id: z.string().min(1, 'Choisissez un secteur'),
    nb_foyers_declares: z.coerce.number().int('Nombre entier attendu').min(1, 'Au moins un foyer'),
    tare_kg: nombrePositif('Tare positive attendue'),
    capacite_kg: nombrePositif('Capacité positive attendue'),
  })
  .refine((v) => v.capacite_kg > v.tare_kg, { path: ['capacite_kg'], message: 'La capacité doit dépasser la tare' });
type Saisie = z.input<typeof schema>;
type Valeurs = z.output<typeof schema>;

export function ModaleBac({ ouverte, surFermer, bac, surCree }: { ouverte: boolean; surFermer: () => void; bac?: Bac; surCree?: (b: Bac) => void }) {
  const secteurs = useSecteurs();
  const creer = useCreerBac();
  const modifier = useModifierBac();
  const { succes } = useNotifications();
  const [erreur, setErreur] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, reset, setError, formState } = useForm<Saisie, unknown, Valeurs>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!ouverte) return;
    setErreur(null);
    reset({
      residence: bac?.residence ?? '',
      secteur_id: bac?.secteur_id ?? secteurs.data?.[0]?.id ?? '',
      nb_foyers_declares: bac?.nb_foyers_declares ?? 6,
      tare_kg: bac?.tare_kg ?? 12.5,
      capacite_kg: bac?.capacite_kg ?? 250,
    });
  }, [ouverte, bac, secteurs.data, reset]);

  const envoyer = handleSubmit(async (v) => {
    setErreur(null);
    try {
      if (bac) {
        await modifier.mutateAsync({ id: bac.id, corps: v });
        succes('Bac modifié et journalisé', bac.code);
      } else {
        const cree = await creer.mutateAsync(v);
        succes(`${cree.code} créé et journalisé`);
        surCree?.(cree);
      }
      surFermer();
    } catch (e) {
      const champs = erreursDeChamps(e);
      Object.entries(champs).forEach(([champ, message]) => setError(champ as keyof Saisie, { message }));
      setErreur(messageErreur(e));
    }
  });

  const e = formState.errors;
  return (
    <Modale
      ouverte={ouverte}
      surChangement={(o) => !o && surFermer()}
      titre={bac ? `Modifier ${bac.code}` : 'Nouveau bac'}
      description={bac ? undefined : 'Le code BAC-NNN est attribué par le serveur ; le QR code contient seulement ce code.'}
      pied={
        <>
          <Button variante="contour" onClick={surFermer}>
            Annuler
          </Button>
          <Button onClick={() => void envoyer()} enCours={creer.isPending || modifier.isPending}>
            {bac ? 'Enregistrer' : 'Créer le bac'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-3" onSubmit={(ev) => void envoyer(ev)} noValidate>
        <Champ libelle="Résidence" htmlFor="residence" erreur={e.residence?.message}>
          <Input id="residence" placeholder="Ex. Résidence Les Lauriers" aria-invalid={!!e.residence} {...register('residence')} />
        </Champ>
        <Champ libelle="Secteur" erreur={e.secteur_id?.message}>
          <Select
            variante="champ"
            etiquette="Secteur"
            valeur={watch('secteur_id') ?? ''}
            surChangement={(v) => setValue('secteur_id', v, { shouldValidate: true })}
            options={(secteurs.data ?? []).map((s) => ({ valeur: s.id, libelle: `${LIBELLE_SECTEUR[s.code]} · ${s.nom}` }))}
          />
        </Champ>
        <div className="grid grid-cols-3 gap-3">
          <Champ libelle="Foyers déclarés" htmlFor="foyers" erreur={e.nb_foyers_declares?.message}>
            <Input id="foyers" type="number" min={1} aria-invalid={!!e.nb_foyers_declares} {...register('nb_foyers_declares')} />
          </Champ>
          <Champ libelle="Tare (kg)" htmlFor="tare" erreur={e.tare_kg?.message}>
            <Input id="tare" type="number" step="any" aria-invalid={!!e.tare_kg} {...register('tare_kg')} />
          </Champ>
          <Champ libelle="Capacité (kg)" htmlFor="capacite" erreur={e.capacite_kg?.message}>
            <Input id="capacite" type="number" step="any" aria-invalid={!!e.capacite_kg} {...register('capacite_kg')} />
          </Champ>
        </div>
        <p role="alert" className="min-h-[18px] text-[12.5px] font-semibold text-statut-alerte">
          {erreur}
        </p>
      </form>
    </Modale>
  );
}
