import { defineConfig } from 'rolldown';

export default defineConfig({
  input: [
    'src/timetable.ts',
    'src/settings.ts',
    'src/tuners.ts',
  ],
  output: {
    dir: 'dist/js',
    cleanDir: true,
    preserveModules: true,
    preserveModulesRoot: 'src/',
  },
});
