import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CubeColor, CubeType, FaceletColors, FaceName, MoveName } from '../types/cube';

interface Cube3DProps {
  cubeType: CubeType;
  facelets: FaceletColors;
  onStickerClick?: (face: FaceName, index: number) => void;
  animatingMove: MoveName | null;
  onAnimationEnd?: () => void;
  speed: number;
  highlightFace?: FaceName | null;
}

const COLOR_MAP: Record<CubeColor, number> = {
  white: 0xf8fafc,
  yellow: 0xfacc15,
  green: 0x16a34a,
  blue: 0x2563eb,
  orange: 0xea580c,
  red: 0xdc2626,
};

// Sticker geometry helper
interface StickerRef {
  mesh: THREE.Mesh;
  face: FaceName;
  index: number;
}

interface CubieData {
  group: THREE.Group;
  initialPos: THREE.Vector3;
  stickers: StickerRef[];
}

export const Cube3D: React.FC<Cube3DProps> = ({
  cubeType,
  facelets,
  onStickerClick,
  animatingMove,
  onAnimationEnd,
  speed,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cubiesRef = useRef<CubieData[]>([]);
  const isAnimatingRef = useRef(false);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Keep facelets in a ref for color sync
  const faceletsRef = useRef(facelets);
  useEffect(() => {
    faceletsRef.current = facelets;
    updateStickerColors();
  }, [facelets]);

  // Update sticker colors
  const updateStickerColors = () => {
    const f = faceletsRef.current;
    cubiesRef.current.forEach((cubie) => {
      cubie.stickers.forEach(({ mesh, face, index }) => {
        const colorName = f[face]?.[index];
        if (colorName) {
          const hex = COLOR_MAP[colorName] || 0xffffff;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.color.setHex(hex);
        }
      });
    });
  };

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const camPos =
      cubeType === '4x4'
        ? new THREE.Vector3(6.8, 5.6, 7.8)
        : cubeType === '3x3'
        ? new THREE.Vector3(5.6, 4.8, 6.2)
        : new THREE.Vector3(4.2, 3.8, 4.8);
    camera.position.copy(camPos);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = cubeType === '4x4' ? 4.5 : cubeType === '3x3' ? 3.8 : 3.0;
    controls.maxDistance = 14;
    controls.rotateSpeed = 0.8;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight2.position.set(-5, -3, -5);
    scene.add(dirLight2);

    // Build cubies
    const cubies: CubieData[] = [];
    const cubieSize = 0.94;
    const stickerOffset = cubieSize / 2 + 0.005;
    const stickerSize = 0.84;

    const coords =
      cubeType === '4x4'
        ? [-1.5, -0.5, 0.5, 1.5]
        : cubeType === '3x3'
        ? [-1, 0, 1]
        : [-0.5, 0.5];

    coords.forEach((x) => {
      coords.forEach((y) => {
        coords.forEach((z) => {
          // In 3x3, skip hidden center core cubie at (0, 0, 0)
          if (cubeType === '3x3' && x === 0 && y === 0 && z === 0) return;
          // In 4x4, skip the 8 inner hidden core cubies
          if (cubeType === '4x4' && Math.abs(x) < 1 && Math.abs(y) < 1 && Math.abs(z) < 1) return;

          const group = new THREE.Group();
          group.position.set(x, y, z);

          // Inner black beveled core box
          const boxGeo = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);
          const boxMat = new THREE.MeshStandardMaterial({
            color: 0x18181b,
            roughness: 0.6,
            metalness: 0.1,
          });
          const core = new THREE.Mesh(boxGeo, boxMat);
          core.castShadow = true;
          core.receiveShadow = true;
          group.add(core);

          const stickers: StickerRef[] = [];

          // Helper to create sticker plane
          const addSticker = (
            face: FaceName,
            index: number,
            pos: THREE.Vector3,
            rot: THREE.Euler,
          ) => {
            const stickerGeo = new THREE.PlaneGeometry(stickerSize, stickerSize);
            const colorName = faceletsRef.current[face]?.[index] || 'white';
            const mat = new THREE.MeshStandardMaterial({
              color: COLOR_MAP[colorName] || 0xffffff,
              roughness: 0.25,
              metalness: 0.05,
              polygonOffset: true,
              polygonOffsetFactor: -1,
              polygonOffsetUnits: -1,
            });
            const mesh = new THREE.Mesh(stickerGeo, mat);
            mesh.position.copy(pos);
            mesh.rotation.copy(rot);
            mesh.userData = { face, index };
            group.add(mesh);
            stickers.push({ mesh, face, index });
          };

          if (cubeType === '2x2') {
            // Up / Down
            if (y > 0) {
              let idx = 0;
              if (x < 0 && z < 0) idx = 0; // UBL
              else if (x > 0 && z < 0) idx = 1; // UBR
              else if (x < 0 && z > 0) idx = 2; // UFL
              else if (x > 0 && z > 0) idx = 3; // UFR
              addSticker('U', idx, new THREE.Vector3(0, stickerOffset, 0), new THREE.Euler(-Math.PI / 2, 0, 0));
            } else {
              let idx = 0;
              if (x < 0 && z > 0) idx = 0; // DFL
              else if (x > 0 && z > 0) idx = 1; // DFR
              else if (x < 0 && z < 0) idx = 2; // DBL
              else if (x > 0 && z < 0) idx = 3; // DBR
              addSticker('D', idx, new THREE.Vector3(0, -stickerOffset, 0), new THREE.Euler(Math.PI / 2, 0, 0));
            }

            // Front / Back
            if (z > 0) {
              let idx = 0;
              if (x < 0 && y > 0) idx = 0; // UFL
              else if (x > 0 && y > 0) idx = 1; // UFR
              else if (x < 0 && y < 0) idx = 2; // DFL
              else if (x > 0 && y < 0) idx = 3; // DFR
              addSticker('F', idx, new THREE.Vector3(0, 0, stickerOffset), new THREE.Euler(0, 0, 0));
            } else {
              let idx = 0;
              if (x > 0 && y > 0) idx = 0; // UBR
              else if (x < 0 && y > 0) idx = 1; // UBL
              else if (x > 0 && y < 0) idx = 2; // DBR
              else if (x < 0 && y < 0) idx = 3; // DBL
              addSticker('B', idx, new THREE.Vector3(0, 0, -stickerOffset), new THREE.Euler(0, Math.PI, 0));
            }

            // Left / Right
            if (x < 0) {
              let idx = 0;
              if (z < 0 && y > 0) idx = 0; // UBL
              else if (z > 0 && y > 0) idx = 1; // UFL
              else if (z < 0 && y < 0) idx = 2; // DBL
              else if (z > 0 && y < 0) idx = 3; // DFL
              addSticker('L', idx, new THREE.Vector3(-stickerOffset, 0, 0), new THREE.Euler(0, -Math.PI / 2, 0));
            } else {
              let idx = 0;
              if (z > 0 && y > 0) idx = 0; // UFR
              else if (z < 0 && y > 0) idx = 1; // UBR
              else if (z > 0 && y < 0) idx = 2; // DFR
              else if (z < 0 && y < 0) idx = 3; // DBR
              addSticker('R', idx, new THREE.Vector3(stickerOffset, 0, 0), new THREE.Euler(0, Math.PI / 2, 0));
            }
          } else if (cubeType === '3x3') {
            // 3x3 cube sticker indexing
            // Up / Down
            if (y === 1) {
              const row = z === -1 ? 0 : z === 0 ? 1 : 2;
              const col = x === -1 ? 0 : x === 0 ? 1 : 2;
              const idx = row * 3 + col;
              addSticker('U', idx, new THREE.Vector3(0, stickerOffset, 0), new THREE.Euler(-Math.PI / 2, 0, 0));
            } else if (y === -1) {
              const row = z === 1 ? 0 : z === 0 ? 1 : 2;
              const col = x === -1 ? 0 : x === 0 ? 1 : 2;
              const idx = row * 3 + col;
              addSticker('D', idx, new THREE.Vector3(0, -stickerOffset, 0), new THREE.Euler(Math.PI / 2, 0, 0));
            }

            // Front / Back
            if (z === 1) {
              const row = y === 1 ? 0 : y === 0 ? 1 : 2;
              const col = x === -1 ? 0 : x === 0 ? 1 : 2;
              const idx = row * 3 + col;
              addSticker('F', idx, new THREE.Vector3(0, 0, stickerOffset), new THREE.Euler(0, 0, 0));
            } else if (z === -1) {
              const row = y === 1 ? 0 : y === 0 ? 1 : 2;
              const col = x === 1 ? 0 : x === 0 ? 1 : 2;
              const idx = row * 3 + col;
              addSticker('B', idx, new THREE.Vector3(0, 0, -stickerOffset), new THREE.Euler(0, Math.PI, 0));
            }

            // Left / Right
            if (x === -1) {
              const row = y === 1 ? 0 : y === 0 ? 1 : 2;
              const col = z === -1 ? 0 : z === 0 ? 1 : 2;
              const idx = row * 3 + col;
              addSticker('L', idx, new THREE.Vector3(-stickerOffset, 0, 0), new THREE.Euler(0, -Math.PI / 2, 0));
            } else if (x === 1) {
              const row = y === 1 ? 0 : y === 0 ? 1 : 2;
              const col = z === 1 ? 0 : z === 0 ? 1 : 2;
              const idx = row * 3 + col;
              addSticker('R', idx, new THREE.Vector3(stickerOffset, 0, 0), new THREE.Euler(0, Math.PI / 2, 0));
            }
          } else {
            // 4x4 cube sticker indexing
            // Up / Down
            if (y === 1.5) {
              const row = z === -1.5 ? 0 : z === -0.5 ? 1 : z === 0.5 ? 2 : 3;
              const col = x === -1.5 ? 0 : x === -0.5 ? 1 : x === 0.5 ? 2 : 3;
              const idx = row * 4 + col;
              addSticker('U', idx, new THREE.Vector3(0, stickerOffset, 0), new THREE.Euler(-Math.PI / 2, 0, 0));
            } else if (y === -1.5) {
              const row = z === 1.5 ? 0 : z === 0.5 ? 1 : z === -0.5 ? 2 : 3;
              const col = x === -1.5 ? 0 : x === -0.5 ? 1 : x === 0.5 ? 2 : 3;
              const idx = row * 4 + col;
              addSticker('D', idx, new THREE.Vector3(0, -stickerOffset, 0), new THREE.Euler(Math.PI / 2, 0, 0));
            }

            // Front / Back
            if (z === 1.5) {
              const row = y === 1.5 ? 0 : y === 0.5 ? 1 : y === -0.5 ? 2 : 3;
              const col = x === -1.5 ? 0 : x === -0.5 ? 1 : x === 0.5 ? 2 : 3;
              const idx = row * 4 + col;
              addSticker('F', idx, new THREE.Vector3(0, 0, stickerOffset), new THREE.Euler(0, 0, 0));
            } else if (z === -1.5) {
              const row = y === 1.5 ? 0 : y === 0.5 ? 1 : y === -0.5 ? 2 : 3;
              const col = x === 1.5 ? 0 : x === 0.5 ? 1 : x === -0.5 ? 2 : 3;
              const idx = row * 4 + col;
              addSticker('B', idx, new THREE.Vector3(0, 0, -stickerOffset), new THREE.Euler(0, Math.PI, 0));
            }

            // Left / Right
            if (x === -1.5) {
              const row = y === 1.5 ? 0 : y === 0.5 ? 1 : y === -0.5 ? 2 : 3;
              const col = z === -1.5 ? 0 : z === -0.5 ? 1 : z === 0.5 ? 2 : 3;
              const idx = row * 4 + col;
              addSticker('L', idx, new THREE.Vector3(-stickerOffset, 0, 0), new THREE.Euler(0, -Math.PI / 2, 0));
            } else if (x === 1.5) {
              const row = y === 1.5 ? 0 : y === 0.5 ? 1 : y === -0.5 ? 2 : 3;
              const col = z === 1.5 ? 0 : z === 0.5 ? 1 : z === -0.5 ? 2 : 3;
              const idx = row * 4 + col;
              addSticker('R', idx, new THREE.Vector3(stickerOffset, 0, 0), new THREE.Euler(0, Math.PI / 2, 0));
            }
          }

          scene.add(group);
          cubies.push({
            group,
            initialPos: new THREE.Vector3(x, y, z),
            stickers,
          });
        });
      });
    });

    cubiesRef.current = cubies;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cubeType]);

  // Handle click to color
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnimatingRef.current || !containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const stickerMeshes = cubiesRef.current.flatMap((c) => c.stickers.map((s) => s.mesh));
    const intersects = raycasterRef.current.intersectObjects(stickerMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const data = hit.userData as { face: FaceName; index: number };
      if (data && onStickerClick) {
        onStickerClick(data.face, data.index);
      }
    }
  };

  // Animate layer turn
  useEffect(() => {
    if (!animatingMove || isAnimatingRef.current || !sceneRef.current) return;

    const scene = sceneRef.current;
    isAnimatingRef.current = true;

    const isPrime = animatingMove.includes("'");
    const isDouble = animatingMove.includes('2');
    const base = animatingMove.replace(/['2]/g, '');

    // Determine axis and angle
    let axis = new THREE.Vector3(0, 1, 0);
    let totalAngle = -Math.PI / 2; // standard CW for U
    let layerFilter: (pos: THREE.Vector3) => boolean = () => true;

    if (base.includes('U')) {
      axis = new THREE.Vector3(0, 1, 0);
      totalAngle = isDouble ? -Math.PI : isPrime ? Math.PI / 2 : -Math.PI / 2;
      if (cubeType === '4x4') {
        if (base === 'Uw') layerFilter = (p) => p.y > 0.0;
        else if (base === '2U') layerFilter = (p) => p.y > 0.0 && p.y < 1.0;
        else layerFilter = (p) => p.y > 1.0;
      } else if (cubeType === '3x3') {
        layerFilter = (p) => p.y > 0.5;
      } else {
        layerFilter = (p) => p.y > 0.1;
      }
    } else if (base.includes('D')) {
      axis = new THREE.Vector3(0, 1, 0);
      totalAngle = isDouble ? Math.PI : isPrime ? -Math.PI / 2 : Math.PI / 2;
      if (cubeType === '4x4') {
        if (base === 'Dw') layerFilter = (p) => p.y < 0.0;
        else if (base === '2D') layerFilter = (p) => p.y < 0.0 && p.y > -1.0;
        else layerFilter = (p) => p.y < -1.0;
      } else if (cubeType === '3x3') {
        layerFilter = (p) => p.y < -0.5;
      } else {
        layerFilter = (p) => p.y < -0.1;
      }
    } else if (base.includes('R')) {
      axis = new THREE.Vector3(1, 0, 0);
      totalAngle = isDouble ? -Math.PI : isPrime ? Math.PI / 2 : -Math.PI / 2;
      if (cubeType === '4x4') {
        if (base === 'Rw') layerFilter = (p) => p.x > 0.0;
        else if (base === '2R') layerFilter = (p) => p.x > 0.0 && p.x < 1.0;
        else layerFilter = (p) => p.x > 1.0;
      } else if (cubeType === '3x3') {
        layerFilter = (p) => p.x > 0.5;
      } else {
        layerFilter = (p) => p.x > 0.1;
      }
    } else if (base.includes('L')) {
      axis = new THREE.Vector3(1, 0, 0);
      totalAngle = isDouble ? Math.PI : isPrime ? -Math.PI / 2 : Math.PI / 2;
      if (cubeType === '4x4') {
        if (base === 'Lw') layerFilter = (p) => p.x < 0.0;
        else if (base === '2L') layerFilter = (p) => p.x < 0.0 && p.x > -1.0;
        else layerFilter = (p) => p.x < -1.0;
      } else if (cubeType === '3x3') {
        layerFilter = (p) => p.x < -0.5;
      } else {
        layerFilter = (p) => p.x < -0.1;
      }
    } else if (base.includes('F')) {
      axis = new THREE.Vector3(0, 0, 1);
      totalAngle = isDouble ? -Math.PI : isPrime ? Math.PI / 2 : -Math.PI / 2;
      if (cubeType === '4x4') {
        if (base === 'Fw') layerFilter = (p) => p.z > 0.0;
        else if (base === '2F') layerFilter = (p) => p.z > 0.0 && p.z < 1.0;
        else layerFilter = (p) => p.z > 1.0;
      } else if (cubeType === '3x3') {
        layerFilter = (p) => p.z > 0.5;
      } else {
        layerFilter = (p) => p.z > 0.1;
      }
    } else if (base.includes('B')) {
      axis = new THREE.Vector3(0, 0, 1);
      totalAngle = isDouble ? Math.PI : isPrime ? -Math.PI / 2 : Math.PI / 2;
      if (cubeType === '4x4') {
        if (base === 'Bw') layerFilter = (p) => p.z < 0.0;
        else if (base === '2B') layerFilter = (p) => p.z < 0.0 && p.z > -1.0;
        else layerFilter = (p) => p.z < -1.0;
      } else if (cubeType === '3x3') {
        layerFilter = (p) => p.z < -0.5;
      } else {
        layerFilter = (p) => p.z < -0.1;
      }
    }

    // Find the cubies on that layer
    const activeCubies = cubiesRef.current.filter((c) => layerFilter(c.initialPos));

    // Create pivot
    const pivot = new THREE.Object3D();
    scene.add(pivot);

    activeCubies.forEach((c) => {
      pivot.attach(c.group);
    });

    // Animation variables
    const baseDuration = 320; // ms
    const duration = Math.max(100, baseDuration / speed);
    const startTime = performance.now();

    const animateRotation = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Smooth ease-out sine
      const ease = Math.sin((progress * Math.PI) / 2);
      const currentAngle = totalAngle * ease;

      pivot.setRotationFromAxisAngle(axis, currentAngle);

      if (progress < 1) {
        requestAnimationFrame(animateRotation);
      } else {
        // Re-attach cubies back to scene and restore canonical resting position & orientation
        activeCubies.forEach((c) => {
          scene.attach(c.group);
          c.group.position.copy(c.initialPos);
          c.group.rotation.set(0, 0, 0);
          c.group.updateMatrix();
        });
        scene.remove(pivot);

        isAnimatingRef.current = false;
        if (onAnimationEnd) {
          onAnimationEnd();
        }
      }
    };

    requestAnimationFrame(animateRotation);
  }, [animatingMove, speed, onAnimationEnd]);

  // Reset camera view preset
  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camPos = cubeType === '3x3' ? new THREE.Vector3(5.6, 4.8, 6.2) : new THREE.Vector3(4.2, 3.8, 4.8);
    cameraRef.current.position.copy(camPos);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full min-h-[380px] select-none">
      <div
        ref={containerRef}
        onClick={handleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating 3D view controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 pointer-events-auto">
        <button
          id="btn-reset-camera"
          onClick={resetCamera}
          title="重置3D视角"
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border border-slate-700/60 shadow-sm backdrop-blur transition-colors"
        >
          视角复位
        </button>
      </div>

      {/* Current rotation indicator hint badge */}
      {animatingMove && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-400 text-xs font-semibold tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          旋转中: {animatingMove}
        </div>
      )}
    </div>
  );
};
