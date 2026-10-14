import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

// Les couleurs pointent vers les jetons de src/styles/tokens.css (déclarés une seule fois).
const v = (nom: string) => `var(--${nom})`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'vert-foret': { DEFAULT: v('vert-foret'), survol: v('vert-foret-survol'), encre: v('vert-foret-encre') },
        vert: { DEFAULT: v('vert'), pale: v('vert-pale') },
        or: { DEFAULT: v('or'), pale: v('or-pale'), texte: v('or-texte') },
        fond: { DEFAULT: v('fond'), cadre: v('fond-cadre') },
        surface: v('surface'),
        texte: { DEFAULT: v('texte'), doux: v('texte-doux') },
        bordure: v('bordure'),
        'encre-claire': v('encre-claire'),
        bulle: { DEFAULT: v('bulle'), texte: v('bulle-texte') },
        statut: {
          ok: v('statut-ok'),
          'ok-fond': v('statut-ok-fond'),
          'ok-texte': v('statut-ok-texte'),
          alerte: v('statut-alerte'),
          'alerte-fond': v('statut-alerte-fond'),
          'alerte-texte': v('statut-alerte-texte'),
          attention: v('statut-attention'),
          'attention-fond': v('statut-attention-fond'),
          'attention-texte': v('statut-attention-texte'),
          neutre: v('statut-neutre'),
          'neutre-fond': v('statut-neutre-fond'),
          'neutre-texte': v('statut-neutre-texte'),
        },
        carte: {
          terre: v('carte-terre'),
          parc: v('carte-parc'),
          lagune: v('carte-lagune'),
          quartier: v('carte-quartier'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        titre: ['Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        carte: v('ombre-carte'),
        flottante: v('ombre-flottante'),
        puce: v('ombre-puce'),
        modale: v('ombre-modale'),
      },
      borderRadius: { carte: '18px', kpi: '16px' },
      keyframes: {
        miroitement: { '100%': { transform: 'translateX(100%)' } },
        pulsation: { '0%': { transform: 'scale(1)', opacity: '0.9' }, '100%': { transform: 'scale(1.9)', opacity: '0' } },
        flux: { to: { strokeDashoffset: '-24' } },
        halo: { '0%': { transform: 'scale(1)', opacity: '0.8' }, '100%': { transform: 'scale(1.12, 1.7)', opacity: '0' } },
      },
      animation: {
        miroitement: 'miroitement 1.4s ease-in-out infinite',
        pulsation: 'pulsation 2s ease-out infinite',
        flux: 'flux 1.4s linear infinite',
        halo: 'halo 2s ease-out infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
