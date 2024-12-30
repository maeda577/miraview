import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: [
    'src/programs.ts',
  ],
  output: {
    dir: 'public/js/',
    format: 'es',
    sourcemap: true,
  },
  plugins: [nodeResolve()]
};