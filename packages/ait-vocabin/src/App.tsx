import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { appLogin } from '@apps-in-toss/web-framework';
import { HomePage } from './pages/HomePage.tsx';
import { OnboardingPage } from './pages/OnboardingPage.tsx';
import { SessionPage } from './pages/SessionPage.tsx';
import { SessionResultPage } from './pages/SessionResultPage.tsx';
import { SessionRecoveryPage } from './pages/SessionRecoveryPage.tsx';
import { LeaderboardPage } from './pages/LeaderboardPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { getToken, login } from './lib/api.ts';

export const ONBOARDING_DONE_KEY = 'vocabin_onboarding_done';
const IS_DEV = import.meta.env.DEV;

function RootRedirect() {
  const onboardingDone = localStorage.getItem(ONBOARDING_DONE_KEY) === 'true';
  return <Navigate to={onboardingDone ? '/home' : '/onboarding'} replace />;
}

function App() {
  const [authReady, setAuthReady] = useState(false);

  // 앱 시작 시 토큰이 없으면 silent 로그인 시도
  useEffect(() => {
    if (getToken()) {
      setAuthReady(true);
      return;
    }
    (async () => {
      try {
        if (IS_DEV) {
          await login({ devUserId: 'local' });
        } else {
          const { authorizationCode } = await appLogin();
          await login({ authorizationCode });
        }
      } catch {
        // silent 실패 — 온보딩 화면에서 다시 시도함
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  if (!authReady) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/session" element={<SessionPage />} />
        <Route path="/session/result" element={<SessionResultPage />} />
        <Route path="/session/recovery" element={<SessionRecoveryPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
