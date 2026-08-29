import ReactDOM from 'react-dom/client';
// 이 순서를 지킬 것 — reset → astryx → theme. 바뀌면 컴포넌트가 스타일 없이 렌더된다.
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import App from './App.tsx';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App />);
}
