import { defineConfig } from 'rolldown';

export default defineConfig({
  input: [
    'src/timetable.ts',
    'src/settings.ts',
  ],
  output: {
    dir: 'dist/js',
    cleanDir: true,
    preserveModules: true,
    preserveModulesRoot: 'src/',
  },
});
