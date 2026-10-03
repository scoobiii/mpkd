import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { DetectedSceneObject } from '../types/objectDetection';
import { MonolitheModule, SubComponentDetail } from '../types/designModel';
import {
  Sparkles,
  X,
  Camera,
  RotateCw,
  Sun,
  Layers,
  Sliders,
  Download,
  Eye,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Maximize2
} from 'lucide-react';

// Angelo Po Monolithe High-Fidelity Textures
const TEXTURE_BRUSHED_STEEL = '/src/assets/images/brushed_steel_texture_1791068453461.jpg';
const TEXTURE_SCOTCH_BRITE = '/src/assets/images/scotch_brite_texture_1791068464181.jpg';
const TEXTURE_DARK_TITANIUM = '/src/assets/images/dark_titanium_metal_1791068472058.jpg';

const studioTextureLoader = new THREE.TextureLoader();
const loadStudioTex = (url: string, repeat = 4) => {
  const tex = studioTextureLoader.load(url);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
};

const studioBrushedTex = loadStudioTex(TEXTURE_BRUSHED_STEEL, 4);
const studioScotchBriteTex = loadStudioTex(TEXTURE_SCOTCH_BRITE, 4);
const studioDarkTitaniumTex = loadStudioTex(TEXTURE_DARK_TITANIUM, 4);

interface RealisticStudioRenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetObject: DetectedSceneObject | null;
  targetModule?: MonolitheModule | null;
  targetSubComponent?: SubComponentDetail | null;
}

