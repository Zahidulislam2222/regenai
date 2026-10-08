import base from './eslint.config.js';
export default [...base, {
  files: ['**/*.{ts,tsx}'],
  languageOptions: {parserOptions: {project: './tsconfig.frontend.json'}},
}];
