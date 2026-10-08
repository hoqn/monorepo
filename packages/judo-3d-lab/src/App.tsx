import { lazy, Suspense, useEffect, useState } from 'react';
import { About } from './experiments/About';
import { PostureSandbox } from './experiments/PostureSandbox';
import { TechniqueViewer } from './experiments/TechniqueViewer';

// MediaPipe 번들은 크므로 탭을 열 때만 불러온다
const VideoPose = lazy(() => import('./experiments/VideoPose').then((m) => ({ default: m.VideoPose })));

const TABS = [
  { id: 'technique', label: '① 기술 3D 뷰어' },
  { id: 'sandbox', label: '② 자세·무게중심' },
  { id: 'video', label: '③ 영상→3D 추출' },
  { id: 'about', label: '결론·다음 단계' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const readHash = (): TabId => {
  const h = location.hash.slice(1);
  return (TABS.find((t) => t.id === h)?.id ?? 'technique') as TabId;
};

export function App() {
  const [tab, setTab] = useState<TabId>(readHash);
  useEffect(() => {
    const on = () => setTab(readHash());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);

  return (
    <div className="app">
      <header className="app-bar">
        <h1>
          유도 3D 실험실 <small>PoC</small>
        </h1>
        <nav aria-label="실험">
          {TABS.map((t) => (
            <a key={t.id} href={`#${t.id}`} className={tab === t.id ? 'is-active' : ''} aria-current={tab === t.id ? 'page' : undefined}>
              {t.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="app-main">
        {tab === 'technique' && <TechniqueViewer />}
        {tab === 'sandbox' && <PostureSandbox />}
        {tab === 'video' && (
          <Suspense fallback={<p className="loading">불러오는 중…</p>}>
            <VideoPose />
          </Suspense>
        )}
        {tab === 'about' && <About />}
      </main>
    </div>
  );
}
