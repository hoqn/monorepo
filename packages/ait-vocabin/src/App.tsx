import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { appLogin } from '@apps-in-toss/web-framework';
import { isAIT } from './lib/ait.ts';
import { HomePage } from './pages/HomePage.tsx';
import { OnboardingPage } from './pages/OnboardingPage.tsx';
import { SessionPage } from './pages/SessionPage.tsx';
import { SessionResultPage } from './pages/SessionResultPage.tsx';
import { SessionRecoveryPage } from './pages/SessionRecoveryPage.tsx';
import { SessionLevelupPage } from './pages/SessionLevelupPage.tsx';
import { SessionGameOverPage } from './pages/SessionGameOverPage.tsx';
import { LeaderboardPage } from './pages/LeaderboardPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { PatternPage } from './pages/PatternPage.tsx';

export const ONBOARDING_DONE_KEY = 'vocabin_onboarding_done';

function RootRedirect() {
  const onboardingDone = localStorage.getItem(ONBOARDING_DONE_KEY) === 'true';
  return <Navigate to={onboardingDone ? '/home' : '/onboarding'} replace />;
}

function getTransition(pathname: string) {
  if (pathname.startsWith('/session') || pathname === '/patterns') {
    return {
      initial: { opacity: 0, y: 32 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -16 },
      transition: { type: 'spring' as const, stiffness: 280, damping: 28 },
    };
  }
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.22 },
  };
}

function AnimatedRoutes() {
  const location = useLocation();
  const { initial, animate, exit, transition } = getTransition(location.pathname);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        style={{ position: 'absolute', inset: 0 }}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
      >
        <Routes location={location}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/session" element={<SessionPage />} />
          <Route path="/session/result" element={<SessionResultPage />} />
          <Route path="/session/recovery" element={<SessionRecoveryPage />} />
          <Route path="/session/gameover" element={<SessionGameOverPage />} />
          <Route path="/session/levelup" element={<SessionLevelupPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/patterns" element={<PatternPage />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const [ready, setReady] = useState(!isAIT);

  useEffect(() => {
    if (!isAIT) return;
    // AIT 환경: appLogin()은 Toss 앱과의 WebView 핸드셰이크에 필요.
    // auth code는 서버로 보내지 않고 버린다.
    appLogin().catch(() => {}).finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
