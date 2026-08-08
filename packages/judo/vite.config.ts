import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 모노레포 저장소의 GitHub Pages는 여러 서비스가 함께 쓸 루트이므로,
// 이 앱은 그 아래 전용 서브패스(/monorepo/judo/)에 배포한다.
// 로컬 개발 서버(vite dev)는 편의를 위해 루트로 유지하되, `vite preview`는
// command가 build와 동일하게 'serve'로 잡히므로 별도로 감지해 프로덕션
// 빌드 산출물(base가 이미 박혀 있는 HTML/에셋)과 경로가 어긋나지 않게 한다.
export default defineConfig(({ command }) => {
  const isPreview = process.argv.includes('preview');
  const useProdBase = command === 'build' || isPreview;

  return {
    base: useProdBase ? '/monorepo/judo/' : '/',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'favicon-32x32.png', 'apple-touch-icon.png'],
        manifest: {
          name: '유도 첫걸음 — 왕초보 유도 용어·기술 사전',
          short_name: '유도 첫걸음',
          description: '유도 초보자를 위한 한국어 용어집과 KODOKAN 공식 영상 기술 도감, 퀴즈',
          lang: 'ko',
          // GitHub Pages 서브패스 배포와 무관하게 매니페스트 위치 기준 상대경로로 계산되도록 함
          start_url: '.',
          scope: '.',
          display: 'standalone',
          background_color: '#f5f4ef',
          theme_color: '#14548a',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        },
      }),
    ],
  };
});
