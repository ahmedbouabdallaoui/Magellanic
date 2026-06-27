import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import DrawingCanvas from '../components/DrawingCanvas';

export default function Expert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [constellations, setConstellations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/', { replace: true }); return; }
    api.getConstellations().then(res => setConstellations(res.data)).catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const current = constellations[currentIndex];

  const handleComplete = async () => {
    if (!current) return;
    try {
      await api.drawConstellation(current.id);
    } catch {}
  };

  const handleNext = () => {
    if (currentIndex < constellations.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (loading) return <div className="page"><div className="loader" /></div>;
  if (!constellations.length) return <div className="page"><p>No constellations loaded.</p></div>;

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 64px)' }}>
      <div style={{
        position: 'absolute', top: 16, left: 16, zIndex: 10,
        background: 'var(--surface)', padding: '12px 20px', borderRadius: 'var(--radius)',
        border: '1px solid rgba(106,90,205,0.2)',
      }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 4 }}>{current.name}</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          {currentIndex + 1} of {constellations.length}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Click the stars in connection order to trace the constellation
        </p>
      </div>
      <DrawingCanvas constellation={current} onComplete={handleComplete} />
      {currentIndex < constellations.length - 1 && (
        <button
          onClick={handleNext}
          style={{
            position: 'absolute', bottom: 32, right: 32, zIndex: 10,
            padding: '12px 32px',
          }}
        >
          Next Constellation
        </button>
      )}
    </div>
  );
}
