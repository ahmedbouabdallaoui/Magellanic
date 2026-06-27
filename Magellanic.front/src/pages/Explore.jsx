import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { constellations as api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useProgress } from '../hooks/useProgress';
import Starfield from '../components/Starfield';
import CommentSection from '../components/CommentSection';
import AchievementBadge from '../components/AchievementBadge';

export default function Explore() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [constellations, setConstellations] = useState([]);
  const [inspecting, setInspecting] = useState(null);
  const [closing, setClosing] = useState(false);
  const [showBadge, setShowBadge] = useState(null);
  const [loading, setLoading] = useState(true);
  const { progress, discover } = useProgress();
  const discoveredIds = useMemo(
    () => new Set(Object.entries(progress || {}).filter(([,v]) => v?.discovered).map(([k]) => k)),
    [progress]
  );
  const inspectingRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/', { replace: true }); return; }
    api.list().then(setConstellations).catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleProximity = useCallback(async (id) => {
    if (inspectingRef.current) return;
    const c = constellations.find(c => c.id === id);
    if (!c) return;
    inspectingRef.current = c;
    setInspecting(c);

    if (!progress[id]?.discovered) {
      try {
        await discover(id);
        setShowBadge(c);
        setTimeout(() => setShowBadge(null), 4000);
      } catch {}
    }
  }, [constellations, progress, discover]);

  const handleBack = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      inspectingRef.current = null;
      setInspecting(null);
      setClosing(false);
    }, 300);
  }, []);

  if (loading) return <div className="page"><div className="loader" /></div>;
  if (!constellations.length) return <div className="page"><p>No constellations loaded. Run the seed script.</p></div>;

  return (
    <div className={`explore-view ${inspecting ? 'explore-inspecting' : ''}`}>
      <Starfield
        constellations={constellations}
        mode="explore"
        onProximity={handleProximity}
        discoveredIds={discoveredIds}
        selectedId={inspecting?.id}
        focusId={inspecting?.id}
      />

      {inspecting && (
        <div className={`inspect-overlay ${closing ? 'inspect-closing' : ''}`}>
          <button className="inspect-overlay-close" onClick={handleBack}>Back to Explore</button>
          <h2 className="inspector-title">{inspecting.name}</h2>
          <p className="inspector-subtitle">{inspecting.latin_name} — {inspecting.area}</p>

          <div className="inspector-section">
            <h3>Mythology</h3>
            <p>{inspecting.mythology}</p>
          </div>

          {showBadge && (
            <div className="badge-inline">
              <AchievementBadge
                badge={{
                  type: 'discovery',
                  constellation_name: showBadge.name,
                  caption: showBadge.discovery_badge_caption || 'Found in the night sky',
                }}
                earned={true}
              />
            </div>
          )}

          <CommentSection constellationId={inspecting.id} />
        </div>
      )}

      {showBadge && !inspecting && (
        <div className="badge-popup">
          <AchievementBadge
            badge={{
              type: 'discovery',
              constellation_name: showBadge.name,
              caption: showBadge.discovery_badge_caption || 'Found in the night sky',
            }}
            earned={true}
          />
        </div>
      )}
    </div>
  );
}
