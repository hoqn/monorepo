import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage.tsx';
import { OnboardingPage } from './pages/OnboardingPage.tsx';
import { SessionPage } from './pages/SessionPage.tsx';
import { SessionResultPage } from './pages/SessionResultPage.tsx';
import { SessionRecoveryPage } from './pages/SessionRecoveryPage.tsx';
import { LeaderboardPage } from './pages/LeaderboardPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';

export const ONBOARDING_DONE_KEY = 'vocabin_onboarding_done';

function RootRedirect() {
  const onboardingDone = localStorage.getItem(ONBOARDING_DONE_KEY) === 'true';
  return <Navigate to={onboardingDone ? '/home' : '/onboarding'} replace />;
}

function App() {
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
