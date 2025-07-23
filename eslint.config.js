// eslint.config.js

import globals from 'globals';
import tseslint from 'typescript-eslint';
import js from '@eslint/js';

// Import all our plugins
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules'],
  },

  // ========= Base & TypeScript Configuration =========
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      // ... languageOptions setup ...
      globals: { ...globals.browser },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      
      // === FIX #1: Disable the base ESLint rule ===
      // This is crucial. It prevents conflicts with the TypeScript version.
      'no-unused-vars': 'off',
      
      // === FIX #2: Enable the smarter TypeScript-aware rule ===
      // This rule correctly understands the '^_ ' ignore pattern.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // ========= React Specific Configurations =========
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react': react, // The main React plugin
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    // === FIX #3: Add React recommended settings ===
    // This tells ESLint we are using modern React and its JSX transform.
    // It automatically sets 'react/react-in-jsx-scope': 'off'.
    ...react.configs.recommended,

    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect the React version
      },
    },
  }
);