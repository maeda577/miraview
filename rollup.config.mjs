import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/ix.js',
  output: {
    dir: 'public/ix/',
    format: 'es'
  },
  plugins: [nodeResolve()]
};