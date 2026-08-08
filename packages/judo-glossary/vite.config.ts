import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project 사이트(https://<user>.github.io/monorepo/)로 배포되므로
// 빌드 시에만 base를 저장소 이름으로 맞추고, 로컬 개발 서버는 루트로 유지한다.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/monorepo/' : '/',
  plugins: [react()],
}));
