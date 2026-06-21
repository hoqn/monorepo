import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'lingo-lock-de', 
  brand: {
    displayName: '독일어락',
    primaryColor: '#F7BB3D',
    icon: 'https://static.toss.im/appsintoss/30175/2bcbf001-0c08-49a3-9400-f44f3165558d.png',
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
    host: '172.30.1.85',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  webViewProps: {
    allowsBackForwardNavigationGestures: false,
    bounces: true,
    pullToRefreshEnabled: false,
    type: 'partner',
  },
  permissions: [],
});
