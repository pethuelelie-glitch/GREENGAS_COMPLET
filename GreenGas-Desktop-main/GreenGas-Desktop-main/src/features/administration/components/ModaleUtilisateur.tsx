/** Création (POST /utilisateurs/) et modification (PATCH /utilisateurs/{id}/) d'un compte. */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { codeErreur, erreursDeChamps, messageErreur } from '@/api/erreurs';
import type { Role, Utilisateur } from '@/api/types';
import { useNotifications } from '@/components/greengas/Notifications';
import { Button } from '@/components/ui/button';
import { Modale } from '@/components/ui/dialog';
import { Champ, Input, InputTelephone } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { schemaEmailFacultatif, schemaTelephone, versSaisieLocale } from '@/lib/contact';
import { LIBELLE_ROLE } from '@/lib/libelles';
import { useBacs, useCreerUtilisateur, useModifierUtilisateur } from '../hooks/requetes';

const ROLES: Role[] = [
  'citoyen',
  'collecteur',
  'operateur_tri',
  'responsable_methanisation',
  'referent',
  'administrateur',
];
const avecBac = (r: string) => r === 'citoyen' || r === 'referent';

const schema = z
  .object({
    nom: z.string().trim().min(2, 'Le nom est obligatoire'),
    telephone: schemaTelephone,
    email: schemaEmailFacultatif,
    role: z.string().min(1),
    bac_id: z.string(),
    mot_de_passe: z.string(),
    actif: z.boolean(),
    creation: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (avecBac(v.role) && !v.bac_id)
      ctx.addIssue({ code: 'custom', path: ['bac_id'], message: 'Un bac est obligatoire pour ce rôle' });
    if (v.creation && v.mot_de_passe.length < 8) {
      ctx.addIssue({ code: 'custom', path: ['mot_de_passe'], message: '8 caractères minimum' });
    }
  });
type Saisie = z.input<typeof schema>;
type Valeurs = z.output<typeof schema>;

