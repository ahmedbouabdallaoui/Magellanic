import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [locMsg, setLocMsg] = useState('');

  useEffect(() => {
    if (!user) { navigate('/', { replace: true }); return; }
    Promise.all([
      api.getProgress(),
      api.getMilestones(),
    ]).then(([pRes, mRes]) => {
      setProgress(pRes.data);
      setBadges(mRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const discovered = progress.filter(p => p.discovered).length;
  const drawn = progress.filter(p => p.drawn).length;

  const handleLocation = async (e) => {
    e.preventDefault();
    try {
      await api.updateLocation(parseFloat(lat), parseFloat(lng));
      setLocMsg('Location updated');
    } catch {
      setLocMsg('Failed to update location');
    }
  };

  const handleDetect = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLng(pos.coords.longitude.toFixed(4));
      },
      () => setLocMsg('Could not detect location')
    );
  };

  if (loading) return <div className="page"><div className="loader" /></div>;

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 450, width: '100%' }}>
        <h1 className="page-title" style={{ marginBottom: 8 }}>{user?.username}</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: '0.85rem' }}>
          Member since {new Date(user?.created_at).toLocaleDateString()}
        </p>

        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          <div className="card" style={{ flex: 1, textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)' }}>{discovered}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Discovered</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)' }}>{drawn}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Drawn</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)' }}>{badges.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Milestones</div>
          </div>
        </div>

        <form onSubmit={handleLocation} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 12 }}>
            Location
          </h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={!lat || !lng}>Save</button>
            <button type="button" onClick={handleDetect} className="btn-outline">Detect</button>
          </div>
          {locMsg && <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 8 }}>{locMsg}</p>}
        </form>

        {badges.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 12 }}>
              Milestone Badges
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {badges.map((b, i) => (
                <div key={i} className="badge-card badge-earned">
                  <div className="badge-icon">★</div>
                  <div className="badge-info">
                    <div className="badge-name">{b.name}</div>
                    <div className="badge-caption">{b.caption}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
