import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { constellations as cApi, progress as pApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import CommentSection from '../components/CommentSection';

export default function InspectorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [constellation, setConstellation] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/', { replace: true }); return; }
    cApi.get(id).then(setConstellation).catch(() => navigate('/explore'))
      .finally(() => setLoading(false));
    pApi.get().then(data => {
      const p = data.find(c => c.constellation_id === id);
      setProgress(p);
    }).catch(() => {});
  }, [id, user, authLoading]);

  const handleDiscover = async () => {
    try {
      await pApi.discover(id);
      setProgress(prev => ({ ...prev, discovered: true }));
    } catch {}
  };

  const handleDraw = async () => {
    try {
      await pApi.draw(id);
      setProgress(prev => ({ ...prev, drawn: true }));
    } catch {}
  };

  if (loading) return <div className="page"><div className="loader" /></div>;
  if (!constellation) return <div className="page"><p>Constellation not found.</p></div>;

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 600, width: '100%' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', marginBottom: 16, fontSize: '0.9rem' }}
        >
          Back
        </button>
        <h1 className="page-title" style={{ marginBottom: 4 }}>{constellation.name}</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: '0.9rem' }}>
          {constellation.latin_name} — {constellation.area}
        </p>

        <div style={{ marginBottom: 24 }}>
          <h3 className="inspector-section-title">Mythology</h3>
          <p style={{ lineHeight: 1.6 }}>{constellation.mythology}</p>
        </div>

        {user && (
          <div className="inspector-actions" style={{ marginBottom: 24 }}>
            {!progress?.discovered && (
              <button onClick={handleDiscover}>Mark as Discovered</button>
            )}
            {!progress?.drawn && (
              <button onClick={handleDraw}>Mark as Drawn</button>
            )}
          </div>
        )}

        <CommentSection constellationId={constellation.id} />
      </div>
    </div>
  );
}
