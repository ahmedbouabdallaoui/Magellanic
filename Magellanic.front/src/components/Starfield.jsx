import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import useWheelTargetLock from '../hooks/useWheelTargetLock';

function randomStarField(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 200 + Math.random() * 800;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    const c = 0.3 + Math.random() * 0.5;
    colors[i * 3] = c;
    colors[i * 3 + 1] = c;
    colors[i * 3 + 2] = c + Math.random() * 0.15;
  }
  return { positions, colors };
}

function BackgroundStars() {
  const ref = useRef();
  const { positions, colors } = useMemo(() => randomStarField(8000), []);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.002;
    }
  });

  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.6} vertexColors sizeAttenuation opacity={0.9} transparent />
    </points>
  );
}

function normalizeStars(stars, scale = 20) {
  if (!stars || stars.length === 0) return [];
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
    x: ((s.x - cx) / range) * scale,
    y: ((s.y - cy) / range) * scale,
  }));
}

function computeCenter(stars, distanceLy = 80) {
  if (!stars || !stars.length) return new THREE.Vector3(0, 0, 0);
  const BASE = 200, SPREAD = 50;
  const logMin = Math.log(22), logMax = Math.log(20174);
  const t = (Math.log(distanceLy) - logMin) / (logMax - logMin);
  const radius = BASE - SPREAD + t * SPREAD * 2;
  let avgX = 0, avgY = 0, avgZ = 0;
  for (const s of stars) {
    avgX += s.x;
    avgY += s.y;
    avgZ += s.z;
  }
  avgX /= stars.length;
  avgY /= stars.length;
  avgZ /= stars.length;
  const len = Math.sqrt(avgX * avgX + avgY * avgY + avgZ * avgZ);
  if (len === 0) return new THREE.Vector3(0, 0, 0);
  return new THREE.Vector3(
    (avgX / len) * radius,
    (avgY / len) * radius,
    (avgZ / len) * radius,
  );
}

function FocusController({ targetCenter }) {
  const { camera } = useThree();
  const controls = useThree(s => s.controls);
  const INITIAL_POS = useMemo(() => new THREE.Vector3(0, 0, 50), []);
  const INITIAL_TARGET = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const returning = useRef(false);

  useFrame((_, delta) => {
    if (targetCenter) {
      returning.current = true;
      const VIEW_OFFSET = 20;
      const camTarget = new THREE.Vector3(targetCenter.x, targetCenter.y, targetCenter.z + VIEW_OFFSET);
      camera.position.lerp(camTarget, delta * 2);
      if (controls) {
        controls.target.lerp(targetCenter, delta * 2);
      }
    } else if (returning.current) {
      camera.position.lerp(INITIAL_POS, delta * 2);
      if (controls) {
        controls.target.lerp(INITIAL_TARGET, delta * 2);
      }
      if (camera.position.distanceTo(INITIAL_POS) < 0.5 &&
          controls?.target?.distanceTo(INITIAL_TARGET) < 0.5) {
        returning.current = false;
      }
    }
  });


  return null;
}

function WheelTargetLock({ entries }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const cameraRef = useRef();
  cameraRef.current = camera;

  useWheelTargetLock(controlsRef, entries, cameraRef);

  const controls = useThree(s => s.controls);
  controlsRef.current = controls;

  useEffect(() => {
    if (!controls || !camera) return;

    const logState = () => {
      console.group('OrbitControls state');
      console.log('camera type:', camera.type);
      console.log('camera position:', camera.position);
      console.log('camera near/far:', camera.near, camera.far);
      console.log('controls.target:', controls.target);
      console.log('controls.minDistance:', controls.minDistance);
      console.log('controls.maxDistance:', controls.maxDistance);
      console.log('controls.minZoom:', controls.minZoom);
      console.log('controls.maxZoom:', controls.maxZoom);
      console.log('controls.enableZoom:', controls.enableZoom);
      console.log('controls.enableDamping:', controls.enableDamping);
      console.log('controls.zoomSpeed:', controls.zoomSpeed);
      console.log('distance to target:', controls.getDistance());
      if (entries.length > 0) {
        const centers = entries.map(e => e.center || e);
        const dists = centers.map(c => camera.position.distanceTo(new THREE.Vector3(c.x, c.y, c.z)));
        console.log('nearest constellation distance:', Math.min(...dists));
        console.log('constellations loaded:', entries.length);
      }
      console.groupEnd();
    };

    controls.addEventListener('end', logState);
    logState();

    return () => controls.removeEventListener('end', logState);
  }, [controls, camera, entries]);

  return null;
}

