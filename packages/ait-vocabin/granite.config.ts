import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'lingo-lock-de', // TODO: 앱 이름 확정 후 변경 필요
  brand: {
    displayName: '언어락 🇩🇪',
    primaryColor: '#1E7AF2',
    icon: 'https://static.toss.im/appsintoss/30175/9d598263-578c-4d41-a497-49940ac9238b.png',
  },
  navigationBar: {
    initialAccessoryButton: {
      id: 'profile',
      title: '프로필',
      icon: { name: 'icon-system-user-filled' },
    },
    withHomeButton: true,
  },
  web: {
    host: '172.30.1.40',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  permissions: [],
});
