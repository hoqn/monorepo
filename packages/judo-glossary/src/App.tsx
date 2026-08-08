import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import GlossaryPage from './pages/GlossaryPage';
import TechniquesPage from './pages/TechniquesPage';
import TechniqueDetailPage from './pages/TechniqueDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/techniques" element={<TechniquesPage />} />
          <Route path="/techniques/:id" element={<TechniqueDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
