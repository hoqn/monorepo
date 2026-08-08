import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import GlossaryPage from './pages/GlossaryPage';
import TechniquesPage from './pages/TechniquesPage';
import TechniqueDetailPage from './pages/TechniqueDetailPage';
import QuizPage from './pages/QuizPage';

// GitHub Pages는 서버 사이드 라우팅 재작성이 없으므로, 새로고침·직접 링크
// 진입 시에도 항상 index.html로 떨어지는 해시 라우팅을 사용한다.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/techniques" element={<TechniquesPage />} />
          <Route path="/techniques/:id" element={<TechniqueDetailPage />} />
          <Route path="/quiz" element={<QuizPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
