import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Bouton « pilule » de la maquette, avec retour de survol et de pression (transform uniquement). */
export const variantesBouton = cva(
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[transform,background-color,box-shadow,opacity] duration-150 ease-out will-change-transform hover:-translate-y-px active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variante: {
        principal: 'bg-vert-foret text-white shadow-sm hover:bg-vert-foret-survol hover:shadow-flottante',
        contour: 'border-[1.5px] border-vert-foret-encre bg-surface text-vert-foret-encre hover:bg-vert-pale',
        danger: 'bg-statut-alerte text-white shadow-sm hover:shadow-flottante hover:brightness-95',
        fantome: 'text-texte-doux hover:bg-vert-pale hover:text-vert-foret-encre',
        puce: 'bg-surface text-texte shadow-puce hover:shadow-flottante',
        lien: 'rounded-md px-0 text-vert underline underline-offset-2 hover:translate-y-0 hover:text-vert-foret-encre',
      },
      taille: {
        normale: 'h-10 px-[18px] text-[13px]',
        petite: 'h-8 px-3 text-[12.5px]',
        grande: 'h-11 px-6 text-sm',
        icone: 'size-9',
      },
    },
    defaultVariants: { variante: 'principal', taille: 'normale' },
  },
);

export interface ProprietesBouton
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantesBouton> {
  asChild?: boolean;
  /** Affiche un indicateur et désactive le bouton pendant un envoi. */
  enCours?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ProprietesBouton>(
  ({ className, variante, taille, asChild = false, enCours = false, disabled, children, ...props }, ref) => {
    const Composant = asChild ? Slot : 'button';
    return (
      <Composant
        ref={ref}
        className={cn(variantesBouton({ variante, taille }), className)}
        disabled={disabled || enCours}
        aria-busy={enCours || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {enCours && <LoaderCircle className="animate-spin" aria-hidden />}
            {children}
          </>
        )}
      </Composant>
    );
  },
);
Button.displayName = 'Button';
