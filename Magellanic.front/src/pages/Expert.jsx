import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { constellations as cApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useProgress } from '../hooks/useProgress';
import Starfield from '../components/Starfield';
import AchievementBadge from '../components/AchievementBadge';

function ProgressRing({ current, total }) {
  const pct = total > 0 ? current / total : 0;
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <svg width={40} height={40} viewBox="0 0 40 40" className="progress-ring">
      <circle cx={20} cy={20} r={r} fill="none" stroke="rgba(106,90,205,0.15)" strokeWidth={3} />
      <circle cx={20} cy={20} r={r} fill="none" stroke="var(--accent)" strokeWidth={3}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 20 20)" style={{ transition: 'stroke-dashoffset 0.3s ease-out' }} />
    </svg>
  );
}

export default function Expert() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [constellations, setConstellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawPrompt, setDrawPrompt] = useState(null);
  const [drawProgress, setDrawProgress] = useState({ current: 0, total: 0 });
  const [completedConstellation, setCompletedConstellation] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const { progress, markDrawn } = useProgress();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/', { replace: true }); return; }
    cApi.list().then(setConstellations).catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleProximity = useCallback((id) => {
    const c = constellations.find(c => c.id === id);
    if (!c) return;
    setDrawPrompt(c);
  }, [constellations]);

  const handleDrawComplete = useCallback(async (id) => {
    const c = constellations.find(c => c.id === id);
    if (!c) return;
    try {
      await markDrawn(id);
    } catch {}
    setDrawProgress({ current: 0, total: 0 });
    setDrawPrompt(null);
    setCompletedConstellation(c);
  }, [constellations, markDrawn]);

  const handleDrawProgress = useCallback((current, total) => {
    setDrawProgress({ current, total });
  }, []);

  const handleReset = () => {
    setDrawPrompt(null);
    setCompletedConstellation(null);
    setResetKey(k => k + 1);
  };

  const unDrawn = constellations.filter(c => !progress[c.id]?.drawn);

  if (loading) return <div className="page"><div className="loader" /></div>;
  if (!constellations.length) return <div className="page"><p>No constellations loaded.</p></div>;

  return (
    <div className="explore-view">
      <Starfield
        key={resetKey}
        constellations={constellations}
        mode="expert"
        onProximity={handleProximity}
        onDrawComplete={handleDrawComplete}
        onDrawProgress={handleDrawProgress}
      />

      {drawPrompt && !completedConstellation && (
        <div className="draw-prompt">
          <p>Draw this constellation — click stars in order</p>
        </div>
      )}

      <div className="expert-exit-area">
        <ProgressRing current={drawProgress.current} total={drawProgress.total} />
        <button className="expert-exit-btn" onClick={handleReset}>
          Exit
        </button>
      </div>

      {completedConstellation && (
        <div className="mastery-overlay">
          <AchievementBadge
            badge={{
              type: 'mastery',
              constellation_name: completedConstellation.name,
              caption: completedConstellation.mastery_badge_caption || 'Mastered by drawing',
            }}
            earned={true}
          />
          {unDrawn.length > 0 && (
            <button onClick={handleReset}>
              Next Constellation
            </button>
          )}
        </div>
      )}
    </div>
  );
}
