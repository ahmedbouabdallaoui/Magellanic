import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

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
    const c = 0.4 + Math.random() * 0.6;
    colors[i * 3] = c;
    colors[i * 3 + 1] = c;
    colors[i * 3 + 2] = c + Math.random() * 0.2;
  }
  return { positions, colors };
}

function BackgroundStars() {
  const ref = useRef();
  const { positions, colors } = useMemo(() => randomStarField(6000), []);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.003;
    }
  });

  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.8} vertexColors sizeAttenuation />
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
  const range = Math.max(maxX - minX, maxY - minY, 1);
  return stars.map(s => ({
    x: ((s.x - cx) / range) * scale,
    y: ((s.y - cy) / range) * scale,
  }));
}

function ConstellationMesh({ constellation, onClick, isSelected }) {
  const groupRef = useRef();
  const starPositions = useMemo(
    () => normalizeStars(constellation.stars || []),
    [constellation.stars]
  );

  const connectionLines = useMemo(() => {
    if (!constellation.connections || !starPositions.length) return [];
    return constellation.connections.map(([i, j]) => {
      const a = starPositions[i];
      const b = starPositions[j];
      if (!a || !b) return null;
      return [a.x, a.y, 0, b.x, b.y, 0];
    }).filter(Boolean);
  }, [constellation.connections, starPositions]);

  const lineGeom = useMemo(() => {
    if (!connectionLines.length) return null;
    const positions = connectionLines.flat();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, [connectionLines]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {lineGeom && (
        <lineSegments geometry={lineGeom}>
          <lineBasicMaterial color={isSelected ? '#6a5acd' : '#4444aa'} transparent opacity={isSelected ? 1 : 0.6} />
        </lineSegments>
      )}
      {starPositions.map((pos, i) => (
        <mesh
          key={i}
          position={[pos.x, pos.y, 0]}
          onClick={(e) => { e.stopPropagation(); onClick(constellation); }}
        >
          <sphereGeometry args={[0.3 + (constellation.stars?.[i]?.mag ? (6 - constellation.stars[i].mag) * 0.08 : 0.2), 8, 8]} />
          <meshBasicMaterial color={isSelected ? '#6a5acd' : '#aaaaff'} />
        </mesh>
      ))}
    </group>
  );
}

export default function Starfield({ constellations, onSelectConstellation, selectedId }) {
  return (
    <div className="starfield-canvas">
      <Canvas camera={{ position: [0, 0, 50], fov: 60 }}>
        <BackgroundStars />
        {constellations.map((c) => (
          <ConstellationMesh
            key={c.id}
            constellation={c}
            onClick={onSelectConstellation}
            isSelected={c.id === selectedId}
          />
        ))}
        <OrbitControls enablePan={false} minDistance={20} maxDistance={150} />
      </Canvas>
    </div>
  );
}
