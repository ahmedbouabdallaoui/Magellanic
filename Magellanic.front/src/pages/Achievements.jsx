import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { constellations as cApi, progress as pApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function Achievements() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [constellations, setConstellations] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/', { replace: true }); return; }
    Promise.all([
      cApi.list(),
      pApi.get(),
    ]).then(([cData, pData]) => {
      setConstellations(cData);
      setProgress(pData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading]);

  const getProgress = (id) => progress.find(p => p.constellation_id === id);

  if (loading) return <div className="page"><div className="loader" /></div>;

  const discovered = constellations.filter(c => getProgress(c.id)?.discovered);
  const drawn = constellations.filter(c => getProgress(c.id)?.drawn);

  return (
    <div className="achv-page">
      <div className="achv-header">
        <h1 className="achv-title">Catalogue</h1>
        <p className="achv-subtitle">Your celestial discoveries</p>
      </div>

      <div className="achv-stats">
        <div className="achv-stat">
          <span className="achv-stat-icon">✦</span>
          <span className="achv-stat-num">{discovered.length}</span>
          <span className="achv-stat-label">Discovered</span>
        </div>
        <div className="achv-stat">
          <span className="achv-stat-icon">✧</span>
          <span className="achv-stat-num">{drawn.length}</span>
          <span className="achv-stat-label">Mastered</span>
        </div>
        <div className="achv-stat">
          <span className="achv-stat-icon">⋆</span>
          <span className="achv-stat-num">{constellations.length}</span>
          <span className="achv-stat-label">Total</span>
        </div>
      </div>

      <div className="achv-section">
        <div className="achv-section-head">
          <span className="achv-section-icon">✦</span>
          <h2>Discovery Badges</h2>
          <span className="achv-section-count">{discovered.length}/{constellations.length}</span>
        </div>
        <div className="achv-grid">
          {constellations.map((c, i) => {
            const p = getProgress(c.id);
            const earned = !!p?.discovered;
            return (
              <div
                key={c.id}
                className={`achv-card ${earned ? 'earned' : 'locked'}`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className="achv-card-icon">{earned ? '✦' : '☆'}</span>
                <div className="achv-card-body">
                  <span className="achv-card-name">{c.name}</span>
                  <span className="achv-card-caption">
                    {earned ? (c.discovery_badge_caption || 'Found in the night sky') : 'Not yet discovered'}
                  </span>
                </div>
                {earned && <span className="achv-card-check">✦</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="achv-section">
        <div className="achv-section-head">
          <span className="achv-section-icon">✧</span>
          <h2>Mastery Badges</h2>
          <span className="achv-section-count">{drawn.length}/{constellations.length}</span>
        </div>
        <div className="achv-grid">
          {constellations.map((c, i) => {
            const p = getProgress(c.id);
            const earned = !!p?.drawn;
            return (
              <div
                key={c.id}
                className={`achv-card ${earned ? 'earned' : 'locked'}`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className="achv-card-icon">{earned ? '✧' : '☆'}</span>
                <div className="achv-card-body">
                  <span className="achv-card-name">{c.name}</span>
                  <span className="achv-card-caption">
                    {earned ? (c.mastery_badge_caption || 'Mastered by drawing') : 'Not yet mastered'}
                  </span>
                </div>
                {earned && <span className="achv-card-check">✧</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
