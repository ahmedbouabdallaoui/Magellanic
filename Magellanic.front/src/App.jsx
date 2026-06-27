import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import Explore from './pages/Explore';
import Expert from './pages/Expert';
import InspectorPage from './pages/InspectorPage';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route path="/" element={<Onboarding />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/expert" element={<Expert />} />
        <Route path="/constellation/:id" element={<InspectorPage />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <AnimatedRoutes />
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
