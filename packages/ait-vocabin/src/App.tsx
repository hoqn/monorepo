import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
const DEV_USER = import.meta.env.VITE_DEV_USER as string | undefined;

function RootRedirect() {
  const onboardingDone = localStorage.getItem(ONBOARDING_DONE_KEY) === 'true';
  return <Navigate to={onboardingDone ? '/home' : '/onboarding'} replace />;
}

function getTransition(pathname: string) {
  if (pathname.startsWith('/session')) {
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
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (getToken()) {
      setAuthReady(true);
      return;
    }
    (async () => {
      try {
        if (IS_DEV || DEV_USER) {
          await login({ devUserId: DEV_USER || 'local' });
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
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
