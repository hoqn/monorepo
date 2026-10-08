import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import koKR from '@astryxdesign/core/locales/ko-KR.generated.js';
import { Theme } from '@astryxdesign/core/theme';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { defaultThemeSlug, themes } from './astryx-themes';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Astryx 내장 문구(파일 선택, 닫기 등)를 한국어로 */}
    <InternationalizationProvider locale="ko-KR" messages={{ 'ko-KR': koKR }}>
      <Theme theme={themes[defaultThemeSlug]}>
        <App />
      </Theme>
    </InternationalizationProvider>
  </StrictMode>,
);
