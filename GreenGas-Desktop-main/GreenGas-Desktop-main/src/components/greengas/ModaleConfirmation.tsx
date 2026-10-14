/**
 * Modale de confirmation : récapitulatif, commentaire facultatif ou obligatoire,
 * erreur de l'API affichée telle quelle, bouton occupé pendant l'envoi.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { messageErreur } from '@/api/erreurs';
import { Button } from '@/components/ui/button';
import { Modale } from '@/components/ui/dialog';
import { Champ, Textarea } from '@/components/ui/input';

interface ProprietesConfirmation {
  ouverte: boolean;
  surFermer: () => void;
  titre: string;
  children?: ReactNode;
  libelleConfirmer: string;
  /** Lance l'action ; une erreur levée reste affichée dans la modale. */
  surConfirmer: (commentaire: string) => Promise<unknown>;
  commentaire?: 'aucun' | 'facultatif' | 'obligatoire';
  libelleCommentaire?: string;
  danger?: boolean;
  icone?: ReactNode;
  /** Désactive la confirmation (ex. choix obligatoire non fait). */
  confirmationImpossible?: boolean;
}

export function ModaleConfirmation({
  ouverte,
  surFermer,
  titre,
  children,
  libelleConfirmer,
  surConfirmer,
  commentaire = 'aucun',
  libelleCommentaire = 'Commentaire',
  danger,
  icone,
  confirmationImpossible,
}: ProprietesConfirmation) {
  const [texte, setTexte] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (ouverte) {
      setTexte('');
      setErreur(null);
      setEnCours(false);
    }
  }, [ouverte]);

  const manque = commentaire === 'obligatoire' && !texte.trim();

  async function confirmer() {
    setEnCours(true);
    setErreur(null);
    try {
      await surConfirmer(texte.trim());
      surFermer();
    } catch (e) {
      setErreur(messageErreur(e));
      setEnCours(false);
    }
  }

  return (
    <Modale
      ouverte={ouverte}
      surChangement={(o) => !o && !enCours && surFermer()}
      titre={titre}
      icone={icone}
      pied={
        <>
          <Button variante="contour" onClick={surFermer} disabled={enCours}>
            Annuler
          </Button>
          <Button
            variante={danger ? 'danger' : 'principal'}
            onClick={() => void confirmer()}
            enCours={enCours}
            disabled={manque || confirmationImpossible}
          >
            {libelleConfirmer}
          </Button>
        </>
      }
    >
      {children && <div className="text-[13.5px] text-texte">{children}</div>}
      {commentaire !== 'aucun' && (
        <Champ
          libelle={`${libelleCommentaire}${commentaire === 'obligatoire' ? ' (obligatoire)' : ''}`}
          htmlFor="commentaire-confirmation"
        >
          <Textarea
            id="commentaire-confirmation"
            value={texte}
            autoFocus
            onChange={(e) => setTexte(e.target.value)}
            placeholder={commentaire === 'obligatoire' ? 'Commentaire obligatoire' : 'Commentaire'}
          />
        </Champ>
      )}
      <p role="alert" className="min-h-[18px] text-[12.5px] font-semibold text-statut-alerte">
        {erreur}
      </p>
    </Modale>
  );
}
