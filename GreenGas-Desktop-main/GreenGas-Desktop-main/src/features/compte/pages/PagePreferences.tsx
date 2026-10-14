/**
 * Paramètres personnels (opérateur de tri, responsable méthanisation, référent) : thème, animations
 * et informations du compte en lecture seule. L'administrateur ouvre à la place les paramètres système.
 */
import { motion } from 'motion/react';
import { useUtilisateur } from '@/auth/session';
import { Carte } from '@/components/greengas/Carte';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { ChoixSegmente } from '@/components/ui/choix-segmente';
import { cascade } from '@/lib/animations';
import { date, telephone, TIRET_VIDE } from '@/lib/format';
import { LIBELLE_ROLE } from '@/lib/libelles';
import { usePreferences, type Animations, type Theme } from '@/lib/preferences';

const THEMES: { valeur: Theme; libelle: string }[] = [
  { valeur: 'clair', libelle: 'Clair' },
  { valeur: 'sombre', libelle: 'Sombre' },
  { valeur: 'systeme', libelle: 'Système' },
];

const ANIMATIONS: { valeur: Animations; libelle: string }[] = [
  { valeur: 'normales', libelle: 'Normales' },
  { valeur: 'reduites', libelle: 'Réduites' },
];

function Reglage({ titre, aide, children }: { titre: string; aide: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-bordure py-3.5 last:border-0">
      <div>
        <p className="font-semibold text-texte">{titre}</p>
        <p className="mt-0.5 text-[12.5px] text-texte-doux">{aide}</p>
      </div>
      {children}
    </div>
  );
}

export function PagePreferences() {
  const u = useUtilisateur();
  const { preferences, modifier } = usePreferences();

  return (
    <>
      <EnTetePage
        titre="Paramètres"
        sousTitre="Préférences d'affichage de cet appareil et informations de votre compte."
      />
      <motion.div
        className="grid max-w-[1100px] grid-cols-2 gap-4"
        initial="cache"
        animate="visible"
        variants={cascade(0.08)}
      >
        <Carte titre="Préférences">
          <Reglage titre="Thème" aide="« Système » suit le réglage clair ou sombre de l'appareil.">
            <ChoixSegmente
              etiquette="Thème"
              valeur={preferences.theme}
              surChangement={(theme) => modifier({ theme })}
              options={THEMES}
            />
          </Reglage>
          <Reglage titre="Animations" aide="« Réduites » coupe les transitions et les chiffres qui défilent.">
            <ChoixSegmente
              etiquette="Animations"
              valeur={preferences.animations}
              surChangement={(animations) => modifier({ animations })}
              options={ANIMATIONS}
            />
          </Reglage>
        </Carte>

        <Carte titre="Mon compte">
          <dl className="text-[13.5px]">
            {[
              ['Nom', u.nom],
              ['Rôle', LIBELLE_ROLE[u.role]],
              ['Téléphone', telephone(u.telephone)],
              ['E-mail', u.email ?? TIRET_VIDE],
              ['Compte créé le', date(u.date_creation)],
            ].map(([libelle, valeur]) => (
              <div
                key={libelle}
                className="flex items-center justify-between gap-3 border-b border-bordure py-2 last:border-0"
              >
                <dt className="text-texte-doux">{libelle}</dt>
                <dd className="font-bold">{valeur}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[12.5px] text-texte-doux">
            Ces informations sont gérées par l'administrateur. Pour les modifier, adressez-vous à lui.
          </p>
        </Carte>
      </motion.div>
    </>
  );
}
