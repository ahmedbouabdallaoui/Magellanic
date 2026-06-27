import { useRef, useEffect } from 'react';

function normalizeStars(stars) {
  if (!stars || !stars.length) return [];
  const xs = stars.map(s => s.x);
  const ys = stars.map(s => s.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const range = Math.max(maxX - minX, maxY - minY, 0.001);
  return stars.map(s => ({
    x: ((s.x - cx) / range),
    y: ((s.y - cy) / range),
  }));
}

export default function ConstellationCanvas({ constellation }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const stars = constellation.stars_data || constellation.stars || [];
    const connections = constellation.connections || [];
    const normalized = normalizeStars(stars);
    const totalSegments = connections.length;

    let animFrame;
    let startTime = null;
    const SEGMENT_MS = 400;
    const STAGGER_MS = 30;
    const STAR_FADE_MS = 150;
    const starAppearTotal = Math.min(normalized.length * STAGGER_MS + STAR_FADE_MS, 600);

    const toScreen = (p, w, h, scale, ox, oy) => [
      ox + p.x * scale,
      oy + p.y * scale,
    ];

    const render = (timestamp) => {
      const rect = canvas.getBoundingClientRect();
      let w = rect.width;
      let h = rect.height;

      if (w === 0 || h === 0) {
        animFrame = requestAnimationFrame(render);
        return;
      }

      const dpr = devicePixelRatio;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (startTime === null) startTime = timestamp;

      const scale = Math.min(w, h) * 0.35;
      const ox = w / 2;
      const oy = h / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      const elapsed = timestamp - startTime;
      const segElapsed = Math.max(elapsed - starAppearTotal, 0);
      const currentSegment = Math.min(
        Math.floor(segElapsed / SEGMENT_MS),
        totalSegments
      );
      const segmentProgress = totalSegments > 0
        ? Math.min((segElapsed % SEGMENT_MS) / SEGMENT_MS, 1)
        : 1;

      ctx.strokeStyle = '#6a5acd';
      ctx.lineWidth = 2;
      for (let s = 0; s < currentSegment; s++) {
        const [i, j] = connections[s];
        const a = normalized[i];
        const b = normalized[j];
        if (!a || !b) continue;
        const [x1, y1] = toScreen(a, w, h, scale, ox, oy);
        const [x2, y2] = toScreen(b, w, h, scale, ox, oy);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      if (currentSegment < totalSegments) {
        const [i, j] = connections[currentSegment];
        const a = normalized[i];
        const b = normalized[j];
        if (a && b) {
          const [x1, y1] = toScreen(a, w, h, scale, ox, oy);
          const [x2, y2] = toScreen(b, w, h, scale, ox, oy);
          const px = x1 + (x2 - x1) * segmentProgress;
          const py = y1 + (y2 - y1) * segmentProgress;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      }

      normalized.forEach((pos, idx) => {
        const [sx, sy] = toScreen(pos, w, h, scale, ox, oy);
        const mag = stars[idx]?.mag;
        const baseRadius = mag ? 3 + (6 - mag) * 1.2 : 4;
        const starElapsed = elapsed - idx * STAGGER_MS;
        const starProgress = Math.min(Math.max(starElapsed / STAR_FADE_MS, 0), 1);
        const radius = baseRadius * starProgress;

        const drawn = connections.some(([i, j], s) =>
          s <= currentSegment && (i === idx || j === idx)
        );

        ctx.fillStyle = drawn ? '#6a5acd' : '#555577';
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();

        if (drawn) {
          ctx.strokeStyle = '#7b6ad8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(sx, sy, radius + 3 * starProgress, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      const totalDuration = starAppearTotal + totalSegments * SEGMENT_MS;
      if (elapsed < totalDuration) {
        animFrame = requestAnimationFrame(render);
      }
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [constellation]);

  return <canvas ref={canvasRef} className="constellation-canvas" />;
}
