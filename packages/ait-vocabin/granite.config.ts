import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'lingo-lock-de', // TODO: 앱 이름 확정 후 변경 필요
  brand: {
    displayName: 'Lingo Lock DE',
    primaryColor: '#1E7AF2',
    icon: '',
  },
  web: {
    host: '172.30.1.14',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  permissions: [],
});
