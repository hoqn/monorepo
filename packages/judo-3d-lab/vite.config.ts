import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 실험용 PoC라 배포 경로가 아직 정해지지 않았다. 어느 서브패스에 올려도
// 동작하도록 빌드 산출물은 상대 경로(base: './')로 만든다.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
