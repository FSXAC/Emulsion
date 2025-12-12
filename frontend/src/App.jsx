import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import RollsPage from './pages/RollsPage';
import ChemistryPage from './pages/ChemistryPage';
import StatsPage from './pages/StatsPage';
import CanisterDemo from './pages/CanisterDemo';
import soundManager from './utils/soundManager';
import './index.css';

function App() {
  // Preload sounds on app initialization
  useEffect(() => {
    // Preload sounds after a short delay to avoid blocking initial render
    const timer = setTimeout(() => {
      soundManager.preloadSounds().catch((err) => {
        // Silently fail - sounds will load on demand if preload fails
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to preload sounds:', err);
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/rolls" replace />} />
          <Route path="/rolls" element={<RollsPage />} />
          <Route path="/chemistry" element={<ChemistryPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/canister-demo" element={<CanisterDemo />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