function ProximitySensor({ entries, threshold, cooldownMs, onProximity, onNearestChange }) {
  const camera = useThree(s => s.camera);
  const lastFired = useRef({});
  const onProximityRef = useRef(onProximity);
  const onNearestChangeRef = useRef(onNearestChange);
  onProximityRef.current = onProximity;
  onNearestChangeRef.current = onNearestChange;
  const frustum = useRef(new THREE.Frustum());
  const projScreenMatrix = useRef(new THREE.Matrix4());

  useFrame(() => {
    const camPos = camera.position;
    projScreenMatrix.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.current.setFromProjectionMatrix(projScreenMatrix.current);

    let nearestId = null;
    let nearestDist = Infinity;

    for (const { id, center } of entries) {
      const dist = camPos.distanceTo(center);
      const inView = frustum.current.containsPoint(center);

      if (inView && dist < nearestDist) {
        nearestDist = dist;
        nearestId = id;
      }

      if (inView && dist < threshold) {
        const now = Date.now();
        const last = lastFired.current[id] || 0;
        if (now - last > cooldownMs) {
          lastFired.current[id] = now;
          onProximityRef.current?.(id);
        }
      }
    }

    onNearestChangeRef.current?.({ nearestId, nearestDist });
  });

  return null;
}

function StarMesh({ position, index, mag, isSelected, isActiveDraw, feedback, onClick }) {
  const meshRef = useRef();
  const baseSize = 0.15 + (mag ? (6 - mag) * 0.04 : 0.1);
  const time = useRef(Math.random() * 1000);
  const idlePos = useRef(new THREE.Vector3(position[0], position[1], position[2]));

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    time.current += delta;
    let scale = 1;
    if (isActiveDraw) {
      scale = 1 + Math.sin(time.current * 3 + index) * 0.2;
    }
    if (feedback?.starIdx === index) {
      if (feedback.type === 'wrong') {
        const sx = Math.sin(time.current * 80) * 0.3;
        meshRef.current.position.x = idlePos.current.x + sx;
        scale = 1.5 + Math.sin(time.current * 30) * 0.2;
      } else {
        meshRef.current.position.x += (idlePos.current.x - meshRef.current.position.x) * delta * 8;
        scale = 1.5;
      }
    } else {
      meshRef.current.position.x += (idlePos.current.x - meshRef.current.position.x) * delta * 8;
    }
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, scale, delta * 10)
    );
  });

  const color = feedback?.starIdx === index && feedback?.type === 'wrong'
    ? '#ff4444'
    : feedback?.starIdx === index && feedback?.type === 'correct'
      ? '#44cc88'
      : isSelected
        ? '#6a5acd'
        : '#555577';

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <sphereGeometry args={[baseSize, 8, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function ConstellationMesh({
  constellation,
  starPositions,
  mode,
  isSelected,
  isActiveDraw,
  nearestDist,
  onClickStar,
  onDrawClick,
  drawnLines,
  feedback,
  showAllLines,
  revealCount,
}) {
  const connections = constellation.connections || [];

  const visibleConnections = revealCount === -1
    ? connections
    : connections.slice(0, revealCount);

  const allConnectionPositions = useMemo(() => {
    if (!visibleConnections.length || !starPositions.length) return null;
    const positions = [];
    for (const [i, j] of visibleConnections) {
      const a = starPositions[i];
      const b = starPositions[j];
      if (!a || !b) continue;
      positions.push(a.x, a.y, 0, b.x, b.y, 0);
    }
    if (!positions.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, [visibleConnections, starPositions]);

  const drawnLinePositions = useMemo(() => {
    if (!drawnLines || drawnLines.length === 0) return null;
    const positions = [];
    for (const [i, j] of drawnLines) {
      const a = starPositions[i];
      const b = starPositions[j];
      if (!a || !b) continue;
      positions.push(a.x, a.y, 0, b.x, b.y, 0);
    }
    if (!positions.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, [drawnLines, starPositions]);

  const distOpacity = nearestDist != null
    ? THREE.MathUtils.clamp(1 - nearestDist / 40, 0.1, 1.0)
    : 0.6;

  return (
    <group>
      {showAllLines && allConnectionPositions && (
        <lineSegments geometry={allConnectionPositions}>
          <lineBasicMaterial
            color={isSelected ? '#6a5acd' : '#4444aa'}
            transparent
            opacity={isSelected ? 1 : distOpacity}
          />
        </lineSegments>
      )}

      {drawnLinePositions && (
        <lineSegments geometry={drawnLinePositions}>
          <lineBasicMaterial color="#8b7fff" transparent opacity={0.9} />
        </lineSegments>
      )}

      {starPositions.map((pos, i) => (
        <StarMesh
          key={i}
          position={[pos.x, pos.y, 0]}
          index={i}
          mag={(constellation.stars_data || constellation.stars)?.[i]?.mag}
          isSelected={isSelected}
          isActiveDraw={isActiveDraw && !feedback}
          feedback={feedback}
          onClick={() => {
            if (mode === 'expert' && isActiveDraw) {
              onDrawClick?.(constellation.id, i);
            } else {
              onClickStar?.(constellation);
            }
          }}
        />
      ))}
    </group>
  );
}

export default function Starfield({
  constellations = [],
  mode = 'explore',
  onProximity,
  onSelect,
  onDrawComplete,
  onDrawProgress,
  selectedId,
  focusId,
  revealCount = -1,
  discoveredIds,
}) {
  const centers = useMemo(
    () => constellations.map(c => computeCenter(c.stars_data || c.stars || [], c.distance_ly || 80)),
    [constellations]
  );

  const starPositionsMap = useMemo(
    () => constellations.map(c => normalizeStars(c.stars_data || c.stars || [], 20)),
    [constellations]
  );

  const [nearestId, setNearestId] = useState(null);
  const [nearestDist, setNearestDist] = useState(Infinity);

  const nearestCenter = useMemo(() => {
    if (!nearestId) return null;
    const idx = constellations.findIndex(c => c.id === nearestId);
    return idx >= 0 ? centers[idx] : null;
  }, [nearestId, constellations, centers]);

  const [drawing, setDrawing] = useState({
    activeId: null,
    clickedIndices: [],
    drawnLines: [],
    completed: false,
    feedback: null,
  });

  const drawingRef = useRef(drawing);
  useEffect(() => { drawingRef.current = drawing; }, [drawing]);

  useEffect(() => {
    if (mode !== 'expert' || !drawing.activeId || drawing.completed) {
      onDrawProgress?.(0, 0);
      return;
    }
    const c = constellations.find(c => c.id === drawing.activeId);
    if (!c) return;
    const connections = c.connections || [];
    const total = new Set(connections.flat()).size;
    onDrawProgress?.(drawing.clickedIndices.length, total);
  }, [drawing.clickedIndices.length, drawing.activeId, drawing.completed, mode, onDrawProgress, constellations]);

  const focusCenter = useMemo(() => {
    if (!focusId) return null;
    const idx = constellations.findIndex(c => c.id === focusId);
    return idx >= 0 ? centers[idx] : null;
  }, [focusId, constellations, centers]);

  const handleProximity = useCallback((id) => {
    if (mode === 'expert' && !drawingRef.current.activeId) {
      setDrawing({
        activeId: id,
        clickedIndices: [],
        drawnLines: [],
        completed: false,
        feedback: null,
      });
    }
    onProximity?.(id);
  }, [mode, onProximity]);

  const handleNearestChange = useCallback(({ nearestId: nid, nearestDist: nd }) => {
    setNearestId(nid);
    setNearestDist(nd);
  }, []);

  const handleDrawClick = useCallback((constellationId, starIdx) => {
    if (constellationId !== drawing.activeId || drawing.completed) return;
    if (drawing.clickedIndices.includes(starIdx)) return;

    const constellation = constellations.find(c => c.id === constellationId);
    if (!constellation) return;
    const connections = constellation.connections || [];
    const clicked = drawing.clickedIndices;

    const isCorrect = clicked.length === 0 ||
      connections.some(([i, j]) =>
        (i === starIdx && j === clicked[clicked.length - 1]) ||
        (j === starIdx && i === clicked[clicked.length - 1])
      );

    if (!isCorrect) {
      setDrawing(prev => ({
        ...prev,
        feedback: { type: 'wrong', starIdx },
      }));
      setTimeout(() => setDrawing(prev => ({ ...prev, feedback: null })), 400);
      return;
    }

    const newClicked = [...clicked, starIdx];
    const newLines = clicked.length > 0
      ? [...drawing.drawnLines, [clicked[clicked.length - 1], starIdx]]
      : drawing.drawnLines;

    const allStarIndices = new Set(connections.flat());
    const allClicked = [...allStarIndices].every(idx => newClicked.includes(idx));

    setDrawing(prev => ({
      ...prev,
      clickedIndices: newClicked,
      drawnLines: newLines,
      feedback: { type: 'correct', starIdx },
      completed: allClicked,
    }));

    if (allClicked) {
      onDrawComplete?.(constellationId);
    }

    setTimeout(() => setDrawing(prev => ({ ...prev, feedback: null })), 400);
  }, [drawing, constellations, onDrawComplete]);

  const constellationData = useMemo(
    () => constellations.map((c, i) => ({ id: c.id, center: centers[i] })),
    [constellations, centers]
  );

  const faceOriginQuats = useMemo(
    () => centers.map(c => {
      const dir = new THREE.Vector3().copy(c).negate().normalize();
      const q = new THREE.Quaternion();
      q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      return q;
    }),
    [centers]
  );

  return (
    <div className={`starfield-canvas ${mode === 'expert' ? 'starfield-expert' : ''}`}>
      <Canvas camera={{ position: [0, 0, 50], fov: 60 }}>
        <BackgroundStars />
        <FocusController targetCenter={focusCenter} />
        <WheelTargetLock entries={constellationData} />
        <ProximitySensor
          entries={constellationData}
          threshold={50}
          cooldownMs={5000}
          onProximity={handleProximity}
          onNearestChange={handleNearestChange}
        />
        {constellations.map((c, i) => (
          <group key={c.id} position={[centers[i].x, centers[i].y, centers[i].z]} quaternion={faceOriginQuats[i]}>
            <ConstellationMesh
              constellation={c}
              starPositions={starPositionsMap[i]}
              mode={mode}
              isSelected={c.id === selectedId}
              isActiveDraw={mode === 'expert' && drawing.activeId === c.id && !drawing.completed}
              nearestDist={nearestId === c.id ? nearestDist : null}
              onClickStar={onSelect}
              onDrawClick={handleDrawClick}
              drawnLines={drawing.activeId === c.id ? drawing.drawnLines : []}
              feedback={drawing.activeId === c.id ? drawing.feedback : null}
              showAllLines={mode === 'expert' ? drawing.completed : discoveredIds?.has(c.id)}
              revealCount={focusId && c.id === focusId ? revealCount : -1}
            />
          </group>
        ))}
        <OrbitControls enablePan={false} enableZoom={true} makeDefault />
      </Canvas>
    </div>
  );
}
