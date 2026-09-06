import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CubeColor, FaceletColors, FaceName, MoveName } from '../types/cube';

interface Cube3DProps {
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
  facelets,
  onStickerClick,
  animatingMove,
  onAnimationEnd,
  speed,
  highlightFace,
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
        const colorName = f[face][index];
        const hex = COLOR_MAP[colorName] || 0xffffff;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.color.setHex(hex);
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
    camera.position.set(4.2, 3.8, 4.8);
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
    controls.minDistance = 3.2;
    controls.maxDistance = 10;
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

    // Build the 8 cubies
    const cubies: CubieData[] = [];
    const cubieSize = 0.94;
    const stickerOffset = cubieSize / 2 + 0.005;
    const stickerSize = 0.84;

    const coords = [-0.5, 0.5];

    coords.forEach((x) => {
      coords.forEach((y) => {
        coords.forEach((z) => {
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
            const colorName = faceletsRef.current[face][index];
            const mat = new THREE.MeshStandardMaterial({
              color: COLOR_MAP[colorName],
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

          // Up / Down
          if (y > 0) {
            // Face U
            let idx = 0;
            if (x < 0 && z < 0) idx = 0; // UBL
            else if (x > 0 && z < 0) idx = 1; // UBR
            else if (x < 0 && z > 0) idx = 2; // UFL
            else if (x > 0 && z > 0) idx = 3; // UFR
            addSticker(
              'U',
              idx,
              new THREE.Vector3(0, stickerOffset, 0),
              new THREE.Euler(-Math.PI / 2, 0, 0),
            );
          } else {
            // Face D
            let idx = 0;
            if (x < 0 && z > 0) idx = 0; // DFL
            else if (x > 0 && z > 0) idx = 1; // DFR
            else if (x < 0 && z < 0) idx = 2; // DBL
            else if (x > 0 && z < 0) idx = 3; // DBR
            addSticker(
              'D',
              idx,
              new THREE.Vector3(0, -stickerOffset, 0),
              new THREE.Euler(Math.PI / 2, 0, 0),
            );
          }

          // Front / Back
          if (z > 0) {
            // Face F
            let idx = 0;
            if (x < 0 && y > 0) idx = 0; // UFL
            else if (x > 0 && y > 0) idx = 1; // UFR
            else if (x < 0 && y < 0) idx = 2; // DFL
            else if (x > 0 && y < 0) idx = 3; // DFR
            addSticker(
              'F',
              idx,
              new THREE.Vector3(0, 0, stickerOffset),
              new THREE.Euler(0, 0, 0),
            );
          } else {
            // Face B
            let idx = 0;
            if (x > 0 && y > 0) idx = 0; // UBR
            else if (x < 0 && y > 0) idx = 1; // UBL
            else if (x > 0 && y < 0) idx = 2; // DBR
            else if (x < 0 && y < 0) idx = 3; // DBL
            addSticker(
              'B',
              idx,
              new THREE.Vector3(0, 0, -stickerOffset),
              new THREE.Euler(0, Math.PI, 0),
            );
          }

          // Left / Right
          if (x < 0) {
            // Face L
            let idx = 0;
            if (z < 0 && y > 0) idx = 0; // UBL
            else if (z > 0 && y > 0) idx = 1; // UFL
            else if (z < 0 && y < 0) idx = 2; // DBL
            else if (z > 0 && y < 0) idx = 3; // DFL
            addSticker(
              'L',
              idx,
              new THREE.Vector3(-stickerOffset, 0, 0),
              new THREE.Euler(0, -Math.PI / 2, 0),
            );
          } else {
            // Face R
            let idx = 0;
            if (z > 0 && y > 0) idx = 0; // UFR
            else if (z < 0 && y > 0) idx = 1; // UBR
            else if (z > 0 && y < 0) idx = 2; // DFR
            else if (z < 0 && y < 0) idx = 3; // DBR
            addSticker(
              'R',
              idx,
              new THREE.Vector3(stickerOffset, 0, 0),
              new THREE.Euler(0, Math.PI / 2, 0),
            );
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
  }, []);

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

    const face = animatingMove[0] as FaceName;
    const isPrime = animatingMove.includes("'");
    const isDouble = animatingMove.includes('2');

    // Determine axis and angle
    let axis = new THREE.Vector3(0, 1, 0);
    let totalAngle = -Math.PI / 2; // standard CW for U
    let layerFilter: (pos: THREE.Vector3) => boolean = () => true;

    switch (face) {
      case 'U':
        axis = new THREE.Vector3(0, 1, 0);
        totalAngle = isDouble ? -Math.PI : isPrime ? Math.PI / 2 : -Math.PI / 2;
        layerFilter = (p) => p.y > 0.1;
        break;
      case 'D':
        axis = new THREE.Vector3(0, 1, 0);
        totalAngle = isDouble ? Math.PI : isPrime ? -Math.PI / 2 : Math.PI / 2;
        layerFilter = (p) => p.y < -0.1;
        break;
      case 'R':
        axis = new THREE.Vector3(1, 0, 0);
        totalAngle = isDouble ? -Math.PI : isPrime ? Math.PI / 2 : -Math.PI / 2;
        layerFilter = (p) => p.x > 0.1;
        break;
      case 'L':
        axis = new THREE.Vector3(1, 0, 0);
        totalAngle = isDouble ? Math.PI : isPrime ? -Math.PI / 2 : Math.PI / 2;
        layerFilter = (p) => p.x < -0.1;
        break;
      case 'F':
        axis = new THREE.Vector3(0, 0, 1);
        totalAngle = isDouble ? -Math.PI : isPrime ? Math.PI / 2 : -Math.PI / 2;
        layerFilter = (p) => p.z > 0.1;
        break;
      case 'B':
        axis = new THREE.Vector3(0, 0, 1);
        totalAngle = isDouble ? Math.PI : isPrime ? -Math.PI / 2 : Math.PI / 2;
        layerFilter = (p) => p.z < -0.1;
        break;
    }

    // Find the 4 cubies on that layer
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
    cameraRef.current.position.set(4.2, 3.8, 4.8);
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
