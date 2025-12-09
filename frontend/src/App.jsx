import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import RollsPage from './pages/RollsPage';
import ChemistryPage from './pages/ChemistryPage';
import CanisterDemo from './pages/CanisterDemo';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/rolls" replace />} />
          <Route path="/rolls" element={<RollsPage />} />
          <Route path="/chemistry" element={<ChemistryPage />} />
          <Route path="/canister-demo" element={<CanisterDemo />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
