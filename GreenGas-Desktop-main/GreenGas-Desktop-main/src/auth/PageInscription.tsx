/**
 * E1 · Inscription du personnel : un opérateur de tri ou un responsable méthanisation crée son compte.
 * Si la validation est activée (paramètre `validation_comptes_personnel`, contrat 1.5.0), un administrateur doit
 * le valider avant la première connexion ; sinon il est valide aussitôt. L'écran suit le `statut_validation` renvoyé.
 * Les administrateurs sont préenregistrés et créent les autres comptes.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CircleCheck, Clock } from 'lucide-react';
import { codeErreur, erreursDeChamps, messageErreur } from '@/api/erreurs';
import type { RoleInscription, Utilisateur } from '@/api/types';
import { Button } from '@/components/ui/button';
import { ChoixSegmente } from '@/components/ui/choix-segmente';
import { Champ, Input, InputTelephone } from '@/components/ui/input';
import { schemaEmail, schemaTelephone } from '@/lib/contact';
import { LIBELLE_ROLE } from '@/lib/libelles';
import { CadreAuth } from './CadreAuth';
import { PAGE_ACCUEIL } from './roles';
import { useSession } from './session';

const ROLES_INSCRIPTION: RoleInscription[] = ['operateur_tri', 'responsable_methanisation'];

const schema = z
  .object({
    nom: z.string().trim().min(2, 'Saisissez votre nom complet'),
    telephone: schemaTelephone,
    email: schemaEmail,
    role: z.enum(['operateur_tri', 'responsable_methanisation'], { message: 'Choisissez votre rôle' }),
    mot_de_passe: z.string().min(8, 'Mot de passe de 8 caractères minimum'),
    confirmation: z.string(),
  })
  .refine((v) => v.confirmation === v.mot_de_passe, {
    path: ['confirmation'],
    message: 'Les deux mots de passe sont différents',
  });
type Formulaire = z.input<typeof schema>;
type Saisie = z.output<typeof schema>;

export function PageInscription() {
  const { etat, inscrire } = useSession();
  const navigate = useNavigate();
  const [erreur, setErreur] = useState<string | null>(null);
  /** Compte enregistré : en attente d'un administrateur ou valide aussitôt, selon le serveur (contrat 1.5.0). */
  const [demande, setDemande] = useState<Utilisateur | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Formulaire, unknown, Saisie>({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', telephone: '', email: '', role: 'operateur_tri', mot_de_passe: '', confirmation: '' },
  });

  if (etat.statut === 'connecte') return <Navigate to={PAGE_ACCUEIL[etat.utilisateur.role]} replace />;

  if (demande?.statut_validation === 'valide') {
    return (
      <CadreAuth titre="Compte créé" accroche="Vous pouvez maintenant vous connecter avec votre téléphone ou votre e-mail.">
        <div role="status" className="flex items-start gap-2.5 rounded-xl bg-statut-ok-fond px-3.5 py-3 text-[13px] text-statut-ok-texte">
          <CircleCheck className="mt-0.5 size-4 flex-none" aria-hidden />
          <p>
            <b>{demande.nom}</b> · {LIBELLE_ROLE[demande.role]}
            <br />
            Votre compte est actif.
          </p>
        </div>
        <Button taille="grande" className="w-full" onClick={() => navigate('/connexion', { replace: true })}>
          Se connecter
        </Button>
      </CadreAuth>
    );
  }

  if (demande) {
    return (
      <CadreAuth titre="Demande envoyée" accroche="Un administrateur doit valider votre compte avant votre première connexion.">
        <div role="status" className="flex items-start gap-2.5 rounded-xl bg-statut-attention-fond px-3.5 py-3 text-[13px] text-statut-attention-texte">
          <Clock className="mt-0.5 size-4 flex-none" aria-hidden />
          <p>
            <b>{demande.nom}</b> · {LIBELLE_ROLE[demande.role]}
            <br />
            Vous pourrez vous connecter dès que votre compte sera validé.
          </p>
        </div>
        <Button taille="grande" className="w-full" onClick={() => navigate('/connexion', { replace: true })}>
          Retour à la connexion
        </Button>
      </CadreAuth>
    );
  }

  const soumettre = handleSubmit(async ({ confirmation: _c, ...corps }) => {
    setErreur(null);
    try {
      setDemande(await inscrire(corps));
    } catch (e) {
      Object.entries(erreursDeChamps(e)).forEach(([champ, message]) =>
        setError(champ as keyof Formulaire, { message }),
      );
      const code = codeErreur(e);
      if (code === 'TELEPHONE_DEJA_UTILISE') setError('telephone', { message: messageErreur(e) });
      else if (code === 'EMAIL_DEJA_UTILISE') setError('email', { message: messageErreur(e) });
      else setErreur(messageErreur(e));
    }
  });

  return (
    <CadreAuth
      titre="Créer un compte"
      accroche="Opérateur de tri ou responsable méthanisation : un administrateur valide votre demande avant la première connexion."
    >
      <form onSubmit={soumettre} className="flex flex-col gap-3" noValidate>
        <Champ libelle="Rôle" htmlFor="role" erreur={errors.role?.message}>
          <ChoixSegmente
            etiquette="Rôle"
            valeur={watch('role')}
            surChangement={(r) => setValue('role', r, { shouldValidate: true })}
            options={ROLES_INSCRIPTION.map((r) => ({ valeur: r, libelle: LIBELLE_ROLE[r] }))}
            className="w-full [&>*]:flex-1"
          />
        </Champ>
        <Champ libelle="Nom complet" htmlFor="nom" erreur={errors.nom?.message}>
          <Input
            id="nom"
            placeholder="Prénom et nom"
            autoComplete="name"
            aria-invalid={!!errors.nom}
            {...register('nom')}
          />
        </Champ>
        <Champ libelle="Téléphone" htmlFor="telephone" erreur={errors.telephone?.message}>
          <InputTelephone
            id="telephone"
            autoComplete="tel-national"
            aria-invalid={!!errors.telephone}
            {...register('telephone')}
          />
        </Champ>
        <Champ libelle="E-mail" htmlFor="email" erreur={errors.email?.message}>
          <Input
            id="email"
            type="email"
            placeholder="prenom.nom@greengas.ci"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </Champ>
        <Champ libelle="Mot de passe" htmlFor="mot_de_passe" erreur={errors.mot_de_passe?.message}>
          <Input
            id="mot_de_passe"
            type="password"
            placeholder="8 caractères minimum"
            autoComplete="new-password"
            aria-invalid={!!errors.mot_de_passe}
            {...register('mot_de_passe')}
          />
        </Champ>
        <Champ libelle="Confirmer le mot de passe" htmlFor="confirmation" erreur={errors.confirmation?.message}>
          <Input
            id="confirmation"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmation}
            {...register('confirmation')}
          />
        </Champ>
        <div role="alert" className="min-h-[18px] text-[12.5px] font-semibold text-statut-alerte">
          {erreur ?? ''}
        </div>
        <Button type="submit" taille="grande" enCours={isSubmitting} className="w-full">
          Créer mon compte
        </Button>
      </form>
      <p className="border-t border-bordure pt-3 text-[13px] text-texte-doux">
        Déjà un compte ?{' '}
        <Link to="/connexion" className="font-semibold text-vert hover:underline">
          Se connecter
        </Link>
      </p>
    </CadreAuth>
  );
}
