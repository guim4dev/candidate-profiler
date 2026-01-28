import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DatabaseProvider } from './db/DatabaseProvider';
import { Layout } from './components/Layout';
import { CandidateList } from './pages/CandidateList';
import { CandidateDetail } from './pages/CandidateDetail';
import { ProfileManager } from './pages/ProfileManager';
import { Settings } from './pages/Settings';

function App() {
  return (
    <DatabaseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/candidates" replace />} />
            <Route path="candidates" element={<CandidateList />} />
            <Route path="candidates/:id" element={<CandidateDetail />} />
            <Route path="profiles" element={<ProfileManager />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DatabaseProvider>
  );
}

export default App;
