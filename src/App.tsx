import { HashRouter, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ProblemListPage } from './pages/ProblemListPage';
import { ProblemPage } from './pages/ProblemPage';
import { InterviewPage } from './pages/InterviewPage';
import { PathDetailPage, PathsPage } from './pages/PathsPage';
import { ProgressPage } from './pages/ProgressPage';
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
