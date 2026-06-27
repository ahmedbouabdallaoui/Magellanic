import { useRef, useEffect, useState, useCallback } from 'react';

export default function DrawingCanvas({ constellation, onComplete }) {
  const canvasRef = useRef(null);
  const [clickedStars, setClickedStars] = useState([]);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [completed, setCompleted] = useState(false);

  const stars = constellation.stars || [];
  const connections = constellation.connections || [];

  const normalizeStars = useCallback((stars) => {
    if (!stars.length) return [];
    const xs = stars.map(s => s.x);
    const ys = stars.map(s => s.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const range = Math.max(maxX - minX, maxY - minY, 1);
    return stars.map(s => ({
      x: ((s.x - cx) / range),
      y: ((s.y - cy) / range),
    }));
  }, []);

  const normalized = normalizeStars(stars);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const w = rect.width;
    const h = rect.height;
    const scale = Math.min(w, h) * 0.35;
    const ox = w / 2;
    const oy = h / 2;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    const toScreen = (p) => [ox + p.x * scale, oy + p.y * scale];

    ctx.strokeStyle = 'rgba(68, 68, 170, 0.3)';
    ctx.lineWidth = 1;
    connections.forEach(([i, j]) => {
      const a = normalized[i];
      const b = normalized[j];
      if (!a || !b) return;
      const [x1, y1] = toScreen(a);
      const [x2, y2] = toScreen(b);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    normalized.forEach((pos, idx) => {
      const [sx, sy] = toScreen(pos);
      const isClicked = clickedStars.includes(idx);
      const size = stars[idx]?.mag ? 4 + (6 - stars[idx].mag) * 1.5 : 5;

      if (isClicked) {
        ctx.fillStyle = '#6a5acd';
      } else {
        ctx.fillStyle = '#8888aa';
      }
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();

      if (isClicked) {
        ctx.strokeStyle = '#6a5acd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, size + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    if (completed) {
      ctx.strokeStyle = '#6a5acd';
      ctx.lineWidth = 2;
      connections.forEach(([i, j]) => {
        const a = normalized[i];
        const b = normalized[j];
        if (!a || !b) return;
        if (!clickedStars.includes(i) || !clickedStars.includes(j)) return;
        const [x1, y1] = toScreen(a);
        const [x2, y2] = toScreen(b);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      ctx.fillStyle = '#44cc88';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Complete!', w / 2, 40);
    }

    if (wrongFlash) {
      ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
      ctx.fillRect(0, 0, w, h);
    }
  }, [normalized, connections, stars, clickedStars, completed, wrongFlash]);

  useEffect(() => {
    setClickedStars([]);
    setCompleted(false);
    setWrongFlash(false);
  }, [constellation.id]);

  const handleClick = (e) => {
    if (completed) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const scale = Math.min(w, h) * 0.35;
    const ox = w / 2;
    const oy = h / 2;

    let closest = -1;
    let minDist = Infinity;
    normalized.forEach((pos, idx) => {
      const sx = ox + pos.x * scale;
      const sy = oy + pos.y * scale;
      const d = Math.hypot(x - sx, y - sy);
      const hitRadius = 15;
      if (d < hitRadius && d < minDist) {
        minDist = d;
        closest = idx;
      }
    });

    if (closest === -1) return;

    if (clickedStars.includes(closest)) return;

    const isNext = clickedStars.length === 0 ||
      connections.some(([i, j]) =>
        (i === closest && clickedStars.includes(j)) ||
        (j === closest && clickedStars.includes(i))
      );

    if (!isNext) {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 300);
      return;
    }

    const newClicked = [...clickedStars, closest];
    setClickedStars(newClicked);

    const allStarIndices = new Set(normalized.map((_, i) => i));
    const allClicked = allStarIndices.size === newClicked.length;
    if (allClicked) {
      setCompleted(true);
      if (onComplete) onComplete();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="drawing-canvas"
      onClick={handleClick}
    />
  );
}
