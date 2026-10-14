/** E0 · Connexion : logo, accroche, identifiant (téléphone ou e-mail), mot de passe et lien vers l'inscription. */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { RotateCw } from 'lucide-react';
import type { Identifiant } from '@/api/auth';
import { codeErreur, messageErreur } from '@/api/erreurs';
import { Button } from '@/components/ui/button';
import { ChoixSegmente } from '@/components/ui/choix-segmente';
import { Champ, Input, InputTelephone } from '@/components/ui/input';
import { MESSAGE_EMAIL, MESSAGE_TELEPHONE, versEmail, versTelephone } from '@/lib/contact';
import { PAGE_ACCUEIL } from './roles';
import { useSession } from './session';
import { CadreAuth } from './CadreAuth';

type Mode = 'telephone' | 'email';
const MODES: { valeur: Mode; libelle: string }[] = [
  { valeur: 'telephone', libelle: 'Téléphone' },
  { valeur: 'email', libelle: 'E-mail' },
];

// Seul le champ de l'onglet actif est contrôlé ; tout est vérifié ensemble pour afficher les erreurs en une fois.
const schema = z
  .object({ mode: z.enum(['telephone', 'email']), telephone: z.string(), email: z.string(), mot_de_passe: z.string() })
  .superRefine((v, ctx) => {
    if (v.mode === 'telephone' && !versTelephone(v.telephone)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['telephone'], message: MESSAGE_TELEPHONE });
    }
    if (v.mode === 'email' && !versEmail(v.email)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: MESSAGE_EMAIL });
    }
    if (!v.mot_de_passe) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mot_de_passe'], message: 'Saisissez votre mot de passe' });
    }
  });
type Formulaire = z.infer<typeof schema>;

function identifiant(v: Formulaire): Identifiant {
  return v.mode === 'telephone' ? { telephone: versTelephone(v.telephone) ?? '' } : { email: versEmail(v.email) ?? '' };
}

export function PageConnexion() {
  const { etat, connecter } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [erreur, setErreur] = useState<{ message: string; injoignable: boolean } | null>(null);
  const [enCours, setEnCours] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    clearErrors,
    setFocus,
    formState: { errors },
  } = useForm<Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: { mode: 'telephone', telephone: '', email: '', mot_de_passe: '' },
  });
  const mode = watch('mode');

  if (etat.statut === 'connecte') return <Navigate to={PAGE_ACCUEIL[etat.utilisateur.role]} replace />;
  const depuis = (location.state as { depuis?: string } | null)?.depuis;
  const motif = etat.statut === 'deconnecte' ? etat.motif : undefined;

  async function seConnecter(v: Formulaire) {
    setEnCours(true);
    setErreur(null);
    try {
      const u = await connecter(identifiant(v), v.mot_de_passe);
      navigate(depuis ?? PAGE_ACCUEIL[u.role], { replace: true });
    } catch (e) {
      setErreur({ message: messageErreur(e), injoignable: codeErreur(e) === 'SERVEUR_INJOIGNABLE' });
      setEnCours(false);
    }
  }

  function changerMode(m: Mode) {
    setValue('mode', m);
    clearErrors(['telephone', 'email']);
    setErreur(null);
    setTimeout(() => setFocus(m), 0);
  }

  return (
    <CadreAuth titre="Control Center" accroche="Du déchet à la ressource, chaque flux compte.">
      <form onSubmit={handleSubmit(seConnecter)} className="flex flex-col gap-3.5" noValidate>
        <ChoixSegmente
          etiquette="Se connecter avec"
          valeur={mode}
          surChangement={changerMode}
          options={MODES}
          className="w-full [&>*]:flex-1"
        />
        {mode === 'telephone' ? (
          <Champ libelle="Téléphone" htmlFor="telephone" erreur={errors.telephone?.message}>
            <InputTelephone
              id="telephone"
              autoComplete="username"
              aria-invalid={!!errors.telephone}
              {...register('telephone')}
            />
          </Champ>
        ) : (
          <Champ libelle="E-mail" htmlFor="email" erreur={errors.email?.message}>
            <Input
              id="email"
              type="email"
              placeholder="prenom.nom@greengas.ci"
              autoComplete="username"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
          </Champ>
        )}
        <Champ libelle="Mot de passe" htmlFor="mot_de_passe" erreur={errors.mot_de_passe?.message}>
          <Input
            id="mot_de_passe"
            type="password"
            placeholder="Mot de passe"
            autoComplete="current-password"
            aria-invalid={!!errors.mot_de_passe}
            {...register('mot_de_passe')}
          />
        </Champ>
        <div role="alert" className="min-h-[18px] text-[12.5px] font-semibold text-statut-alerte">
          {erreur?.message ?? motif ?? ''}
          {erreur?.injoignable && (
            <Button
              type="button"
              variante="lien"
              taille="petite"
              className="ml-2 h-auto"
              onClick={() => void seConnecter(getValues())}
            >
              <RotateCw /> Réessayer
            </Button>
          )}
        </div>
        <Button type="submit" taille="grande" enCours={enCours} className="w-full">
          Se connecter
        </Button>
      </form>

      <p className="border-t border-bordure pt-3 text-[13px] text-texte-doux">
        Opérateur de tri ou responsable méthanisation ?{' '}
        <Link to="/inscription" className="font-semibold text-vert hover:underline">
          Créer un compte
        </Link>
      </p>
    </CadreAuth>
  );
}
