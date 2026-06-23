import { useState, useEffect } from 'react';
import { progress as progressApi } from '../api/client';
import { useAuth } from './useAuth';

export function useProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    progressApi.get().then(data => {
      const map = {};
      data.forEach(p => map[p.constellation_id] = p);
      setProgress(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const discover = async (id) => {
    await progressApi.discover(id);
    setProgress(p => ({ ...p, [id]: { ...p[id], discovered: true } }));
  };

  const markDrawn = async (id) => {
    await progressApi.draw(id);
    setProgress(p => ({ ...p, [id]: { ...p[id], drawn: true } }));
  };

  const toggleBookmark = async (id) => {
    await progressApi.bookmark(id);
    setProgress(p => ({
      ...p, [id]: { ...p[id], bookmarked: !p[id]?.bookmarked }
    }));
  };

  return { progress, loading, discover, markDrawn, toggleBookmark };
}
