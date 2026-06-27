import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpen]);

  return (
    <div className="app-layout">
      <div className="floating-menu" ref={menuRef}>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          ≡
        </button>
        {menuOpen && (
          <div className="menu-dropdown">
            {user ? (
              <>
                <Link to="/explore" onClick={() => setMenuOpen(false)}>Explore</Link>
                <Link to="/expert" onClick={() => setMenuOpen(false)}>Expert</Link>
                <Link to="/achievements" onClick={() => setMenuOpen(false)}>Achievements</Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)}>{user.username}</Link>
                <button onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}>
                  Logout
                </button>
              </>
            ) : (
              <Link to="/" onClick={() => setMenuOpen(false)}>Sign In</Link>
            )}
          </div>
        )}
      </div>
      <main>{children}</main>
    </div>
  );
}
