import { AppShell } from '@astryxdesign/core/AppShell';
import { Badge } from '@astryxdesign/core/Badge';
import { Center } from '@astryxdesign/core/Center';
import { Spinner } from '@astryxdesign/core/Spinner';
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav';
import { lazy, Suspense, useEffect, useState } from 'react';
import { About } from './experiments/About';
import { PostureSandbox } from './experiments/PostureSandbox';
import { TechniqueViewer } from './experiments/TechniqueViewer';

// MediaPipe 번들은 크므로 탭을 열 때만 불러온다
const VideoPose = lazy(() => import('./experiments/VideoPose').then((m) => ({ default: m.VideoPose })));

const TABS = [
  { id: 'technique', label: '기술 3D 뷰어' },
  { id: 'sandbox', label: '자세·무게중심' },
  { id: 'video', label: '영상→3D 추출' },
  { id: 'about', label: '결론·다음 단계' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const readHash = (): TabId => {
  const h = location.hash.slice(1);
  return (TABS.find((t) => t.id === h)?.id ?? 'technique') as TabId;
};

/**
 * 반응형 계약
 *   >768  TopNav에 탭 4개
 *   <=768 탭이 MobileNav 서랍으로 (AppShell mobileNav 기본 'md')
 * 각 화면은 자기 Layout에서 패널 처리를 따로 정한다.
 */
export function App() {
  const [tab, setTab] = useState<TabId>(readHash);
  useEffect(() => {
    const on = () => setTab(readHash());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);

  return (
    <AppShell
      variant="section"
      topNav={
        <TopNav
          label="실험 탭"
          heading={<TopNavHeading heading="유도 3D 실험실" headingHref="#technique" headerEndContent={<Badge label="PoC" />} />}
          startContent={TABS.map((t) => (
            <TopNavItem key={t.id} label={t.label} href={`#${t.id}`} isSelected={tab === t.id} />
          ))}
        />
      }
    >
      {tab === 'technique' && <TechniqueViewer />}
      {tab === 'sandbox' && <PostureSandbox />}
      {tab === 'video' && (
        <Suspense
          fallback={
            <Center height="100%">
              <Spinner label="불러오는 중…" />
            </Center>
          }
        >
          <VideoPose />
        </Suspense>
      )}
      {tab === 'about' && <About />}
    </AppShell>
  );
}
