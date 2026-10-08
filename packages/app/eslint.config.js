import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  {ignores: ['build/**', '.build-verify/**', '.wrangler/**', '.react-router/**']},
  {
    files: ['app/**/*.{ts,tsx}', 'workers/**/*.ts', '*.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: {jsx: true}},
      globals: {...globals.browser, ...globals.node, ...globals.serviceworker},
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
];
