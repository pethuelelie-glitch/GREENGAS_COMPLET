import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { INDICATIF } from '@/lib/contact';
import { cn } from '@/lib/utils';

const base =
  'w-full rounded-[10px] border border-bordure bg-surface px-3 py-[9px] text-sm text-texte transition-[border-color,box-shadow] duration-150 placeholder:text-texte-doux hover:border-vert focus-visible:border-vert focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-vert-pale disabled:cursor-not-allowed disabled:bg-fond disabled:opacity-70 aria-[invalid=true]:border-statut-alerte aria-[invalid=true]:ring-[3px] aria-[invalid=true]:ring-statut-alerte-fond';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(base, className)} {...props} />,
);
Input.displayName = 'Input';

/** Champ téléphone : indicatif +225 fixe affiché devant, saisie des 10 chiffres seulement. */
export const InputTelephone = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('relative', className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-bordure pl-3 pr-2.5 text-sm font-semibold text-texte-doux"
      >
        {INDICATIF}
      </span>
      <input
        ref={ref}
        type="tel"
        inputMode="tel"
        placeholder="07 00 00 00 00"
        className={cn(base, 'pl-[64px] tabular-nums')}
        {...props}
      />
    </div>
  ),
);
InputTelephone.displayName = 'InputTelephone';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(base, 'min-h-[76px] resize-y leading-snug', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

/** Libellé au-dessus d'un champ, comme dans la maquette (12 px, gras, gris). */
export function Champ({
  libelle,
  erreur,
  aide,
  children,
  className,
  htmlFor,
}: {
  libelle: string;
  erreur?: string;
  aide?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-[5px]', className)}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-texte-doux">
        {libelle}
      </label>
      {children}
      {erreur ? (
        <p role="alert" className="text-[12.5px] font-semibold text-statut-alerte">
          {erreur}
        </p>
      ) : aide ? (
        <p className="text-xs text-texte-doux">{aide}</p>
      ) : null}
    </div>
  );
}
