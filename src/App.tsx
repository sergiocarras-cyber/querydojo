import { lazy } from 'react';
import { HashRouter, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Heavier pages load on demand so the first paint only ships the home page.
const ProblemListPage = lazy(() => import('./pages/ProblemListPage').then((m) => ({ default: m.ProblemListPage })));
const ProblemPage = lazy(() => import('./pages/ProblemPage').then((m) => ({ default: m.ProblemPage })));
const PathsPage = lazy(() => import('./pages/PathsPage').then((m) => ({ default: m.PathsPage })));
const PathDetailPage = lazy(() => import('./pages/PathsPage').then((m) => ({ default: m.PathDetailPage })));
const InterviewPage = lazy(() => import('./pages/InterviewPage').then((m) => ({ default: m.InterviewPage })));
const ProgressPage = lazy(() => import('./pages/ProgressPage').then((m) => ({ default: m.ProgressPage })));

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
          <Route path="paths" element={<PathsPage />} />
          <Route path="paths/:pathId" element={<PathDetailPage />} />
          <Route path="interview" element={<InterviewPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
