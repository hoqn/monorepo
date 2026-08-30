import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

// @vitejs/plugin-react(babel)는 astryx CLI가 물고 있는 jscodeshift의 Babel 버전과
// 충돌해 설치되지 않는다. swc 플러그인으로 우회한 상태이니 되돌리지 말 것.
//
// base는 배포처마다 다르다.
//   - Vercel: 도메인 루트에 올라가므로 '/' (기본값)
//   - GitHub Pages: 모노레포 저장소의 Pages 루트를 독차지하지 않도록 서브패스에 올라가고,
//     워크플로가 BASE_PATH=/monorepo/judo-log/ 를 넣어준다
// 서브패스 값을 코드에 박아두면 Vercel에서 에셋이 전부 404가 나므로 환경변수로 받는다.
// 로컬 dev 서버는 편의를 위해 항상 루트로 둔다.
export default defineConfig(({ command }) => {
  const isPreview = process.argv.includes('preview');
  const useProdBase = command === 'build' || isPreview;
  const base = useProdBase ? (process.env.BASE_PATH ?? '/') : '/';

  return {
    base,
    plugins: [
      react(),
      // 지하철·지하 구간에서 쓰는 앱이라 오프라인 우선이 전제다(기획서 2장).
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: '유도 복습 — 출퇴근길에 머리로 굴리는 유도',
          short_name: '유도 복습',
          description: '도장에서 30초 기록하고, 출퇴근길에 정리하고 복습하는 유도 입문자용 간격 반복 앱',
          lang: 'ko',
          // 배포 경로와 무관하게 매니페스트 위치 기준 상대경로로 계산되도록 함
          start_url: '.',
          scope: '.',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#ffffff',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        },
      }),
    ],
  };
});
