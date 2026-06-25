import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import CommentSection from './CommentSection';

export default function InspectorPanel({ constellation, onClose }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (user) {
      api.getProgress().then(res => {
        const p = res.data.find(c => c.constellation_id === constellation.id);
        setProgress(p);
      }).catch(() => {});
    }
  }, [user, constellation.id]);

  const handleDiscover = async () => {
    try {
      await api.discoverConstellation(constellation.id);
      setProgress(prev => ({ ...prev, discovered: true }));
    } catch {}
  };

  const handleDraw = async () => {
    try {
      await api.drawConstellation(constellation.id);
      setProgress(prev => ({ ...prev, drawn: true }));
    } catch {}
  };

  const handleBookmark = async () => {
    try {
      await api.toggleBookmark(constellation.id);
      setProgress(prev => ({ ...prev, bookmarked: !prev?.bookmarked }));
    } catch {}
  };

  return (
    <div className="inspector-panel">
      <button className="inspector-close" onClick={onClose}>×</button>
      <h2 className="inspector-title">{constellation.name}</h2>
      <p className="inspector-subtitle">{constellation.latin_name} — {constellation.area}</p>

      <div className="inspector-section">
        <h3>Mythology</h3>
        <p>{constellation.mythology}</p>
      </div>

      {user && (
        <div className="inspector-actions">
          {!progress?.discovered && (
            <button onClick={handleDiscover}>Mark as Discovered</button>
          )}
          {!progress?.drawn && (
            <button onClick={handleDraw}>Mark as Drawn</button>
          )}
          <button onClick={handleBookmark} className="btn-outline">
            {progress?.bookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
        </div>
      )}

      <div className="inspector-section">
        <CommentSection constellationId={constellation.id} />
      </div>
    </div>
  );
}
