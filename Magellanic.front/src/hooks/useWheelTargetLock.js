import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function useWheelTargetLock(controlsRef, constellations, cameraRef) {
  const lockedRef = useRef(false);

  useEffect(() => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    const el = controls?.domElement || camera?.domElement;
    if (!controls || !camera || !el) return;

    const vec = new THREE.Vector3();

    const onWheel = () => {
      if (lockedRef.current) return;
      lockedRef.current = true;

      let best = null;
      let bestD2 = Infinity;
      const hw = window.innerWidth / 2;
      const hh = window.innerHeight / 2;

      for (const c of constellations) {
        const center = c.center || c.position || c;
        if (!(center.x !== undefined && center.y !== undefined && center.z !== undefined)) continue;
        vec.copy(center).project(camera);
        if (vec.z >= 1) continue;
        const sx = (vec.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (vec.y * -0.5 + 0.5) * window.innerHeight;
        const d2 = (sx - hw) ** 2 + (sy - hh) ** 2;
        if (d2 < bestD2) { bestD2 = d2; best = center; }
      }

      if (best) {
        controls.target.copy(best);
        controls.update();
      }
    };

    const onDown = () => { lockedRef.current = false; };

    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('mousedown', onDown);
    el.addEventListener('touchstart', onDown);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('touchstart', onDown);
    };
  }, [controlsRef, constellations, cameraRef]);
}
