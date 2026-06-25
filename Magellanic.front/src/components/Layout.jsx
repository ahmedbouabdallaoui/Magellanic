import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <nav className="nav">
        <Link to="/" className="nav-logo">Magellanic</Link>
        <div className="nav-links">
          {user ? (
            <>
              <Link to="/explore">Explore</Link>
              <Link to="/expert">Expert</Link>
              <Link to="/achievements">Achievements</Link>
              <Link to="/profile">{user.username}</Link>
              <button onClick={() => { logout(); navigate('/'); }}>Logout</button>
            </>
          ) : (
            <Link to="/">Sign In</Link>
          )}
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
