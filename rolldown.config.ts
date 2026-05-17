import { defineConfig } from 'rolldown';

export default defineConfig({
  input: [
    'src/timetable.ts',
  ],
  output: {
    dir: 'dist/js',
    cleanDir: true,
    preserveModules: true,
    preserveModulesRoot: 'src/',
  },
});
