import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import AchievementBadge from '../components/AchievementBadge';

export default function Achievements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [constellations, setConstellations] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/', { replace: true }); return; }
    Promise.all([
      api.getConstellations(),
      api.getProgress(),
    ]).then(([cRes, pRes]) => {
      setConstellations(cRes.data);
      setProgress(pRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const getProgress = (id) => progress.find(p => p.constellation_id === id);

  if (loading) return <div className="page"><div className="loader" /></div>;

  const discovered = constellations.filter(c => getProgress(c.id)?.discovered);
  const drawn = constellations.filter(c => getProgress(c.id)?.drawn);

  return (
    <div className="page">
      <h1 className="page-title">Achievements</h1>

      <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', minWidth: 140 }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>{discovered.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Discovered</div>
        </div>
        <div className="card" style={{ textAlign: 'center', minWidth: 140 }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>{drawn.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Drawn</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: 16, alignSelf: 'flex-start' }}>Discovery Badges</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 500 }}>
        {constellations.map(c => {
          const p = getProgress(c.id);
          return (
            <AchievementBadge
              key={c.id}
              badge={{
                type: 'discovery',
                constellation_name: c.name,
                caption: c.discovery_badge_caption || 'Found in the night sky',
              }}
              earned={p?.discovered}
            />
          );
        })}
        {constellations.length === 0 && (
          <p style={{ color: 'var(--text-dim)', textAlign: 'center' }}>No constellations loaded.</p>
        )}
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: 16, marginTop: 32, alignSelf: 'flex-start' }}>Mastery Badges</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 500 }}>
        {constellations.map(c => {
          const p = getProgress(c.id);
          return (
            <AchievementBadge
              key={c.id}
              badge={{
                type: 'mastery',
                constellation_name: c.name,
                caption: c.mastery_badge_caption || 'Mastered by drawing',
              }}
              earned={p?.drawn}
            />
          );
        })}
      </div>
    </div>
  );
}
