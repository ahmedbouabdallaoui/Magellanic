import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { progress as pApi, achievements as aApi, location as locApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [locMsg, setLocMsg] = useState('');
  const [locSaving, setLocSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/', { replace: true }); return; }
    Promise.all([
      pApi.get(),
      aApi.userMilestones(),
    ]).then(([pData, mData]) => {
      setProgress(pData);
      setBadges(mData || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading]);

  const discovered = progress.filter(p => p.discovered).length;
  const drawn = progress.filter(p => p.drawn).length;

  const handleLocation = async (e) => {
    e.preventDefault();
    setLocSaving(true);
    try {
      await locApi.update(parseFloat(lat), parseFloat(lng));
      setLocMsg('Coordinates recorded');
    } catch {
      setLocMsg('Failed to update');
    }
    setLocSaving(false);
  };

  const handleDetect = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLng(pos.coords.longitude.toFixed(4));
      },
      () => setLocMsg('Location unavailable')
    );
  };

  if (loading) return <div className="profile-page"><div className="loader" /></div>;

  const initial = user?.username?.charAt(0).toUpperCase() || '?';

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">{initial}</div>
        <h1 className="profile-name">{user?.username}</h1>
        <p className="profile-member">
          Observer since {new Date(user?.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-icon">✦</span>
          <span className="profile-stat-num">{discovered}</span>
          <span className="profile-stat-label">Discovered</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-icon">✧</span>
          <span className="profile-stat-num">{drawn}</span>
          <span className="profile-stat-label">Drawn</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-icon">★</span>
          <span className="profile-stat-num">{badges.length}</span>
          <span className="profile-stat-label">Milestones</span>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-section-head">
          <span className="profile-section-icon">⟐</span>
          <h3>Observation Log</h3>
        </div>
        <form onSubmit={handleLocation} className="profile-loc-form">
          <div className="profile-loc-inputs">
            <input
              placeholder="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              type="number"
              step="any"
            />
            <input
              placeholder="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              type="number"
              step="any"
            />
          </div>
          <div className="profile-loc-actions">
            <button type="submit" disabled={!lat || !lng || locSaving}>
              {locSaving ? 'Saving...' : 'Record'}
            </button>
            <button type="button" onClick={handleDetect} className="btn-outline">
              Auto-detect
            </button>
          </div>
          {locMsg && <p className="profile-loc-msg">{locMsg}</p>}
        </form>
      </div>

      {badges.length > 0 && (
        <div className="profile-section">
          <div className="profile-section-head">
            <span className="profile-section-icon">★</span>
            <h3>Milestone Badges</h3>
            <span className="profile-section-count">{badges.length}</span>
          </div>
          <div className="profile-badges">
            {badges.map((b, i) => (
              <div key={i} className="profile-badge" style={{ animationDelay: `${i * 50}ms` }}>
                <span className="profile-badge-icon">★</span>
                <div className="profile-badge-body">
                  <span className="profile-badge-name">{b.name}</span>
                  <span className="profile-badge-caption">{b.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