export function ModaleUtilisateur({
  ouverte,
  surFermer,
  utilisateur,
  roleInitial,
}: {
  ouverte: boolean;
  surFermer: () => void;
  utilisateur?: Utilisateur;
  roleInitial?: Role;
}) {
  const bacs = useBacs();
  const creer = useCreerUtilisateur();
  const modifier = useModifierUtilisateur();
  const { succes } = useNotifications();
  const [erreur, setErreur] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, reset, setError, formState } = useForm<Saisie, unknown, Valeurs>({
    resolver: zodResolver(schema),
  });
  const collecteur = roleInitial === 'collecteur' && !utilisateur;

  useEffect(() => {
    if (!ouverte) return;
    setErreur(null);
    reset({
      nom: utilisateur?.nom ?? '',
      telephone: utilisateur ? versSaisieLocale(utilisateur.telephone) : '',
      email: utilisateur?.email ?? '',
      role: utilisateur?.role ?? roleInitial ?? 'citoyen',
      bac_id: utilisateur?.profil_citoyen?.bac_id ?? '',
      mot_de_passe: '',
      actif: utilisateur?.actif ?? true,
      creation: !utilisateur,
    });
  }, [ouverte, utilisateur, roleInitial, reset]);

  const role = watch('role');
  const envoyer = handleSubmit(async (v) => {
    setErreur(null);
    const bac_id = avecBac(v.role) ? v.bac_id : null;
    try {
      if (utilisateur) {
        await modifier.mutateAsync({
          id: utilisateur.id,
          corps: { nom: v.nom, email: v.email, role: v.role as Role, actif: v.actif, bac_id },
        });
        succes('Compte modifié et journalisé', v.nom);
      } else {
        await creer.mutateAsync({
          nom: v.nom,
          telephone: v.telephone,
          email: v.email,
          role: v.role as Role,
          mot_de_passe: v.mot_de_passe,
          bac_id,
        });
        succes(collecteur ? 'Collecteur créé et journalisé' : 'Compte créé et journalisé', v.nom);
      }
      surFermer();
    } catch (e) {
      Object.entries(erreursDeChamps(e)).forEach(([champ, message]) => setError(champ as keyof Saisie, { message }));
      const code = codeErreur(e);
      if (code === 'TELEPHONE_DEJA_UTILISE') setError('telephone', { message: messageErreur(e) });
      else if (code === 'EMAIL_DEJA_UTILISE') setError('email', { message: messageErreur(e) });
      else setErreur(messageErreur(e));
    }
  });

  const e = formState.errors;
  return (
    <Modale
      ouverte={ouverte}
      surChangement={(o) => !o && surFermer()}
      titre={utilisateur ? `Modifier · ${utilisateur.nom}` : collecteur ? 'Ajouter un collecteur' : 'Nouveau compte'}
      description={
        utilisateur
          ? "Un compte n'est jamais supprimé : il est désactivé. La modification est journalisée."
          : collecteur
            ? "Aucune inscription collecteur n'existe dans l'application mobile : le compte est créé ici."
            : 'Le compte est créé et validé immédiatement. Cette action est journalisée.'
      }
      pied={
        <>
          <Button variante="contour" onClick={surFermer}>
            Annuler
          </Button>
          <Button onClick={() => void envoyer()} enCours={creer.isPending || modifier.isPending}>
            {utilisateur ? 'Enregistrer' : 'Créer le compte'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-3" onSubmit={(ev) => void envoyer(ev)} noValidate>
        <Champ libelle="Nom complet" htmlFor="nom" erreur={e.nom?.message}>
          <Input id="nom" placeholder="Ex. Moussa Traoré" aria-invalid={!!e.nom} {...register('nom')} />
        </Champ>
        <div className="grid grid-cols-2 gap-3">
          <Champ libelle="Téléphone" htmlFor="tel" erreur={e.telephone?.message}>
            <InputTelephone id="tel" disabled={!!utilisateur} aria-invalid={!!e.telephone} {...register('telephone')} />
          </Champ>
          <Champ libelle="E-mail (facultatif)" htmlFor="email" erreur={e.email?.message}>
            <Input
              id="email"
              type="email"
              placeholder="prenom.nom@greengas.ci"
              aria-invalid={!!e.email}
              {...register('email')}
            />
          </Champ>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Champ libelle="Rôle">
            <Select
              variante="champ"
              etiquette="Rôle"
              valeur={role ?? ''}
              disabled={collecteur}
              surChangement={(v) => setValue('role', v, { shouldValidate: true })}
              options={ROLES.map((r) => ({ valeur: r, libelle: LIBELLE_ROLE[r] }))}
            />
          </Champ>
          {avecBac(role ?? '') ? (
            <Champ libelle="Bac" erreur={e.bac_id?.message}>
              <Select
                variante="champ"
                etiquette="Bac"
                valeur={watch('bac_id') ?? ''}
                surChangement={(v) => setValue('bac_id', v, { shouldValidate: true })}
                options={(bacs.data ?? []).map((b) => ({ valeur: b.id, libelle: `${b.code} · ${b.residence}` }))}
              />
            </Champ>
          ) : utilisateur ? (
            <Champ libelle="Compte">
              <Select
                variante="champ"
                etiquette="État du compte"
                valeur={watch('actif') ? 'actif' : 'desactive'}
                surChangement={(v) => setValue('actif', v === 'actif')}
                options={[
                  { valeur: 'actif', libelle: 'Actif' },
                  { valeur: 'desactive', libelle: 'Désactivé (connexion bloquée)' },
                ]}
              />
            </Champ>
          ) : (
            <span />
          )}
        </div>
        {utilisateur && avecBac(role ?? '') && (
          <Champ libelle="Compte">
            <Select
              variante="champ"
              etiquette="État du compte"
              valeur={watch('actif') ? 'actif' : 'desactive'}
              surChangement={(v) => setValue('actif', v === 'actif')}
              options={[
                { valeur: 'actif', libelle: 'Actif' },
                { valeur: 'desactive', libelle: 'Désactivé (connexion bloquée)' },
              ]}
            />
          </Champ>
        )}
        {!utilisateur && (
          <Champ
            libelle="Mot de passe initial"
            htmlFor="mdp"
            erreur={e.mot_de_passe?.message}
            aide={
              collecteur
                ? "Le collecteur se connectera à l'application mobile avec ce téléphone et ce mot de passe."
                : undefined
            }
          >
            <Input
              id="mdp"
              type="text"
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              aria-invalid={!!e.mot_de_passe}
              {...register('mot_de_passe')}
            />
          </Champ>
        )}
        <p role="alert" className="min-h-[18px] text-[12.5px] font-semibold text-statut-alerte">
          {erreur}
        </p>
      </form>
    </Modale>
  );
}
