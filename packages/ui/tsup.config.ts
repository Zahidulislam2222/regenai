import {defineConfig} from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/tokens.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['react', 'react-dom'],
  target: 'es2022',
  outExtension: ({format}) => ({js: format === 'cjs' ? '.cjs' : '.js'}),
});
