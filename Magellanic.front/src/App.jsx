import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import Explore from './pages/Explore';
import Expert from './pages/Expert';
import InspectorPage from './pages/InspectorPage';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/expert" element={<Expert />} />
            <Route path="/constellation/:id" element={<InspectorPage />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
