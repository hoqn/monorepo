import { NavLink, Route, Routes } from 'react-router-dom';
import { CatalogPage } from './pages/CatalogPage.tsx';
import { TitleDetailPage } from './pages/TitleDetailPage.tsx';
import { WatchlistPage } from './pages/WatchlistPage.tsx';

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  marginRight: 16,
  fontWeight: isActive ? 700 : 400,
  textDecoration: 'none',
  color: 'inherit',
});

export function App() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <nav style={{ marginBottom: 24 }}>
        <NavLink to="/" end style={navLinkStyle}>
          카탈로그
        </NavLink>
        <NavLink to="/watchlist" style={navLinkStyle}>
          위시리스트
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/titles/:id" element={<TitleDetailPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
      </Routes>
    </div>
  );
}
