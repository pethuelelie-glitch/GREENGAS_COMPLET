import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Code lisible (BAC-014, TRN-0912-01, ORG-0258, DIG-01) en police mono ; cliquable si un lien est fourni. */
export function CodeObjet({ code, vers, className }: { code: string; vers?: string; className?: string }) {
  const classes = cn(
    'inline-block whitespace-nowrap rounded-md bg-vert-pale px-[7px] py-0.5 font-mono text-[12.5px] font-medium text-vert-foret-encre',
    vers && 'transition-colors hover:bg-vert-foret hover:text-white',
    className,
  );
  return vers ? (
    <Link to={vers} className={classes} onClick={(e) => e.stopPropagation()}>
      {code}
    </Link>
  ) : (
    <span className={classes}>{code}</span>
  );
}
