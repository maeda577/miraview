import { nodeResolve } from '@rollup/plugin-node-resolve';
// import typescript from '@rollup/plugin-typescript';

export default {
  input: [
    'src/ix.js',
    'src/program.ts',
    // 'src/programs.ts',
    // 'src/setting.ts',
  ],
  output: {
    dir: 'public/js/',
    format: 'es',
    sourcemap: true,
  },
  watch: {
    buildDelay: 2,
    exclude: [
      'src/ix.js',
    ]
  },
  plugins: [
    nodeResolve(),
    // typescript({ tsconfig: './tsconfig.json' })
  ]
};
