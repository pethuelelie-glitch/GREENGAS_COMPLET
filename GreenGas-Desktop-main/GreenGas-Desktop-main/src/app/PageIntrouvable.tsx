import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EtatVide } from '@/components/greengas/Etats';
import { EnTetePage } from '@/components/greengas/EnTetePage';
import { Button } from '@/components/ui/button';

export function PageIntrouvable() {
  return (
    <>
      <EnTetePage titre="Page introuvable" sousTitre="Cette adresse ne correspond à aucun écran du Control Center." />
      <div className="rounded-carte bg-surface shadow-carte">
        <EtatVide
          icone={<Compass className="size-6" />}
          message="Vérifiez l'adresse ou revenez à votre page d'accueil."
          action={
            <Button asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          }
        />
      </div>
    </>
  );
}
