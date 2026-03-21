import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'vocabin', // TODO: 앱 이름 확정 후 변경 필요
  brand: {
    displayName: 'VocaBin',
    primaryColor: '#3182F6',
    icon: '',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [],
});
