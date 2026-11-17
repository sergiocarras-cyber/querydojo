import { HashRouter, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ProblemListPage } from './pages/ProblemListPage';
import { ProblemPage } from './pages/ProblemPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NotFoundPage } from './pages/NotFoundPage';

// HashRouter: deep links work on GitHub Pages without server rewrites.
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="problems" element={<ProblemListPage />} />
          <Route path="problems/:section" element={<ProblemListPage />} />
          <Route path="problem/:slug" element={<ProblemPage />} />
          <Route path="paths" element={<PlaceholderPage title="Rutas de estudio" phase={5} />} />
          <Route path="interview" element={<PlaceholderPage title="Modo entrevista" phase={5} />} />
          <Route path="progress" element={<PlaceholderPage title="Progreso" phase={5} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
