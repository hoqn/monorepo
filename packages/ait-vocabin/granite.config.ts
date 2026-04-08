import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'lingo-lock-de', 
  brand: {
    displayName: '독일어락',
    primaryColor: '#1E7AF2',
    icon: '',
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: false,
  },
  web: {
    // host: '172.30.1.14',
    host: 'localhost',
    port: 5173,
    commands: {
      // dev: 'vite --host',
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [],
});
