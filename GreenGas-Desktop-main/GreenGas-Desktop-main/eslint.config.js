import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dist-electron', 'release', 'coverage', 'design', 'src/api/schema.d.ts'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Fichiers « fournisseur + hook » ou « composant + utilitaire » : exports volontairement regroupés.
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: [
            'creerClientRequetes',
            'useSession',
            'useUtilisateur',
            'useNotifications',
            'usePreferences',
            'badge',
            'variantesBouton',
          ],
        },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Utilitaires de test : pas de rechargement à chaud.
  { files: ['src/test/**'], rules: { 'react-refresh/only-export-components': 'off' } },
  // Règles du projet (CLAUDE.md §5) : réseau seulement dans src/api, couleurs seulement via les jetons.
  {
    files: ['src/app/**', 'src/auth/**', 'src/components/**', 'src/features/**', 'src/hooks/**', 'src/lib/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Tous les appels réseau passent par src/api/.' },
        { name: 'localStorage', message: 'Jamais de jeton ni de donnée sensible dans localStorage.' },
        { name: 'sessionStorage', message: 'Jamais de jeton ni de donnée sensible dans sessionStorage.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?\\b/]',
          message: 'Couleurs uniquement via les jetons (src/styles/tokens.css).',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/mocks', '@/mocks/*', '**/mocks/**'],
              message: 'Les écrans ne connaissent pas le faux backend.',
            },
          ],
        },
      ],
    },
  },
  // Seule exception : les préférences d'affichage (thème, animations) de l'appareil, sans aucune donnée sensible.
  {
    files: ['src/lib/preferences.tsx'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Tous les appels réseau passent par src/api/.' },
        { name: 'sessionStorage', message: 'Jamais de jeton ni de donnée sensible dans sessionStorage.' },
      ],
    },
  },
  { files: ['electron/**', '*.config.{ts,js}'], languageOptions: { globals: globals.node } },
);
