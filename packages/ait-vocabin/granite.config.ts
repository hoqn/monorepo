import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'lingo-lock-de', 
  brand: {
    displayName: '언어락: 독일어',
    primaryColor: '#1E7AF2',
    icon: 'https://static.toss.im/appsintoss/30175/9d598263-578c-4d41-a497-49940ac9238b.png',
  },
  navigationBar: {
    initialAccessoryButton: {
      id: 'profile',
      title: '프로필',
      icon: { name: 'icon-system-user-filled' },
    },
    withBackButton: false,
    withHomeButton: true,
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