export const RealisticStudioRenderModal: React.FC<RealisticStudioRenderModalProps> = ({
  isOpen,
  onClose,
  targetObject,
  targetModule,
  targetSubComponent,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [lightingPreset, setLightingPreset] = useState<'studio' | 'dramatic' | 'culinary' | 'clean'>('studio');
  const [metalness, setMetalness] = useState<number>(0.9);
  const [roughness, setRoughness] = useState<number>(0.2);
  const [clearcoat, setClearcoat] = useState<number>(0.3);
  const [finishGrade, setFinishGrade] = useState<'angelo_po_brushed' | 'scotch_brite' | 'dark_titanium' | 'mirror' | 'matte' | 'brass'>('angelo_po_brushed');
  const [isRenderingShot, setIsRenderingShot] = useState<boolean>(false);
  const [cameraZoom, setCameraZoom] = useState<number>(1.0);
  const [isTwoFingerRotatingState, setIsTwoFingerRotatingState] = useState<boolean>(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0a0f);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 5000);
    camera.position.set(0, 450, 1100);
    camera.lookAt(0, 80, 0);
    cameraRef.current = camera;

    // 3. High quality WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.5);
    keyLight.position.set(600, 1000, 800);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 100;
    keyLight.shadow.camera.far = 3000;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.2);
    fillLight.position.set(-800, 500, -400);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfef08a, 1.6);
    rimLight.position.set(0, 800, -900);
    scene.add(rimLight);

    // 5. Studio Stage Floor & Soft Contact Shadow
    const floorGeo = new THREE.PlaneGeometry(3000, 3000);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x12131a,
      roughness: 0.85,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -10;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor subtle circular grid ring
    const ringGeo = new THREE.RingGeometry(380, 384, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, opacity: 0.15, transparent: true, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -8;
    scene.add(ring);

    // 6. Object / Component Mesh Construction
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    buildTurntableMesh(meshGroup, targetObject, targetModule, targetSubComponent, metalness, roughness, clearcoat, finishGrade);

    // 7. Mouse drag to orbit
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      meshGroup.rotation.y += deltaX * 0.008;
      meshGroup.rotation.x = Math.max(-0.4, Math.min(0.6, meshGroup.rotation.x + deltaY * 0.008));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // 7.1 Touch interaction: two-finger 360° turntable spin and pinch zoom
    let prevTouchAngle: number | null = null;
    let prevTouchDist: number | null = null;
    let prevTouchMidX: number | null = null;
    let isTwoFingerRotating = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isTwoFingerRotating = true;
        setIsTwoFingerRotatingState(true);
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        prevTouchAngle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
        prevTouchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        prevTouchMidX = (t0.clientX + t1.clientX) / 2;
      } else if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isTwoFingerRotating) {
        e.preventDefault();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const currentAngle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
        const currentDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const currentMidX = (t0.clientX + t1.clientX) / 2;

        if (prevTouchAngle !== null) {
          let deltaAngle = currentAngle - prevTouchAngle;
          if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
          if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
          // 360-degree rotation of the turntable object!
          meshGroup.rotation.y += deltaAngle * 1.8;
        }

        if (prevTouchMidX !== null) {
          const deltaMidX = currentMidX - prevTouchMidX;
          meshGroup.rotation.y += deltaMidX * 0.008;
        }

        if (prevTouchDist !== null) {
          const deltaDist = currentDist - prevTouchDist;
          camera.position.z = Math.max(700, Math.min(2600, camera.position.z - deltaDist * 2.5));
        }

        prevTouchAngle = currentAngle;
        prevTouchDist = currentDist;
        prevTouchMidX = currentMidX;
      } else if (e.touches.length === 1 && isDragging) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;
        meshGroup.rotation.y += deltaX * 0.008;
        meshGroup.rotation.x = Math.max(-0.4, Math.min(0.6, meshGroup.rotation.x + deltaY * 0.008));
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isTwoFingerRotating = false;
        setIsTwoFingerRotatingState(false);
        prevTouchAngle = null;
        prevTouchDist = null;
        prevTouchMidX = null;
      }
      if (e.touches.length === 0) {
        isDragging = false;
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    // 8. Animation loop
    const animate = () => {
      if (isRotating && !isDragging && !isTwoFingerRotating) {
        meshGroup.rotation.y += 0.005;
      }
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      renderer.dispose();
    };
  }, [isOpen, targetObject, targetModule, targetSubComponent, finishGrade]);

  // Update materials when sliders change
  useEffect(() => {
    if (!meshGroupRef.current) return;
    meshGroupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.metalness = metalness;
        child.material.roughness = roughness;
        child.material.needsUpdate = true;
      }
    });
  }, [metalness, roughness, clearcoat]);

  // Update lighting preset
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    if (lightingPreset === 'studio') {
      scene.background = new THREE.Color(0x0a0a0f);
    } else if (lightingPreset === 'dramatic') {
      scene.background = new THREE.Color(0x020617);
    } else if (lightingPreset === 'culinary') {
      scene.background = new THREE.Color(0x1a0f08);
    } else if (lightingPreset === 'clean') {
      scene.background = new THREE.Color(0x18181b);
    }
  }, [lightingPreset]);

  // Handle capture PNG
  const handleCaptureSnapshot = () => {
    if (!rendererRef.current) return;
    setIsRenderingShot(true);
    setTimeout(() => {
      const dataUrl = rendererRef.current!.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `VUC-Realistic-Render-${targetObject?.code || 'component'}.png`;
      link.href = dataUrl;
      link.click();
      setIsRenderingShot(false);
    }, 200);
  };

  if (!isOpen || !targetObject) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col md:flex-row w-full max-w-6xl h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Left / Top 3D Turntable Viewport */}
        <div className="relative flex-1 h-[55%] md:h-full overflow-hidden bg-neutral-950">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Floating HUD tags on 3D Viewport */}
          <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none flex-wrap">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              STUDIO PBR TURNTABLE 360°
            </span>
            {isTwoFingerRotatingState ? (
              <span className="px-3 py-1 bg-sky-500/30 text-sky-300 border border-sky-400 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md animate-pulse">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                GIRO 360° COM 2 DEDOS ATIVO
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-neutral-900/80 text-sky-400 border border-sky-800/80 rounded-full text-[10px] font-mono backdrop-blur-md">
                Giro 360° com 2 dedos suportado
              </span>
            )}
            <span className="px-2.5 py-1 bg-neutral-900/80 text-neutral-300 border border-neutral-700 rounded-full text-[10px] font-mono backdrop-blur-md">
              ACES Filmic Tone Mapping
            </span>
          </div>

          {/* Bottom controls overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2 bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 p-1.5 rounded-xl text-xs">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`px-3 py-1.5 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition-colors ${
                  isRotating ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
                {isRotating ? 'Giro Ativo' : 'Pausado'}
              </button>

              <div className="h-4 w-px bg-neutral-800 mx-1" />

              <span className="text-[10px] text-neutral-400 px-1 font-mono">Gire 360° com 2 dedos ou arraste livremente</span>
            </div>

            <button
              onClick={handleCaptureSnapshot}
              disabled={isRenderingShot}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-xl cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{isRenderingShot ? 'Capturando...' : 'Exportar Foto Render 4K'}</span>
            </button>
          </div>
        </div>

        {/* Right / Bottom Parameter & Material Inspector Panel */}
        <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-neutral-800 bg-neutral-900/95 p-5 flex flex-col justify-between overflow-y-auto space-y-5 text-xs">
          
          {/* Header */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-mono text-amber-400 font-bold">
                  {targetObject.categoryLabel}
                </span>
                <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                  {targetObject.name}
                </h3>
                <span className="text-[11px] font-mono text-neutral-400">
                  Código: {targetObject.code}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
              {targetObject.materialDescription}
            </p>
          </div>

          {/* Real Manufacturer Link & Specs */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Objeto Real & Homologado
              </span>
              <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                DIN 18860 / NSF-2
              </span>
            </div>

            {targetModule?.manufacturer && (
              <div className="text-[11px] text-neutral-200">
                <span className="text-neutral-500 block text-[10px]">Fabricante Homologado:</span>
                <span className="font-semibold text-white">{targetModule.manufacturer}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-500 block text-[10px]">Dimensões:</span>
                <span className="text-amber-300">{targetObject.specs.dimensionsMm}</span>
              </div>
              <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-500 block text-[10px]">Potência:</span>
                <span className="text-white">
                  {targetObject.specs.electricKw ? `${targetObject.specs.electricKw} kW eléc.` : ''}
                  {targetObject.specs.gasKw ? `${targetObject.specs.gasKw} kW gás` : ''}
                  {!targetObject.specs.electricKw && !targetObject.specs.gasKw ? 'Neutro' : ''}
                </span>
              </div>
            </div>

            {targetModule?.datasheetUrl && (
              <a
                href={targetModule.datasheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-[11px] text-amber-400 transition-colors"
              >
                <span className="font-medium">Abrir Folha de Dados Técnica (Datasheet)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* PBR Material & Steel Finish Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Propriedades PBR do Aço & Luz
              </span>
              <span className="text-[10px] font-mono text-neutral-400">Microfacets Cook-Torrance</span>
            </div>

            {/* Finish Selection */}
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1.5">Acabamento Superficial do Aço:</label>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                <button
                  onClick={() => {
                    setFinishGrade('angelo_po_brushed');
                    setMetalness(0.90);
                    setRoughness(0.20);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors ${
                    finishGrade === 'angelo_po_brushed'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  Angelo Po Brushed Inox
                </button>
                <button
                  onClick={() => {
                    setFinishGrade('scotch_brite');
                    setMetalness(0.88);
                    setRoughness(0.30);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors ${
                    finishGrade === 'scotch_brite'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  Angelo Po Scotch-Brite
                </button>
                <button
                  onClick={() => {
                    setFinishGrade('dark_titanium');
                    setMetalness(0.94);
                    setRoughness(0.25);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors ${
                    finishGrade === 'dark_titanium'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  Angelo Po Dark Titanium
                </button>
                <button
                  onClick={() => {
                    setFinishGrade('mirror');
                    setMetalness(0.98);
                    setRoughness(0.04);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors ${
                    finishGrade === 'mirror'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  Cromo Duro Espelhado
                </button>
                <button
                  onClick={() => {
                    setFinishGrade('matte');
                    setMetalness(0.4);
                    setRoughness(0.75);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors ${
                    finishGrade === 'matte'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  Ferro Fundido Grelha
                </button>
                <button
                  onClick={() => {
                    setFinishGrade('brass');
                    setMetalness(0.85);
                    setRoughness(0.28);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors ${
                    finishGrade === 'brass'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  Latão Dourado Queimador
                </button>
              </div>
            </div>

            {/* Metalness Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-neutral-400">Metalness (Metalicidade):</span>
                <span className="text-amber-400 font-bold">{Math.round(metalness * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={metalness}
                onChange={(e) => setMetalness(parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Roughness Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-neutral-400">Roughness (Rugosidade / Difusão):</span>
                <span className="text-amber-400 font-bold">{Math.round(roughness * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="1"
                step="0.02"
                value={roughness}
                onChange={(e) => setRoughness(parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Lighting Rig Environment */}
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1.5">Ambiente de Iluminação:</label>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                <button
                  onClick={() => setLightingPreset('studio')}
                  className={`px-2 py-1.5 rounded-lg border text-center transition-colors ${
                    lightingPreset === 'studio' ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  Estúdio Neutro
                </button>
                <button
                  onClick={() => setLightingPreset('culinary')}
                  className={`px-2 py-1.5 rounded-lg border text-center transition-colors ${
                    lightingPreset === 'culinary' ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  Praça Quente (Flames)
                </button>
                <button
                  onClick={() => setLightingPreset('dramatic')}
                  className={`px-2 py-1.5 rounded-lg border text-center transition-colors ${
                    lightingPreset === 'dramatic' ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  Cinemático Escuro
                </button>
                <button
                  onClick={() => setLightingPreset('clean')}
                  className={`px-2 py-1.5 rounded-lg border text-center transition-colors ${
                    lightingPreset === 'clean' ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  Luz Técnica 6500K
                </button>
              </div>
            </div>
          </div>

          {/* VUC Cryptographic Hash Verification */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-[10px] space-y-1">
            <span className="text-neutral-500 block">VUC Cryptographic Identity:</span>
            <span className="text-emerald-400 break-all">{targetObject.vucHash}</span>
          </div>

        </div>
      </div>
    </div>
  );
};

// Helper: build high precision realistic 3D mesh for turntable
function buildTurntableMesh(
  group: THREE.Group,
  targetObject: DetectedSceneObject | null,
  targetModule?: MonolitheModule | null,
  targetSubComponent?: SubComponentDetail | null,
  metalness: number = 0.9,
  roughness: number = 0.2,
  clearcoat: number = 0.3,
  finishGrade: 'angelo_po_brushed' | 'scotch_brite' | 'dark_titanium' | 'mirror' | 'matte' | 'brass' = 'angelo_po_brushed'
) {
  // Common stainless steel material with Angelo Po textures
  let steelMap: THREE.Texture | null = null;
  let steelBump: THREE.Texture | null = null;
  let bumpScale = 0;
  let baseColor = 0xd8dee9;

  if (finishGrade === 'angelo_po_brushed') {
    steelMap = studioBrushedTex;
    steelBump = studioBrushedTex;
    bumpScale = 0.015;
  } else if (finishGrade === 'scotch_brite') {
    steelMap = studioScotchBriteTex;
    steelBump = studioScotchBriteTex;
    bumpScale = 0.025;
  } else if (finishGrade === 'dark_titanium') {
    steelMap = studioDarkTitaniumTex;
    steelBump = studioDarkTitaniumTex;
    bumpScale = 0.015;
    baseColor = 0x474c53;
  }

  const steelMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    map: steelMap,
    roughnessMap: steelMap,
    bumpMap: steelBump,
    bumpScale: bumpScale,
    metalness,
    roughness,
    envMapIntensity: 1.5,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.98,
    roughness: 0.04,
    envMapIntensity: 2.0,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    metalness: 0.88,
    roughness: 0.28,
  });

  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.25,
    roughness: 0.82,
  });

  const glassCeramicMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    opacity: 0.95,
  });

  // Base dimensions
  const w = targetObject?.boundingBox?.size?.[0] ? Math.min(800, targetObject.boundingBox.size[0]) : 600;
  const d = targetObject?.boundingBox?.size?.[2] ? Math.min(800, targetObject.boundingBox.size[2]) : 600;
  const h = targetObject?.boundingBox?.size?.[1] ? Math.min(600, targetObject.boundingBox.size[1]) : 400;

  // If inspecting a specific sub-component
  if (targetSubComponent) {
    const subGeo = new THREE.BoxGeometry(w * 0.9, h * 0.8, d * 0.9);
    const subMat = new THREE.MeshStandardMaterial({
      color: targetSubComponent.renderMaterial.color || '#d8dee9',
      metalness: targetSubComponent.renderMaterial.metalness ?? metalness,
      roughness: targetSubComponent.renderMaterial.roughness ?? roughness,
    });
    const subMesh = new THREE.Mesh(subGeo, subMat);
    subMesh.position.y = (h * 0.8) / 2;
    subMesh.castShadow = true;
    subMesh.receiveShadow = true;
    group.add(subMesh);
    return;
  }

  // If Wok induction
  if (targetObject?.category === 'THERMAL_INDUCTION' || targetModule?.type === 'induction_wok') {
    // Stainless base
    const baseGeo = new THREE.BoxGeometry(w, 200, d);
    const baseMesh = new THREE.Mesh(baseGeo, steelMat);
    baseMesh.position.y = 100;
    baseMesh.castShadow = true;
    group.add(baseMesh);

    // Beveled top ring
    const ringGeo = new THREE.CylinderGeometry(170, 185, 25, 64);
    const ringMesh = new THREE.Mesh(ringGeo, steelMat);
    ringMesh.position.y = 205;
    ringMesh.castShadow = true;
    group.add(ringMesh);

    // Concave glass bowl
    const bowlGeo = new THREE.SphereGeometry(160, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const bowlMesh = new THREE.Mesh(bowlGeo, glassCeramicMat);
    bowlMesh.rotation.x = Math.PI;
    bowlMesh.position.y = 210;
    group.add(bowlMesh);

    // Glowing induction coil underneath
    const coilGeo = new THREE.TorusGeometry(100, 12, 16, 48);
    const coilMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const coilMesh = new THREE.Mesh(coilGeo, coilMat);
    coilMesh.rotation.x = Math.PI / 2;
    coilMesh.position.y = 150;
    group.add(coilMesh);
  }
  // If Frytop Chrome
  else if (targetObject?.category === 'THERMAL_CHROME' || targetModule?.type === 'frytop_chrome') {
    const baseGeo = new THREE.BoxGeometry(w, 200, d);
    const baseMesh = new THREE.Mesh(baseGeo, steelMat);
    baseMesh.position.y = 100;
    group.add(baseMesh);

    const plateGeo = new THREE.BoxGeometry(w - 60, 20, d - 80);
    const plateMesh = new THREE.Mesh(plateGeo, chromeMat);
    plateMesh.position.y = 210;
    plateMesh.castShadow = true;
    group.add(plateMesh);

    // Splash guards
    const splashGeo = new THREE.BoxGeometry(w - 40, 60, 8);
    const splashMesh = new THREE.Mesh(splashGeo, steelMat);
    splashMesh.position.set(0, 240, -d / 2 + 50);
    group.add(splashMesh);
  }
  // If Gas Burner
  else if (targetObject?.category === 'THERMAL_GAS' || targetModule?.type === 'open_burner') {
    const baseGeo = new THREE.BoxGeometry(w, 200, d);
    const baseMesh = new THREE.Mesh(baseGeo, steelMat);
    baseMesh.position.y = 100;
    group.add(baseMesh);

    // Cast iron grate
    const grateGeo = new THREE.BoxGeometry(w - 40, 20, d - 60);
    const grateMesh = new THREE.Mesh(grateGeo, castIronMat);
    grateMesh.position.y = 215;
    grateMesh.castShadow = true;
    group.add(grateMesh);

    // Brass flower crowns
    const brassGeo = new THREE.CylinderGeometry(60, 65, 30, 32);
    const brass1 = new THREE.Mesh(brassGeo, brassMat);
    brass1.position.set(0, 205, -d * 0.18);
    group.add(brass1);

    const brass2 = new THREE.Mesh(brassGeo, brassMat);
    brass2.position.set(0, 205, d * 0.18);
    group.add(brass2);
  }
  // Generic or other kitchen elements
  else {
    const mainGeo = new THREE.BoxGeometry(w, h, d);
    const mainMesh = new THREE.Mesh(mainGeo, steelMat);
    mainMesh.position.y = h / 2;
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    group.add(mainMesh);

    // Top trim bevel
    const trimGeo = new THREE.BoxGeometry(w + 10, 15, d + 10);
    const trimMesh = new THREE.Mesh(trimGeo, steelMat);
    trimMesh.position.y = h + 5;
    trimMesh.castShadow = true;
    group.add(trimMesh);
  }

  // Front Control Knobs on every module
  const knobGeo = new THREE.CylinderGeometry(24, 24, 18, 32);
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
  const knob1 = new THREE.Mesh(knobGeo, knobMat);
  knob1.rotation.x = Math.PI / 2;
  knob1.position.set(-60, 140, d / 2 + 10);
  knob1.castShadow = true;
  group.add(knob1);

  const knob2 = new THREE.Mesh(knobGeo, knobMat);
  knob2.rotation.x = Math.PI / 2;
  knob2.position.set(60, 140, d / 2 + 10);
  knob2.castShadow = true;
  group.add(knob2);
}
