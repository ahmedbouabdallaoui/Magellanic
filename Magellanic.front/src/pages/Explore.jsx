import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import Starfield from '../components/Starfield';
import InspectorPanel from '../components/InspectorPanel';

export default function Explore() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [constellations, setConstellations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/', { replace: true }); return; }
    api.getConstellations().then(res => setConstellations(res.data)).catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSelect = (c) => setSelected(c);

  if (loading) return <div className="page"><div className="loader" /></div>;
  if (!constellations.length) return <div className="page"><p>No constellations loaded. Run the seed script.</p></div>;

  return (
    <div className="explore-view">
      <Starfield
        constellations={constellations}
        onSelectConstellation={handleSelect}
        selectedId={selected?.id}
      />
      {selected && (
        <InspectorPanel constellation={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
