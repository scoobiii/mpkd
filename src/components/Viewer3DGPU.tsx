import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { DesignModel } from '../types/designModel';
import { CatalogPanel } from './CatalogPanel';
import { ObjectClassificationInspector } from './ObjectClassificationInspector';
import { CollisionInspectorModal } from './CollisionInspectorModal';
import { RhinoCommandLine } from './RhinoCommandLine';
import { RhinoInteropModal } from './RhinoInteropModal';
import { extractAllSceneObjects } from '../vuc/objectDetector';
import { detectPhysicalCollisions, PhysicalCollision } from '../vuc/collisionDetector';
import { DetectedSceneObject, IFCClassificationClass } from '../types/objectDetection';
import {
  RhinoDisplayMode,
  RhinoAnalysisTool,
  RhinoCommandItem,
} from '../types/rhino';
import { CatalogItem, createModuleFromCatalog } from '../catalog/monolitheCatalog';
import { RealisticStudioRenderModal } from './RealisticStudioRenderModal';
import { GrasshopperNodeGraphModal } from './GrasshopperNodeGraphModal';
import { MonolitheModule } from '../types/designModel';
import {
  RotateCw,
  Eye,
  Maximize2,
  Layers,
  Cpu,
  Compass,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Scan,
  ShieldCheck,
  Pin,
  PinOff,
  Filter,
  CheckCircle2,
  Box,
  Wind,
  Zap,
  Flame,
  X,
  Crosshair,
  AlertTriangle,
  ShieldAlert,
  Wrench,
  Sliders,
  Scissors,
  Rainbow,
  Code2,
  Move,
  Terminal,
  FileCode,
  Camera as CameraIcon,
  LayoutGrid,
} from 'lucide-react';

interface Viewer3DGPUProps {
  model: DesignModel;
  setModel?: React.Dispatch<React.SetStateAction<DesignModel>>;
}

export const Viewer3DGPU: React.FC<Viewer3DGPUProps> = ({ model, setModel }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [explodedView, setExplodedView] = useState<boolean>(false);
  const [showMepPipes, setShowMepPipes] = useState<boolean>(true);
  const [showHood, setShowHood] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'top' | 'chef' | 'front'>('iso');
  const [is3DDragOver, setIs3DDragOver] = useState<boolean>(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(model.monolithe.modules[0]?.id || null);

  // 100% Suspended Menu States (Edge-triggered & Auto-retractable)
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState<boolean>(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState<boolean>(false);
  const [isBottomDockOpen, setIsBottomDockOpen] = useState<boolean>(false);

  // Pin toggles for suspended menus
  const [isLeftPinned, setIsLeftPinned] = useState<boolean>(false);
  const [isRightPinned, setIsRightPinned] = useState<boolean>(false);
  const [isBottomPinned, setIsBottomPinned] = useState<boolean>(false);

  const leftTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bottomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Opção Mask Object Detect & Classification ("Tudo é Objeto")
  const [isMaskDetectMode, setIsMaskDetectMode] = useState<boolean>(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  const [isolatedObjectId, setIsolatedObjectId] = useState<string | null>(null);
  const [activeClassFilter, setActiveClassFilter] = useState<'ALL' | IFCClassificationClass>('ALL');

  // Real-Time Interactive Physical Collision Overlay (Equipment vs Utilities)
  const [isCollisionOverlayActive, setIsCollisionOverlayActive] = useState<boolean>(true);
  const [mepOffsetZ, setMepOffsetZ] = useState<number>(0);
  const [elecOffsetY, setElecOffsetY] = useState<number>(0);
  const [activeCollisionId, setActiveCollisionId] = useState<string | null>(null);
  const [hoveredCollisionId, setHoveredCollisionId] = useState<string | null>(null);

  // =========================================================================
  // RHINOCEROS & GRASSHOPPER CAPABILITIES
  // =========================================================================
  const [rhinoDisplayMode, setRhinoDisplayMode] = useState<RhinoDisplayMode>('rendered');
  const [rhinoAnalysis, setRhinoAnalysis] = useState<RhinoAnalysisTool>('none');
  const [isClippingPlaneActive, setIsClippingPlaneActive] = useState<boolean>(false);
  const [clippingAxis, setClippingAxis] = useState<'x' | 'y' | 'z'>('y');
  const [clippingOffsetMm, setClippingOffsetMm] = useState<number>(450);
  const [isGumballActive, setIsGumballActive] = useState<boolean>(true);
  const [isRhinoInteropOpen, setIsRhinoInteropOpen] = useState<boolean>(false);
  const [isFourViewMode, setIsFourViewMode] = useState<boolean>(false);
  const [isGrasshopperModalOpen, setIsGrasshopperModalOpen] = useState<boolean>(false);

  // Atomic Decomposition ("Demembre Objetos ao Nível Mínimo")
  const [isAtomicDecomposed, setIsAtomicDecomposed] = useState<boolean>(false);
  const [atomicExplosionDistance, setAtomicExplosionDistance] = useState<number>(0);

  // Realistic Studio Render Modal (Turntable 360° PBR)
  const [isRealisticStudioOpen, setIsRealisticStudioOpen] = useState<boolean>(false);
  const [renderTargetObject, setRenderTargetObject] = useState<DetectedSceneObject | null>(null);

  const [rhinoCommandFeedback, setRhinoCommandFeedback] = useState<string>(
    'Digite um comando Rhino (ex: _Zebra, _Ghosted, _ClippingPlane, _Gumball, _Export3DM, _Demembre)'
  );

  // Real editable module handler (DesignModel as single source of truth)
  const handleUpdateModule = (updatedMod: MonolitheModule) => {
    if (!setModel) return;
    setModel(prev => {
      const newModules = prev.monolithe.modules.map(m => m.id === updatedMod.id ? updatedMod : m);
      const totalLength = newModules.reduce((acc, m) => acc + m.widthMm, 0);
      const totalElec = Number(newModules.reduce((acc, m) => acc + m.electricKw, 0).toFixed(1));
      const totalGas = Number(newModules.reduce((acc, m) => acc + m.gasKw, 0).toFixed(1));
      const totalExhaust = newModules.reduce((acc, m) => acc + m.exhaustFlowM3h, 0);
      return {
        ...prev,
        monolithe: {
          ...prev.monolithe,
          lengthMm: totalLength,
          modules: newModules,
        },
        derivedCalculations: {
          ...prev.derivedCalculations,
          totalElectricKw: totalElec,
          totalGasKw: totalGas,
          totalExhaustFlowM3h: totalExhaust,
          freshAirCompensationM3h: Math.round(totalExhaust * 0.8),
          linearMetersOfContinuousTop: Number((totalLength / 1000).toFixed(2)),
        }
      };
    });
  };

  // Real-time Physical Collisions between Equipment & Utilities
  const collisions = useMemo(() => {
    return detectPhysicalCollisions(model, mepOffsetZ, elecOffsetY);
  }, [model, mepOffsetZ, elecOffsetY]);

  const activeInspectedCollision = useMemo(() => {
    if (!activeCollisionId) return null;
    return collisions.find(c => c.id === activeCollisionId) || null;
  }, [activeCollisionId, collisions]);

  // Screen coordinates for floating 2D/3D AI-Vision Tags
  const [projectedObjects, setProjectedObjects] = useState<
    Array<{ id: string; name: string; ifcClass: string; confidence: number; x: number; y: number; visible: boolean; maskColor: string }>
  >([]);

  // Screen coordinates for floating 3D Collision Warnings
  const [projectedCollisions, setProjectedCollisions] = useState<
    Array<{ id: string; title: string; penetrationDepth: number; severity: string; x: number; y: number; visible: boolean }>
  >([]);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const topPlateGroupRef = useRef<THREE.Group | null>(null);
  const mepGroupRef = useRef<THREE.Group | null>(null);
  const hoodGroupRef = useRef<THREE.Group | null>(null);
  const masterGroupRef = useRef<THREE.Group | null>(null);

  // Animated collision meshes reference for live pulse
  const collisionMeshesRef = useRef<THREE.Mesh[]>([]);

  // Raycaster & Selectable meshes registry
  const selectableMeshesRef = useRef<THREE.Mesh[]>([]);

  // Mouse interaction state for manual orbit without OrbitControls package
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ radius: 4500, theta: Math.PI / 4, phi: Math.PI / 3 });

  // Extract all scene objects from DesignModel (atomic or high-level)
  const allSceneObjects = useMemo(() => {
    return extractAllSceneObjects(model, isAtomicDecomposed);
  }, [model, isAtomicDecomposed]);

  // Currently inspected object
  const activeInspectedObject = useMemo(() => {
    if (!selectedObjectId) return null;
    return allSceneObjects.find(o => o.id === selectedObjectId) || null;
  }, [selectedObjectId, allSceneObjects]);

  // Filtered objects based on activeClassFilter
  const filteredSceneObjects = useMemo(() => {
    if (activeClassFilter === 'ALL') return allSceneObjects;
    return allSceneObjects.filter(o => o.ifcClass === activeClassFilter);
  }, [allSceneObjects, activeClassFilter]);

  // Available Rhinoceros Commands Catalog
  const rhinoCommands: RhinoCommandItem[] = useMemo(
    () => [
      { id: 'mode_rendered', command: '_Rendered', name: 'Modo Rendered (PBR)', description: 'Renderização fotorealista de aço cirúrgico', category: 'VIEW', shortcut: 'R' },
      { id: 'mode_shaded', command: '_Shaded', name: 'Modo Shaded', description: 'Sombreado clássico Rhino CAD com arestas limpas', category: 'VIEW', shortcut: 'S' },
      { id: 'mode_ghosted', command: '_Ghosted', name: 'Modo Ghosted', description: 'Semitransparência 50% para ver redes MEP internas', category: 'VIEW', shortcut: 'G' },
      { id: 'mode_wireframe', command: '_Wireframe', name: 'Modo Wireframe', description: 'Linhas e isocurvas estruturais NURBS/BREP', category: 'VIEW', shortcut: 'W' },
      { id: 'mode_technical', command: '_Technical', name: 'Modo Technical', description: 'Estilo desenho técnico de prancheta com silhuetas', category: 'VIEW', shortcut: 'T' },
      { id: 'mode_arctic', command: '_Arctic', name: 'Modo Arctic', description: 'Modo Arctic Rhino com oclusão suave em branco puro', category: 'VIEW', shortcut: 'A' },
      { id: 'mode_4view', command: '_4View', name: 'Layout 4 Vistas Rhino', description: 'Visualização sincronizada Top / Front / Right / Perspective', category: 'VIEW', shortcut: '4' },
      { id: 'mode_1view', command: '_1View', name: 'Layout Vista Única', description: 'Maximizar vista única para tela inteira', category: 'VIEW', shortcut: '1' },
      { id: 'tool_zebra', command: '_Zebra', name: 'Análise Zebra (G0/G1/G2)', description: 'Continuidade de reflexão de listras na chapa cirúrgica', category: 'ANALYSIS', shortcut: 'Z' },
      { id: 'tool_curvature', command: '_CurvatureAnalysis', name: 'Análise de Curvatura', description: 'Falsa cor da curvatura do marine bevel 3mm', category: 'ANALYSIS', shortcut: 'K' },
      { id: 'tool_clipping', command: '_ClippingPlane', name: 'Plano de Corte Rhino', description: 'Corte transversal interativo em tempo real', category: 'ANALYSIS', shortcut: 'X' },
      { id: 'tool_gumball', command: '_Gumball', name: 'Widget Rhino Gumball', description: 'Manipulador 3D com eixos X/Y/Z e rotação', category: 'TRANSFORM' },
      { id: 'tool_demembre', command: '_Demembre', name: 'Demembrar ao Nível Mínimo', description: 'Decompor blocos nos componentes atômicos (chassis, cúpula, manípulos)', category: 'GEOMETRY', shortcut: 'E' },
      { id: 'render_studio', command: '_RenderStudio', name: 'Estúdio Render Realístico 360°', description: 'Abertura do turntable PBR com controle de metalicidade e rugosidade', category: 'VIEW' },
      { id: 'gh_nodes', command: '_Grasshopper', name: 'Definição Grasshopper Live', description: 'Canvas de programação algorítmica e nós paramétricos', category: 'TRANSFORM' },
      { id: 'export_3dm', command: '_Export3DM', name: 'Exportar Rhino .3DM', description: 'Salvar arquivo OpenNURBS com camadas nativas', category: 'EXPORT' },
      { id: 'tool_clash', command: '_Clash', name: 'Colisão Física MEP', description: 'Sobreposição de tubulações e equipamentos', category: 'ANALYSIS', shortcut: 'C' },
      { id: 'tool_mask', command: '_Mask', name: 'Object Detect & Máscaras', description: 'Segmentação semântica "Tudo é Objeto"', category: 'ANALYSIS', shortcut: 'M' },
    ],
    []
  );

  // Command Execution Dispatcher
  const handleExecuteRhinoCommand = (commandId: string) => {
    switch (commandId) {
      case 'mode_rendered':
        setRhinoDisplayMode('rendered');
        setRhinoAnalysis('none');
        setRhinoCommandFeedback('Modo de exibição alterado para Rendered (PBR Studio).');
        break;
      case 'mode_shaded':
        setRhinoDisplayMode('shaded');
        setRhinoAnalysis('none');
        setRhinoCommandFeedback('Modo de exibição alterado para Shaded CAD.');
        break;
      case 'mode_ghosted':
        setRhinoDisplayMode('ghosted');
        setRhinoCommandFeedback('Modo Ghosted ativado (50% transparência para inspeção interna).');
        break;
      case 'mode_wireframe':
        setRhinoDisplayMode('wireframe');
        setRhinoCommandFeedback('Modo Wireframe ativado (Arestas e Isoparamétricas NURBS/BREP).');
        break;
      case 'mode_technical':
        setRhinoDisplayMode('technical');
        setRhinoCommandFeedback('Modo Technical Blueprint ativado.');
        break;
      case 'mode_arctic':
        setRhinoDisplayMode('arctic');
        setRhinoCommandFeedback('Modo Arctic Rhino ativado (Oclusão difusa ambiente).');
        break;
      case 'mode_4view':
        setIsFourViewMode(true);
        setRhinoCommandFeedback('Layout Rhino 4 Vistas ativado (Top / Front / Right / Perspective).');
        break;
      case 'mode_1view':
        setIsFourViewMode(false);
        setRhinoCommandFeedback('Layout de Vista Única maximizado.');
        break;
      case 'tool_zebra':
        setRhinoAnalysis(prev => (prev === 'zebra' ? 'none' : 'zebra'));
        setRhinoCommandFeedback('Análise de Superfície Zebra alternada (continuidade G0/G1/G2).');
        break;
      case 'tool_curvature':
        setRhinoAnalysis(prev => (prev === 'curvature' ? 'none' : 'curvature'));
        setRhinoCommandFeedback('Análise de Curvatura Gaussiana alternada.');
        break;
      case 'tool_clipping':
        setIsClippingPlaneActive(prev => !prev);
        setRhinoCommandFeedback('Plano de Corte (ClippingPlane) alternado.');
        break;
      case 'tool_gumball':
        setIsGumballActive(prev => !prev);
        setRhinoCommandFeedback('Widget de Transformação Rhino Gumball alternado.');
        break;
      case 'tool_demembre':
        setIsAtomicDecomposed(prev => !prev);
        setRhinoCommandFeedback('Demembramento de objetos em nível atômico alternado.');
        break;
      case 'render_studio':
        if (activeInspectedObject) {
          setRenderTargetObject(activeInspectedObject);
        } else if (allSceneObjects.length > 0) {
          setRenderTargetObject(allSceneObjects[0]);
        }
        setIsRealisticStudioOpen(true);
        setRhinoCommandFeedback('Estúdio de Render Fotorealista PBR 360° aberto.');
        break;
      case 'gh_nodes':
        setIsGrasshopperModalOpen(true);
        setRhinoCommandFeedback('Canvas de Definição Grasshopper aberto.');
        break;
      case 'export_3dm':
        setIsRhinoInteropOpen(true);
        setRhinoCommandFeedback('Hub de Interoperabilidade Rhinoceros & Grasshopper aberto.');
        break;
      case 'tool_clash':
        setIsCollisionOverlayActive(prev => !prev);
        setRhinoCommandFeedback('Sobreposição de Colisão Física 3D alternada.');
        break;
      case 'tool_mask':
        setIsMaskDetectMode(prev => !prev);
        setRhinoCommandFeedback('Modo Object Detect & Classificação IFC alternado.');
        break;
    }
  };

  // Global Edge Trigger Detection (Mouse & Touch near extremes)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const x = e.clientX;
      const y = e.clientY;

      if (!isLeftPinned) {
        if (x <= 28) {
          if (leftTimeoutRef.current) clearTimeout(leftTimeoutRef.current);
          setIsLeftDrawerOpen(true);
        } else if (x > 360 && isLeftDrawerOpen) {
          if (leftTimeoutRef.current) clearTimeout(leftTimeoutRef.current);
          leftTimeoutRef.current = setTimeout(() => setIsLeftDrawerOpen(false), 1200);
        }
      }

      if (!isRightPinned) {
        if (x >= w - 28) {
          if (rightTimeoutRef.current) clearTimeout(rightTimeoutRef.current);
          setIsRightDrawerOpen(true);
        } else if (x < w - 420 && isRightDrawerOpen) {
          if (rightTimeoutRef.current) clearTimeout(rightTimeoutRef.current);
          rightTimeoutRef.current = setTimeout(() => setIsRightDrawerOpen(false), 1200);
        }
      }

      if (!isBottomPinned) {
        if (y >= h - 36) {
          if (bottomTimeoutRef.current) clearTimeout(bottomTimeoutRef.current);
          setIsBottomDockOpen(true);
        } else if (y < h - 140 && isBottomDockOpen) {
          if (bottomTimeoutRef.current) clearTimeout(bottomTimeoutRef.current);
          bottomTimeoutRef.current = setTimeout(() => setIsBottomDockOpen(false), 1200);
        }
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        const w = window.innerWidth;
        const h = window.innerHeight;

        if (touchStartX <= 40) setIsLeftDrawerOpen(true);
        if (touchStartX >= w - 40) setIsRightDrawerOpen(true);
        if (touchStartY >= h - 45) setIsBottomDockOpen(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'm' || e.key === 'M') setIsMaskDetectMode(prev => !prev);
      if (e.key === 'c' || e.key === 'C') setIsCollisionOverlayActive(prev => !prev);
      if (e.key === 'z' || e.key === 'Z') setRhinoAnalysis(prev => (prev === 'zebra' ? 'none' : 'zebra'));
      if (e.key === 'x' || e.key === 'X') setIsClippingPlaneActive(prev => !prev);
      if (e.key === 'g' || e.key === 'G') setRhinoDisplayMode(prev => (prev === 'ghosted' ? 'rendered' : 'ghosted'));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('keydown', handleKeyDown);
      if (leftTimeoutRef.current) clearTimeout(leftTimeoutRef.current);
      if (rightTimeoutRef.current) clearTimeout(rightTimeoutRef.current);
      if (bottomTimeoutRef.current) clearTimeout(bottomTimeoutRef.current);
    };
  }, [isLeftPinned, isRightPinned, isBottomPinned, isLeftDrawerOpen, isRightDrawerOpen, isBottomDockOpen]);

  // Main Three.js Scene Setup & Render Pipeline with Rhinoceros Shading & Clipping
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    const isArctic = rhinoDisplayMode === 'arctic';
    const isTechnical = rhinoDisplayMode === 'technical';

    const bgColor = isArctic ? 0xf8fafc : isTechnical ? 0x0f172a : 0x08080a;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.00014);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 50, 20000);
    cameraRef.current = camera;

    // 3. Renderer setup with Local Clipping Plane Support
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isArctic && !isTechnical;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true; // Enables Rhino ClippingPlane
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // Setup Rhino Clipping Plane if active
    let clippingPlane: THREE.Plane | null = null;
    if (isClippingPlaneActive) {
      const normal =
        clippingAxis === 'x'
          ? new THREE.Vector3(1, 0, 0)
          : clippingAxis === 'y'
          ? new THREE.Vector3(0, -1, 0)
          : new THREE.Vector3(0, 0, 1);
      clippingPlane = new THREE.Plane(normal, clippingOffsetMm);
      renderer.clippingPlanes = [clippingPlane];
    } else {
      renderer.clippingPlanes = [];
    }

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isArctic ? 1.4 : 0.7);
    scene.add(ambientLight);

    if (!isArctic) {
      const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.3);
      keyLight.position.set(2500, 4500, 3000);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.2);
      fillLight.position.set(-3000, 2500, -2000);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xfef08a, 0.9);
      rimLight.position.set(0, 1500, -4000);
      scene.add(rimLight);
    }

    // 5. Floor with tile grid
    const floorGeo = new THREE.PlaneGeometry(14000, 12000);
    const floorMat = new THREE.MeshStandardMaterial({
      color: isArctic ? 0xe2e8f0 : isTechnical ? 0x1e293b : 0x121215,
      roughness: 0.95,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(12000, 24, isArctic ? 0xcbd5e1 : 0x2e2e33, isArctic ? 0xe2e8f0 : 0x18181c);
    gridHelper.position.y = 1;
    scene.add(gridHelper);

    selectableMeshesRef.current = [];
    collisionMeshesRef.current = [];

    // 6. Build the 3D Monolithe Suite with Full Rhino Display Modes & Analysis
    buildMonolitheSuite3D(
      scene,
      model,
      selectedObjectId || selectedModuleId,
      isMaskDetectMode,
      isolatedObjectId,
      isCollisionOverlayActive,
      collisions,
      mepOffsetZ,
      elecOffsetY,
      activeCollisionId,
      rhinoDisplayMode,
      rhinoAnalysis,
      clippingPlane,
      isGumballActive
    );

    // Update camera position from spherical coords
    const updateCameraPosition = () => {
      const { radius, theta, phi } = sphericalRef.current;
      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);
      camera.position.set(x, Math.max(100, y), z);
      camera.lookAt(0, 500, 0);
    };
    updateCameraPosition();

    // 7. Mouse Orbit & Raycasting Handlers
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current && rendererRef.current && cameraRef.current) {
        const rect = container.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
        const intersects = raycaster.intersectObjects(selectableMeshesRef.current, true);

        if (intersects.length > 0) {
          let hitMesh: THREE.Object3D | null = intersects[0].object;
          while (
            hitMesh &&
            !hitMesh.userData?.objectId &&
            !hitMesh.userData?.collisionId &&
            hitMesh.parent
          ) {
            hitMesh = hitMesh.parent;
          }

          if (hitMesh?.userData?.collisionId) {
            setHoveredCollisionId(hitMesh.userData.collisionId);
            setHoveredObjectId(null);
            return;
          }

          if (hitMesh?.userData?.objectId) {
            setHoveredObjectId(hitMesh.userData.objectId);
            setHoveredCollisionId(null);
            return;
          }
        } else {
          setHoveredObjectId(null);
          setHoveredCollisionId(null);
        }
        return;
      }

      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      sphericalRef.current.theta -= deltaX * 0.007;
      sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, sphericalRef.current.phi - deltaY * 0.007));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      updateCameraPosition();
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onClick = (e: MouseEvent) => {
      if (!rendererRef.current || !cameraRef.current) return;
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      const intersects = raycaster.intersectObjects(selectableMeshesRef.current, true);

      if (intersects.length > 0) {
        let hitMesh: THREE.Object3D | null = intersects[0].object;
        while (
          hitMesh &&
          !hitMesh.userData?.objectId &&
          !hitMesh.userData?.collisionId &&
          hitMesh.parent
        ) {
          hitMesh = hitMesh.parent;
        }

        if (hitMesh?.userData?.collisionId) {
          setActiveCollisionId(hitMesh.userData.collisionId);
          setSelectedObjectId(null);
          return;
        }

        if (hitMesh?.userData?.objectId) {
          const objId = hitMesh.userData.objectId;
          setSelectedObjectId(objId);
          setSelectedModuleId(objId);
          setActiveCollisionId(null);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sphericalRef.current.radius = Math.max(1200, Math.min(9000, sphericalRef.current.radius + e.deltaY * 3));
      updateCameraPosition();
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('click', onClick);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Live pulsating collision mesh
      if (collisionMeshesRef.current.length > 0) {
        const pulse = 0.55 + 0.35 * Math.sin(Date.now() * 0.007);
        collisionMeshesRef.current.forEach((mesh) => {
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.emissiveIntensity = pulse;
          }
        });
      }

      renderer.render(scene, camera);

      // Project tags
      if (isMaskDetectMode && camera && container) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const projected = allSceneObjects.map(obj => {
          const pos = new THREE.Vector3(...obj.boundingBox.center);
          pos.project(camera);
          const isVisible = pos.z < 1 && pos.x >= -1.1 && pos.x <= 1.1 && pos.y >= -1.1 && pos.y <= 1.1;
          return {
            id: obj.id,
            name: obj.name,
            ifcClass: obj.ifcClass,
            confidence: obj.confidence,
            maskColor: obj.maskColor,
            x: (pos.x * 0.5 + 0.5) * w,
            y: (-(pos.y * 0.5) + 0.5) * h,
            visible: isVisible,
          };
        });
        setProjectedObjects(projected);
      }

      if (isCollisionOverlayActive && camera && container && collisions.length > 0) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const projCols = collisions.map(c => {
          const pos = new THREE.Vector3(...c.intersectionBox.center);
          pos.project(camera);
          const isVisible = pos.z < 1 && pos.x >= -1.1 && pos.x <= 1.1 && pos.y >= -1.1 && pos.y <= 1.1;
          return {
            id: c.id,
            title: c.title,
            penetrationDepth: c.penetrationDepthMm,
            severity: c.severity,
            x: (pos.x * 0.5 + 0.5) * w,
            y: (-(pos.y * 0.5) + 0.5) * h,
            visible: isVisible,
          };
        });
        setProjectedCollisions(projCols);
      } else {
        setProjectedCollisions([]);
      }
    };
    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('click', onClick);
      domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [
    model,
    selectedModuleId,
    selectedObjectId,
    isMaskDetectMode,
    isolatedObjectId,
    isCollisionOverlayActive,
    collisions,
    mepOffsetZ,
    elecOffsetY,
    activeCollisionId,
    rhinoDisplayMode,
    rhinoAnalysis,
    isClippingPlaneActive,
    clippingAxis,
    clippingOffsetMm,
    isGumballActive,
  ]);

  // Exploded View Effect
  useEffect(() => {
    if (!topPlateGroupRef.current) return;
    const targetY = explodedView ? 380 : 0;
    topPlateGroupRef.current.position.y = targetY;
  }, [explodedView]);

  // MEP Visibility
  useEffect(() => {
    if (mepGroupRef.current) {
      mepGroupRef.current.visible = showMepPipes;
    }
  }, [showMepPipes]);

  // Hood Visibility
  useEffect(() => {
    if (hoodGroupRef.current) {
      hoodGroupRef.current.visible = showHood;
    }
  }, [showHood]);

  // Camera Presets
  const applyPreset = (preset: 'iso' | 'top' | 'chef' | 'front') => {
    setCameraPreset(preset);
    if (!cameraRef.current) return;
    const camera = cameraRef.current;

    if (preset === 'iso') {
      sphericalRef.current = { radius: 4500, theta: Math.PI / 4, phi: Math.PI / 3 };
    } else if (preset === 'top') {
      sphericalRef.current = { radius: 4800, theta: 0.001, phi: 0.08 };
    } else if (preset === 'chef') {
      sphericalRef.current = { radius: 2400, theta: 0, phi: Math.PI / 2.3 };
    } else if (preset === 'front') {
      sphericalRef.current = { radius: 3600, theta: 0, phi: Math.PI / 2.1 };
    }

    const { radius, theta, phi } = sphericalRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);
    camera.position.set(x, Math.max(100, y), z);
    camera.lookAt(0, 500, 0);
  };

  const handleFocusClash = (clash: PhysicalCollision) => {
    if (!cameraRef.current) return;
    const [cx, cy, cz] = clash.intersectionBox.center;
    sphericalRef.current = { radius: 1800, theta: Math.PI / 3, phi: Math.PI / 2.4 };
    const { radius, theta, phi } = sphericalRef.current;
    const x = cx + radius * Math.sin(phi) * Math.sin(theta);
    const y = cy + radius * Math.cos(phi);
    const z = cz + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(cx, cy, cz);
  };

  const handleAutoFixClash = (clash: PhysicalCollision) => {
    setElecOffsetY(150);
    setMepOffsetZ(25);
    setActiveCollisionId(null);
  };

  // Helper: Procedural Rhino Zebra Stripes Texture (Canvas)
  function createZebraTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#ffffff';
      const stripeCount = 24;
      const stripeWidth = 512 / stripeCount;
      for (let i = 0; i < stripeCount; i += 2) {
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, 512);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
  }

  // Helper: Rhino Gumball 3D Transformation Widget
  function createRhinoGumball(center: [number, number, number], activeObjName: string) {
    const gumball = new THREE.Group();
    gumball.position.set(center[0], center[1], center[2]);

    const axisLen = 220;
    const headLen = 35;
    const headWidth = 14;

    // X-Axis (Red Arrow)
    const dirX = new THREE.Vector3(1, 0, 0);
    const arrowX = new THREE.ArrowHelper(dirX, new THREE.Vector3(0, 0, 0), axisLen, 0xef4444, headLen, headWidth);
    gumball.add(arrowX);

    // Y-Axis (Green Arrow)
    const dirY = new THREE.Vector3(0, 1, 0);
    const arrowY = new THREE.ArrowHelper(dirY, new THREE.Vector3(0, 0, 0), axisLen, 0x10b981, headLen, headWidth);
    gumball.add(arrowY);

    // Z-Axis (Blue Arrow)
    const dirZ = new THREE.Vector3(0, 0, 1);
    const arrowZ = new THREE.ArrowHelper(dirZ, new THREE.Vector3(0, 0, 0), axisLen, 0x3b82f6, headLen, headWidth);
    gumball.add(arrowZ);

    // Rotation Arc in XZ plane (Cyan)
    const curve = new THREE.EllipseCurve(0, 0, 130, 130, 0, Math.PI * 1.5, false, 0);
    const points = curve.getPoints(50);
    const geoArc = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0, p.y)));
    const matArc = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 2 });
    const arc = new THREE.Line(geoArc, matArc);
    gumball.add(arc);

    // Center pivot sphere
    const pivotGeo = new THREE.SphereGeometry(12, 16, 16);
    const pivotMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const pivot = new THREE.Mesh(pivotGeo, pivotMat);
    gumball.add(pivot);

    return gumball;
  }

  function createCornerBox(size: [number, number, number], colorHex: string) {
    const group = new THREE.Group();
    const [sx, sy, sz] = size;
    const hx = sx / 2;
    const hy = sy / 2;
    const hz = sz / 2;
    const bracketLen = Math.min(60, Math.min(sx, sy, sz) * 0.25);

    const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(colorHex), linewidth: 2 });

    const corners = [
      [-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz],
      [-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz],
    ];

    corners.forEach(([cx, cy, cz]) => {
      const dirX = cx < 0 ? 1 : -1;
      const dirY = cy < 0 ? 1 : -1;
      const dirZ = cz < 0 ? 1 : -1;

      const pts = [
        new THREE.Vector3(cx, cy, cz), new THREE.Vector3(cx + dirX * bracketLen, cy, cz),
        new THREE.Vector3(cx, cy, cz), new THREE.Vector3(cx, cy + dirY * bracketLen, cz),
        new THREE.Vector3(cx, cy, cz), new THREE.Vector3(cx, cy + dirZ * bracketLen),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.LineSegments(geo, mat);
      group.add(line);
    });

    return group;
  }

  // Build the 3D Monolithe Object Model with Rhinoceros Shading, Analysis & Gumball
  function buildMonolitheSuite3D(
    scene: THREE.Scene,
    model: DesignModel,
    activeObjId: string | null = null,
    isMaskMode: boolean = false,
    isolatedId: string | null = null,
    isCollisionActive: boolean = true,
    activeCollisions: PhysicalCollision[] = [],
    offsetZ: number = 0,
    offsetElecY: number = 0,
    activeClashId: string | null = null,
    displayMode: RhinoDisplayMode = 'rendered',
    analysisTool: RhinoAnalysisTool = 'none',
    clipPlane: THREE.Plane | null = null,
    showGumball: boolean = true
  ) {
    const suite = model.monolithe;
    const totalLength = suite.lengthMm;
    const depth = suite.depthMm;
    const height = suite.heightMm;

    // Rhino Display Modes material logic
    const isWireframe = displayMode === 'wireframe';
    const isGhosted = displayMode === 'ghosted';
    const isArctic = displayMode === 'arctic';
    const isTechnical = displayMode === 'technical';
    const isZebra = analysisTool === 'zebra';
    const isCurvature = analysisTool === 'curvature';

    const zebraTex = isZebra ? createZebraTexture() : null;

    // Ghost material for isolated mode
    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.12,
      wireframe: true,
      clippingPlanes: clipPlane ? [clipPlane] : [],
    });

    // PBR Standard Materials with Rhino Shading & Analysis mapping
    const baseSteelColor = isArctic
      ? 0xffffff
      : isTechnical
      ? 0x334155
      : isMaskMode
      ? 0x8b5cf6
      : 0xd8dde3;

    const stainlessSteelMat = new THREE.MeshStandardMaterial({
      color: isZebra ? 0xffffff : isCurvature ? 0x06b6d4 : baseSteelColor,
      map: isZebra ? zebraTex : null,
      metalness: isArctic ? 0.05 : isTechnical ? 0.1 : isMaskMode ? 0.3 : 0.88,
      roughness: isArctic ? 0.95 : isTechnical ? 0.8 : isMaskMode ? 0.4 : 0.22,
      transparent: isGhosted,
      opacity: isGhosted ? 0.45 : 1.0,
      wireframe: isWireframe,
      emissive: isMaskMode ? 0x2e1065 : 0x000000,
      emissiveIntensity: isMaskMode ? 0.25 : 0,
      clippingPlanes: clipPlane ? [clipPlane] : [],
    });

    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: isArctic ? 0xe2e8f0 : isTechnical ? 0x1e293b : isMaskMode ? 0x64748b : 0x3a3f45,
      metalness: isArctic ? 0.1 : 0.85,
      roughness: 0.35,
      transparent: isGhosted,
      opacity: isGhosted ? 0.45 : 1.0,
      wireframe: isWireframe,
      clippingPlanes: clipPlane ? [clipPlane] : [],
    });

    const mirrorChromeMat = new THREE.MeshStandardMaterial({
      color: isCurvature ? 0xef4444 : isMaskMode ? 0xec4899 : 0xf1f5f9,
      map: isZebra ? zebraTex : null,
      metalness: isArctic ? 0.2 : 0.98,
      roughness: isArctic ? 0.8 : 0.06,
      transparent: isGhosted,
      opacity: isGhosted ? 0.5 : 1.0,
      wireframe: isWireframe,
      emissive: isMaskMode ? 0x831843 : 0x000000,
      emissiveIntensity: isMaskMode ? 0.3 : 0,
      clippingPlanes: clipPlane ? [clipPlane] : [],
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: isCurvature ? 0xf59e0b : isMaskMode ? 0xef4444 : 0xd97706,
      metalness: isArctic ? 0.1 : 0.85,
      roughness: 0.25,
      wireframe: isWireframe,
      clippingPlanes: clipPlane ? [clipPlane] : [],
    });

    const ceramicWokMat = new THREE.MeshStandardMaterial({
      color: isCurvature ? 0x3b82f6 : isMaskMode ? 0xf59e0b : 0x0f172a,
      map: isZebra ? zebraTex : null,
      metalness: 0.4,
      roughness: 0.1,
      transparent: isGhosted,
      opacity: isGhosted ? 0.45 : 1.0,
      wireframe: isWireframe,
      emissive: isMaskMode ? 0x78350f : 0x000000,
      emissiveIntensity: isMaskMode ? 0.3 : 0,
      clippingPlanes: clipPlane ? [clipPlane] : [],
    });

    // Master Group centered at (0, 0, 0)
    const masterGroup = new THREE.Group();
    masterGroupRef.current = masterGroup;

    // 1. Undercounter Base Plinth / Compartments
    const baseGroup = new THREE.Group();
    const plinthHeight = 120;
    const baseHeight = height - plinthHeight - 60;

    const isChassisIsolated = isolatedId && isolatedId !== 'obj-structural-chassis';

    const plinthGeo = new THREE.BoxGeometry(totalLength - 100, plinthHeight, depth - 100);
    const plinthMesh = new THREE.Mesh(plinthGeo, isChassisIsolated ? ghostMat : darkSteelMat);
    plinthMesh.position.set(0, plinthHeight / 2, 0);
    plinthMesh.userData = { objectId: 'obj-structural-chassis' };
    selectableMeshesRef.current.push(plinthMesh);
    baseGroup.add(plinthMesh);

    let currentX = -totalLength / 2;
    suite.modules.forEach((mod) => {
      const modWidth = mod.widthMm;
      const modCenterX = currentX + modWidth / 2;
      currentX += modWidth;

      const isModIsolated = isolatedId && isolatedId !== mod.id;

      const cabinetGeo = new THREE.BoxGeometry(modWidth - 10, baseHeight, depth - 30);
      const cabinetMesh = new THREE.Mesh(cabinetGeo, isModIsolated ? ghostMat : stainlessSteelMat);
      cabinetMesh.position.set(modCenterX, plinthHeight + baseHeight / 2, 0);
      cabinetMesh.castShadow = true;
      cabinetMesh.receiveShadow = true;
      cabinetMesh.userData = { objectId: mod.id };
      selectableMeshesRef.current.push(cabinetMesh);
      baseGroup.add(cabinetMesh);

      const handleGeo = new THREE.CylinderGeometry(6, 6, modWidth * 0.6, 12);
      const handleMesh = new THREE.Mesh(handleGeo, isModIsolated ? ghostMat : stainlessSteelMat);
      handleMesh.rotation.z = Math.PI / 2;
      handleMesh.position.set(modCenterX, plinthHeight + baseHeight * 0.7, depth / 2 - 10);
      handleMesh.userData = { objectId: mod.id };
      selectableMeshesRef.current.push(handleMesh);
      baseGroup.add(handleMesh);
    });

    masterGroup.add(baseGroup);

    // 2. Monolithe Continuous Seamless Top Plate
    const topPlateGroup = new THREE.Group();
    topPlateGroupRef.current = topPlateGroup;

    const isTopPlateIsolated = isolatedId && isolatedId !== 'obj-continuous-top-plate';

    const topPlateGeo = new THREE.BoxGeometry(totalLength, 60, depth);
    const topPlateMesh = new THREE.Mesh(topPlateGeo, isTopPlateIsolated ? ghostMat : stainlessSteelMat);
    topPlateMesh.position.set(0, height - 30, 0);
    topPlateMesh.castShadow = true;
    topPlateMesh.receiveShadow = true;
    topPlateMesh.userData = { objectId: 'obj-continuous-top-plate' };
    selectableMeshesRef.current.push(topPlateMesh);
    topPlateGroup.add(topPlateMesh);

    // Marine Bevel Anti-Spill Edge (12mm curvature)
    const marineBorderGeo = new THREE.BoxGeometry(totalLength + 20, 15, depth + 20);
    const marineBorderMat = isCurvature
      ? new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.2 }) // High curvature fillet
      : stainlessSteelMat;
    const marineBorderMesh = new THREE.Mesh(marineBorderGeo, isTopPlateIsolated ? ghostMat : marineBorderMat);
    marineBorderMesh.position.set(0, height - 7.5, 0);
    marineBorderMesh.userData = { objectId: 'obj-continuous-top-plate' };
    selectableMeshesRef.current.push(marineBorderMesh);
    topPlateGroup.add(marineBorderMesh);

    // Module Top Elements
    currentX = -totalLength / 2;
    suite.modules.forEach((mod) => {
      const modWidth = mod.widthMm;
      const modCenterX = currentX + modWidth / 2;
      currentX += modWidth;

      const isModIsolated = isolatedId && isolatedId !== mod.id;

      if (mod.type === 'induction_wok') {
        const bowlGeo = new THREE.SphereGeometry(180, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const bowlMesh = new THREE.Mesh(bowlGeo, isModIsolated ? ghostMat : ceramicWokMat);
        bowlMesh.rotation.x = Math.PI;
        bowlMesh.position.set(modCenterX, height + 2, 0);
        bowlMesh.userData = { objectId: mod.id };
        selectableMeshesRef.current.push(bowlMesh);
        topPlateGroup.add(bowlMesh);

        if (!isArctic && !isTechnical) {
          const ringGeo = new THREE.TorusGeometry(120, 8, 16, 32);
          const ringMat = new THREE.MeshBasicMaterial({ color: isMaskMode ? 0xf59e0b : 0xef4444 });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = Math.PI / 2;
          ringMesh.position.set(modCenterX, height - 40, 0);
          topPlateGroup.add(ringMesh);
        }
      } else if (mod.type === 'frytop_chrome') {
        const planchaGeo = new THREE.BoxGeometry(modWidth - 80, 25, depth - 160);
        const planchaMesh = new THREE.Mesh(planchaGeo, isModIsolated ? ghostMat : mirrorChromeMat);
        planchaMesh.position.set(modCenterX, height + 10, 0);
        planchaMesh.userData = { objectId: mod.id };
        selectableMeshesRef.current.push(planchaMesh);
        topPlateGroup.add(planchaMesh);

        const gutterGeo = new THREE.BoxGeometry(modWidth - 60, 10, 25);
        const gutterMesh = new THREE.Mesh(gutterGeo, darkSteelMat);
        gutterMesh.position.set(modCenterX, height + 5, depth / 2 - 60);
        topPlateGroup.add(gutterMesh);
      } else if (mod.type === 'open_burner') {
        for (let b = -1; b <= 1; b += 2) {
          const burnerYOffset = b * (depth * 0.22);
          const grateGeo = new THREE.BoxGeometry(220, 25, 220);
          const grateMesh = new THREE.Mesh(grateGeo, isModIsolated ? ghostMat : darkSteelMat);
          grateMesh.position.set(modCenterX, height + 12, burnerYOffset);
          grateMesh.userData = { objectId: mod.id };
          selectableMeshesRef.current.push(grateMesh);
          topPlateGroup.add(grateMesh);

          const brassGeo = new THREE.CylinderGeometry(55, 65, 20, 24);
          const brassMesh = new THREE.Mesh(brassGeo, isModIsolated ? ghostMat : brassMat);
          brassMesh.position.set(modCenterX, height + 18, burnerYOffset);
          brassMesh.userData = { objectId: mod.id };
          selectableMeshesRef.current.push(brassMesh);
          topPlateGroup.add(brassMesh);
        }
      } else if (mod.type === 'pasta_cooker' || mod.type === 'bain_marie') {
        const basinGeo = new THREE.BoxGeometry(modWidth - 100, 30, depth - 200);
        const waterColor = isMaskMode ? 0x06b6d4 : mod.type === 'pasta_cooker' ? 0x38bdf8 : 0xf59e0b;
        const waterMat = new THREE.MeshStandardMaterial({
          color: waterColor,
          roughness: 0.1,
          metalness: 0.1,
          transparent: true,
          opacity: 0.75,
          clippingPlanes: clipPlane ? [clipPlane] : [],
        });
        const basinMesh = new THREE.Mesh(basinGeo, isModIsolated ? ghostMat : waterMat);
        basinMesh.position.set(modCenterX, height + 5, 0);
        basinMesh.userData = { objectId: mod.id };
        selectableMeshesRef.current.push(basinMesh);
        topPlateGroup.add(basinMesh);
      }

      if ((activeObjId && mod.id === activeObjId) || (isMaskMode && activeClassFilter === 'ALL')) {
        const isSelected = activeObjId === mod.id;
        const highlightGeo = new THREE.BoxGeometry(modWidth - 8, 12, depth - 16);
        const highlightMat = new THREE.MeshBasicMaterial({
          color: isSelected ? 0xf59e0b : 0x06b6d4,
          wireframe: true,
        });
        const highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
        highlightMesh.position.set(modCenterX, height + 10, 0);
        topPlateGroup.add(highlightMesh);
      }

      if (isMaskMode) {
        const boxCorners = createCornerBox([modWidth - 10, height - plinthHeight + 40, depth - 20], '#f59e0b');
        boxCorners.position.set(modCenterX, (plinthHeight + height) / 2, 0);
        masterGroup.add(boxCorners);
      }

      // Rhino Gumball Widget centered on Selected Module
      if (showGumball && activeObjId && mod.id === activeObjId) {
        const gumballWidget = createRhinoGumball([modCenterX, height + 120, 0], mod.name);
        masterGroup.add(gumballWidget);
      }
    });

    masterGroup.add(topPlateGroup);

    // 3. MEP Conduits with Interactive Offset
    const mepGroup = new THREE.Group();
    mepGroupRef.current = mepGroup;

    const isMepIsolated = isolatedId && isolatedId !== 'obj-mep-distribution-manifold';

    const waterZ = -depth * 0.35 + offsetZ;
    const waterY = plinthHeight + 80;

    const gasZ = -depth * 0.30 + offsetZ;
    const gasY = plinthHeight + 140;

    const elecZ = -depth * 0.25 + offsetZ;
    const elecY = plinthHeight + 40 + offsetElecY;

    const waterMat = new THREE.MeshStandardMaterial({
      color: isTechnical ? 0x38bdf8 : 0x2563eb,
      roughness: 0.3,
      metalness: 0.6,
      wireframe: isWireframe,
      clippingPlanes: clipPlane ? [clipPlane] : [],
    });
    const waterPipeGeo = new THREE.CylinderGeometry(15, 15, totalLength - 200, 16);
    const waterPipeMesh = new THREE.Mesh(waterPipeGeo, isMepIsolated ? ghostMat : waterMat);
    waterPipeMesh.rotation.z = Math.PI / 2;
    waterPipeMesh.position.set(0, waterY, waterZ);
    waterPipeMesh.userData = { objectId: 'obj-mep-distribution-manifold' };
    selectableMeshesRef.current.push(waterPipeMesh);
    mepGroup.add(waterPipeMesh);

    if (model.derivedCalculations.totalGasKw > 0) {
      const gasMat = new THREE.MeshStandardMaterial({
        color: isTechnical ? 0xfacc15 : 0xeab308,
        roughness: 0.3,
        metalness: 0.6,
        wireframe: isWireframe,
        clippingPlanes: clipPlane ? [clipPlane] : [],
      });
      const gasPipeGeo = new THREE.CylinderGeometry(18, 18, totalLength - 300, 16);
      const gasPipeMesh = new THREE.Mesh(gasPipeGeo, isMepIsolated ? ghostMat : gasMat);
      gasPipeMesh.rotation.z = Math.PI / 2;
      gasPipeMesh.position.set(0, gasY, gasZ);
      gasPipeMesh.userData = { objectId: 'obj-mep-distribution-manifold' };
      selectableMeshesRef.current.push(gasPipeMesh);
      mepGroup.add(gasPipeMesh);
    }

    const elecMat = new THREE.MeshStandardMaterial({
      color: isTechnical ? 0xf97316 : 0xea580c,
      roughness: 0.4,
      metalness: 0.5,
      wireframe: isWireframe,
      clippingPlanes: clipPlane ? [clipPlane] : [],
    });
    const elecPipeGeo = new THREE.CylinderGeometry(14, 14, totalLength - 100, 16);
    const elecPipeMesh = new THREE.Mesh(elecPipeGeo, isMepIsolated ? ghostMat : elecMat);
    elecPipeMesh.rotation.z = Math.PI / 2;
    elecPipeMesh.position.set(0, elecY, elecZ);
    elecPipeMesh.userData = { objectId: 'obj-mep-distribution-manifold' };
    selectableMeshesRef.current.push(elecPipeMesh);
    mepGroup.add(elecPipeMesh);

    masterGroup.add(mepGroup);

    // 4. Overhead Exhaust Hood Canopy
    const hoodGroup = new THREE.Group();
    hoodGroupRef.current = hoodGroup;

    const hoodOverhang = model.parameters.exhaustHoodOverhangMm;
    const hoodLength = totalLength + hoodOverhang * 2;
    const hoodDepth = depth + hoodOverhang * 2;
    const hoodElevation = 2100;
    const hoodHeight = 500;

    const isHoodIsolated = isolatedId && isolatedId !== 'obj-halton-capture-jet-hood';

    const hoodMat = new THREE.MeshStandardMaterial({
      color: isArctic ? 0xffffff : isTechnical ? 0x334155 : isMaskMode ? 0x10b981 : 0xc4c9d1,
      metalness: isArctic ? 0.1 : 0.85,
      roughness: 0.25,
      transparent: isGhosted || isMaskMode,
      opacity: isGhosted ? 0.35 : isMaskMode ? 0.6 : 0.85,
      wireframe: isWireframe,
      clippingPlanes: clipPlane ? [clipPlane] : [],
    });

    const hoodGeo = new THREE.BoxGeometry(hoodLength, hoodHeight, hoodDepth);
    const hoodMesh = new THREE.Mesh(hoodGeo, isHoodIsolated ? ghostMat : hoodMat);
    hoodMesh.position.set(0, hoodElevation + hoodHeight / 2, 0);
    hoodMesh.castShadow = true;
    hoodMesh.userData = { objectId: 'obj-halton-capture-jet-hood' };
    selectableMeshesRef.current.push(hoodMesh);
    hoodGroup.add(hoodMesh);

    if (model.haltonVentilation?.enabled) {
      const jetStripGeo = new THREE.BoxGeometry(hoodLength - 40, 20, 30);
      const jetStripMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.9, roughness: 0.1 });
      const jetStripMesh = new THREE.Mesh(jetStripGeo, jetStripMat);
      jetStripMesh.position.set(0, hoodElevation + 10, hoodDepth / 2 - 15);
      hoodGroup.add(jetStripMesh);

      const filterCount = Math.max(2, Math.floor(hoodLength / 500));
      const ksaMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
      for (let f = 0; f < filterCount; f++) {
        const filterX = -hoodLength / 2 + 250 + f * ((hoodLength - 500) / (filterCount - 1 || 1));
        const filterGeo = new THREE.BoxGeometry(350, 280, 40);
        const filterMesh = new THREE.Mesh(filterGeo, ksaMat);
        filterMesh.rotation.x = -Math.PI / 6;
        filterMesh.position.set(filterX, hoodElevation + 180, 0);
        hoodGroup.add(filterMesh);
      }
    }

    masterGroup.add(hoodGroup);

    // 5. Real-Time High-Contrast Collision Overlay Mesh
    if (isCollisionActive && activeCollisions.length > 0) {
      const clashOverlayGroup = new THREE.Group();

      activeCollisions.forEach((clash) => {
        const { size, center } = clash.intersectionBox;
        const [sx, sy, sz] = size;
        const [cx, cy, cz] = center;

        const isSelectedClash = activeClashId === clash.id;

        const clashGeo = new THREE.BoxGeometry(sx, sy, sz);
        const clashMat = new THREE.MeshStandardMaterial({
          color: clash.severity === 'CRITICAL' ? 0xff0044 : 0xf59e0b,
          emissive: clash.severity === 'CRITICAL' ? 0xff0044 : 0xd97706,
          emissiveIntensity: isSelectedClash ? 1.0 : 0.75,
          transparent: true,
          opacity: isSelectedClash ? 0.8 : 0.65,
          roughness: 0.1,
          metalness: 0.2,
        });
        const clashMesh = new THREE.Mesh(clashGeo, clashMat);
        clashMesh.position.set(cx, cy, cz);
        clashMesh.userData = { collisionId: clash.id, collisionData: clash };

        selectableMeshesRef.current.push(clashMesh);
        collisionMeshesRef.current.push(clashMesh);
        clashOverlayGroup.add(clashMesh);

        const wireGeo = new THREE.BoxGeometry(sx + 4, sy + 4, sz + 4);
        const wireMat = new THREE.MeshBasicMaterial({ color: 0xffea00, wireframe: true });
        const wireMesh = new THREE.Mesh(wireGeo, wireMat);
        wireMesh.position.set(cx, cy, cz);
        clashOverlayGroup.add(wireMesh);

        const cornerBrackets = createCornerBox([sx + 8, sy + 8, sz + 8], '#ff0044');
        cornerBrackets.position.set(cx, cy, cz);
        clashOverlayGroup.add(cornerBrackets);

        const ringGeo = new THREE.RingGeometry(Math.max(25, (sx + sz) * 0.15), Math.max(35, (sx + sz) * 0.2), 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xff0044,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.set(cx, cy + sy / 2 + 10, cz);
        clashOverlayGroup.add(ringMesh);
      });

      masterGroup.add(clashOverlayGroup);
    }

    scene.add(masterGroup);
  }

  // Drag & Drop handlers
  const handle3DDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIs3DDragOver(true);
  };

  const handle3DDragLeave = () => {
    setIs3DDragOver(false);
  };

  const handle3DDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIs3DDragOver(false);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw || !setModel) return;

    try {
      const item: CatalogItem = JSON.parse(raw);
      const newModule = createModuleFromCatalog(item, model.monolithe.modules.length);
      const updatedModules = [...model.monolithe.modules, newModule];
      const totalLength = updatedModules.reduce((acc, m) => acc + m.widthMm, 0);

      setModel(prev => ({
        ...prev,
        monolithe: {
          ...prev.monolithe,
          lengthMm: totalLength,
          modules: updatedModules,
        },
        derivedCalculations: {
          ...prev.derivedCalculations,
          totalElectricKw: updatedModules.reduce((acc, m) => acc + m.electricKw, 0),
          totalGasKw: updatedModules.reduce((acc, m) => acc + m.gasKw, 0),
          totalExhaustFlowM3h: updatedModules.reduce((acc, m) => acc + m.exhaustFlowM3h, 0),
          freshAirCompensationM3h: updatedModules.reduce((acc, m) => acc + m.exhaustFlowM3h, 0) * 0.8,
          linearMetersOfContinuousTop: totalLength / 1000,
        },
      }));
      setSelectedModuleId(newModule.id);
      setSelectedObjectId(newModule.id);
    } catch (err) {
      console.error('Error adding dropped module to 3D scene:', err);
    }
  };

  return (
    <div className="relative w-full h-full bg-neutral-950 overflow-hidden select-none">
      {/* 1. Full Screen 3D WebGL Canvas Area (100% Bleed - Centro Livre) */}
      <div
        onDragOver={handle3DDragOver}
        onDragLeave={handle3DDragLeave}
        onDrop={handle3DDrop}
        className={`absolute inset-0 w-full h-full transition-colors ${
          is3DDragOver ? 'ring-4 ring-inset ring-amber-400' : ''
        }`}
      >
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* 3D Dropzone Overlay */}
        {is3DDragOver && (
          <div className="absolute inset-0 z-30 pointer-events-none bg-amber-500/10 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-neutral-900/95 border-2 border-amber-400 p-5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold text-white animate-pulse">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span>Solte o módulo aqui para adicionar ao bloco 3D Monolithe</span>
            </div>
          </div>
        )}

        {/* AI-Vision Screen Projected Bounding Tags */}
        {isMaskDetectMode && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {projectedObjects
              .filter(p => p.visible)
              .map(p => {
                const isSelected = selectedObjectId === p.id;
                const isHovered = hoveredObjectId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-75 pointer-events-auto cursor-pointer ${
                      isSelected || isHovered ? 'scale-110 z-30' : 'scale-100 opacity-80'
                    }`}
                    style={{ left: `${p.x}px`, top: `${p.y}px` }}
                    onClick={() => {
                      setSelectedObjectId(p.id);
                      setSelectedModuleId(p.id);
                    }}
                  >
                    <div
                      className="px-2 py-0.5 rounded shadow-lg backdrop-blur-md border text-[10px] font-mono flex items-center gap-1.5 whitespace-nowrap"
                      style={{
                        backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.9)' : 'rgba(15, 23, 42, 0.85)',
                        borderColor: isSelected ? '#f59e0b' : p.maskColor,
                        color: isSelected ? '#09090b' : '#f8fafc',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.maskColor }} />
                      <span className="font-bold">{p.name}</span>
                      <span className="opacity-70">[{p.ifcClass}]</span>
                      <span className="text-emerald-400 font-bold">{(p.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* 3D Collision Overlap Badges */}
        {isCollisionOverlayActive && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {projectedCollisions
              .filter(c => c.visible)
              .map(c => {
                const isSelected = activeCollisionId === c.id;
                const isHovered = hoveredCollisionId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-75 pointer-events-auto cursor-pointer ${
                      isSelected || isHovered ? 'scale-110 z-30' : 'scale-100'
                    }`}
                    style={{ left: `${c.x}px`, top: `${c.y}px` }}
                    onClick={() => setActiveCollisionId(c.id)}
                  >
                    <div className="px-2.5 py-1 rounded-lg shadow-2xl backdrop-blur-md bg-red-950/95 border-2 border-red-500 text-white text-[10px] font-mono font-bold flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="truncate max-w-[180px]">{c.title}</span>
                      <span className="bg-red-600 px-1 rounded text-[9px]">{c.penetrationDepth}mm</span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Hover Crosshair Indicator */}
        {hoveredObjectId && !isDraggingRef.current && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-neutral-900/90 border border-neutral-700/80 px-3 py-1 rounded-full text-xs font-mono text-neutral-300 flex items-center gap-2 shadow-xl backdrop-blur-md">
              <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Objeto Detectado:</span>
              <span className="font-bold text-white">
                {allSceneObjects.find(o => o.id === hoveredObjectId)?.name || hoveredObjectId}
              </span>
            </div>
          </div>
        )}

        {/* Hover Collision Indicator */}
        {hoveredCollisionId && !isDraggingRef.current && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-red-950/95 border-2 border-red-500 px-4 py-1.5 rounded-full text-xs font-mono text-white flex items-center gap-2 shadow-2xl backdrop-blur-md animate-pulse">
              <ShieldAlert className="w-4 h-4 text-yellow-400" />
              <span>Conflito Físico Detectado:</span>
              <span className="font-bold text-red-200">
                {collisions.find(c => c.id === hoveredCollisionId)?.title}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. TOP SUSPENDED RHINOCEROS COMMAND BAR */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <RhinoCommandLine
          availableCommands={rhinoCommands}
          onExecuteCommand={handleExecuteRhinoCommand}
          lastFeedback={rhinoCommandFeedback}
        />
      </div>

      {/* 3. LEFT EXTREME EDGE TRIGGER & SUSPENDED DRAWER (Ferramentas, Vistas & Rhino CAD) */}
      {!isLeftDrawerOpen && !isLeftPinned && (
        <button
          onClick={() => setIsLeftDrawerOpen(true)}
          onMouseEnter={() => setIsLeftDrawerOpen(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-neutral-900/95 hover:bg-neutral-800 border-r border-y border-neutral-700/80 pl-2 pr-3 py-3 rounded-r-xl text-neutral-300 hover:text-amber-300 flex items-center gap-1.5 shadow-2xl backdrop-blur-md transition-all cursor-pointer group"
          title="Tocar ou arrastar para abrir Ferramentas Rhino & Vistas"
        >
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-amber-400" />
          <span className="text-[11px] font-mono font-semibold vertical-text [writing-mode:vertical-lr] rotate-180">
            Rhino CAD
          </span>
        </button>
      )}

      {/* Left Suspended Floating HUD Drawer */}
      <div
        onMouseEnter={() => {
          if (leftTimeoutRef.current) clearTimeout(leftTimeoutRef.current);
          setIsLeftDrawerOpen(true);
        }}
        onMouseLeave={() => {
          if (!isLeftPinned) {
            leftTimeoutRef.current = setTimeout(() => setIsLeftDrawerOpen(false), 800);
          }
        }}
        className={`absolute top-16 left-4 z-30 w-80 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-2xl p-4 text-xs transition-all duration-300 ease-out pointer-events-auto max-h-[85vh] overflow-y-auto ${
          isLeftDrawerOpen || isLeftPinned ? 'translate-x-0 opacity-100' : '-translate-x-88 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-white tracking-tight">Capacidades Rhinoceros 3D</h4>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsLeftPinned(!isLeftPinned)}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isLeftPinned ? 'text-amber-400 bg-amber-950/60' : 'text-neutral-400 hover:text-white'
              }`}
              title={isLeftPinned ? 'Painel fixado' : 'Fixar painel lateral'}
            >
              {isLeftPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsLeftDrawerOpen(false)}
              className="p-1 text-neutral-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Rhino Shading & Display Modes */}
        <div className="mb-3.5 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
            Modos de Visualização Rhino:
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
            {(['rendered', 'shaded', 'ghosted', 'wireframe', 'technical', 'arctic'] as RhinoDisplayMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setRhinoDisplayMode(mode)}
                className={`py-1 px-1.5 rounded-md text-center transition-colors cursor-pointer capitalize ${
                  rhinoDisplayMode === mode
                    ? 'bg-amber-400 text-neutral-950 font-bold'
                    : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Rhino Surface Analysis & Geometric Diagnostics */}
        <div className="mb-3.5 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
            Análises Geométricas Rhino:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setRhinoAnalysis(prev => (prev === 'zebra' ? 'none' : 'zebra'))}
              className={`p-2 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between ${
                rhinoAnalysis === 'zebra'
                  ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div>
                <span className="font-bold text-xs block">_Zebra</span>
                <span className="text-[9px] font-mono">Continuidade G0/G1/G2</span>
              </div>
              <span className="text-[10px] font-mono">{rhinoAnalysis === 'zebra' ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setRhinoAnalysis(prev => (prev === 'curvature' ? 'none' : 'curvature'))}
              className={`p-2 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between ${
                rhinoAnalysis === 'curvature'
                  ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div>
                <span className="font-bold text-xs block">_Curvature</span>
                <span className="text-[9px] font-mono">Falsa Cor / Gaussiana</span>
              </div>
              <span className="text-[10px] font-mono">{rhinoAnalysis === 'curvature' ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Interactive Rhino Clipping Plane */}
          <div className="pt-2 border-t border-neutral-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-300 font-bold flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                _ClippingPlane (Corte Seção):
              </span>
              <button
                onClick={() => setIsClippingPlaneActive(!isClippingPlaneActive)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  isClippingPlaneActive
                    ? 'bg-cyan-400 text-neutral-950'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {isClippingPlaneActive ? 'LIGADO' : 'DESL.'}
              </button>
            </div>

            {isClippingPlaneActive && (
              <div className="space-y-1.5 p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 text-[10px] font-mono">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Eixo de Corte:</span>
                  <div className="flex gap-1">
                    {(['x', 'y', 'z'] as Array<'x' | 'y' | 'z'>).map(axis => (
                      <button
                        key={axis}
                        onClick={() => setClippingAxis(axis)}
                        className={`px-2 py-0.5 rounded uppercase font-bold cursor-pointer ${
                          clippingAxis === axis ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {axis}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-neutral-400">
                    <span>Posição do Plano:</span>
                    <span className="text-white font-bold">{clippingOffsetMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={clippingOffsetMm}
                    onChange={(e) => setClippingOffsetMm(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rhino Gumball & Interoperability Hub */}
        <div className="mb-3.5 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-300 font-bold flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-amber-400" />
              Rhino Gumball 3D:
            </span>
            <button
              onClick={() => setIsGumballActive(!isGumballActive)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                isGumballActive
                  ? 'bg-amber-400 text-neutral-950'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {isGumballActive ? 'LIGADO' : 'DESL.'}
            </button>
          </div>

          <button
            onClick={() => setIsRhinoInteropOpen(true)}
            className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500/20 to-amber-400/30 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
          >
            <Code2 className="w-4 h-4 text-amber-400" />
            <span>Rhino .3DM & Grasshopper Hub</span>
          </button>
        </div>

        {/* Real-Time Collision Status */}
        <div className="mb-3 p-2.5 rounded-xl bg-red-950/40 border border-red-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="font-bold text-red-100 text-[11px]">Colisão Física 3D (MEP)</span>
            </div>
            <button
              onClick={() => setIsCollisionOverlayActive(!isCollisionOverlayActive)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                isCollisionOverlayActive
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              {isCollisionOverlayActive ? 'ATIVADO' : 'DESATIVADO'}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-red-300">
            <span>Conflitos Físicos:</span>
            <span className="font-bold bg-red-900/60 px-1.5 py-0.5 rounded border border-red-700/60">
              {collisions.length} {collisions.length === 1 ? 'conflito' : 'conflitos'}
            </span>
          </div>
        </div>

        {/* Camera Presets */}
        <div className="space-y-1.5 mb-3">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">Vistas do Modelo:</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => applyPreset('iso')}
              className={`py-1.5 px-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                cameraPreset === 'iso' ? 'bg-amber-400 text-neutral-950 font-semibold' : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              Isométrica
            </button>
            <button
              onClick={() => applyPreset('top')}
              className={`py-1.5 px-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                cameraPreset === 'top' ? 'bg-amber-400 text-neutral-950 font-semibold' : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              Planta (Topo)
            </button>
            <button
              onClick={() => applyPreset('chef')}
              className={`py-1.5 px-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                cameraPreset === 'chef' ? 'bg-amber-400 text-neutral-950 font-semibold' : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              Visão do Chef
            </button>
            <button
              onClick={() => applyPreset('front')}
              className={`py-1.5 px-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                cameraPreset === 'front' ? 'bg-amber-400 text-neutral-950 font-semibold' : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              Elevação Frontal
            </button>
          </div>
        </div>
      </div>

      {/* 4. RIGHT EXTREME EDGE TRIGGER & SUSPENDED DRAWER (Catálogo & Paramétrico) */}
      {!isRightDrawerOpen && !isRightPinned && setModel && (
        <button
          onClick={() => setIsRightDrawerOpen(true)}
          onMouseEnter={() => setIsRightDrawerOpen(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-neutral-900/95 hover:bg-neutral-800 border-l border-y border-neutral-700/80 pr-2 pl-3 py-3 rounded-l-xl text-neutral-300 hover:text-amber-300 flex items-center gap-1.5 shadow-2xl backdrop-blur-md transition-all cursor-pointer group"
          title="Tocar ou arrastar para abrir Catálogo & Módulos"
        >
          <span className="text-[11px] font-mono font-semibold vertical-text [writing-mode:vertical-lr]">
            Catálogo Monolithe
          </span>
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-amber-400" />
        </button>
      )}

      {/* Right Suspended Floating Drawer (CatalogPanel) */}
      {setModel && (
        <div
          onMouseEnter={() => {
            if (rightTimeoutRef.current) clearTimeout(rightTimeoutRef.current);
            setIsRightDrawerOpen(true);
          }}
          onMouseLeave={() => {
            if (!isRightPinned) {
              rightTimeoutRef.current = setTimeout(() => setIsRightDrawerOpen(false), 800);
            }
          }}
          className={`absolute top-0 right-0 bottom-0 z-30 shadow-2xl transition-transform duration-300 ease-out pointer-events-auto flex ${
            isRightDrawerOpen || isRightPinned ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          }`}
        >
          <div className="absolute top-3 left-3 z-40">
            <button
              onClick={() => setIsRightPinned(!isRightPinned)}
              className={`p-1.5 rounded-lg border backdrop-blur-md transition-colors cursor-pointer ${
                isRightPinned ? 'bg-amber-400 text-neutral-950 border-amber-300' : 'bg-neutral-900/80 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
              title={isRightPinned ? 'Desafixar catálogo' : 'Fixar catálogo na lateral'}
            >
              {isRightPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          <CatalogPanel
            model={model}
            setModel={setModel}
            selectedModuleId={selectedObjectId || selectedModuleId}
            setSelectedModuleId={(id) => {
              setSelectedModuleId(id);
              setSelectedObjectId(id);
            }}
            className="h-full border-l border-neutral-800 shadow-2xl"
          />
        </div>
      )}

      {/* 5. BOTTOM EXTREME EDGE TRIGGER & SUSPENDED DOCK */}
      {!isBottomDockOpen && !isBottomPinned && (
        <div
          onClick={() => setIsBottomDockOpen(true)}
          onMouseEnter={() => setIsBottomDockOpen(true)}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 cursor-pointer group pointer-events-auto"
        >
          <div className="bg-neutral-900/95 hover:bg-neutral-850 border-t border-x border-neutral-700/80 px-5 py-1.5 rounded-t-xl text-[11px] font-mono text-neutral-300 hover:text-amber-300 flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all duration-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wide">Rhino CAD & Especificações</span>
            <ChevronUp className="w-3.5 h-3.5 text-neutral-400 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      )}

      {/* Bottom Suspended Floating Dock */}
      <div
        onMouseEnter={() => {
          if (bottomTimeoutRef.current) clearTimeout(bottomTimeoutRef.current);
          setIsBottomDockOpen(true);
        }}
        onMouseLeave={() => {
          if (!isBottomPinned) {
            bottomTimeoutRef.current = setTimeout(() => setIsBottomDockOpen(false), 800);
          }
        }}
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-4xl transition-all duration-300 ease-out pointer-events-auto ${
          isBottomDockOpen || isBottomPinned ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-bold">
                Tampo {model.monolithe.materialGrade.replace('_', ' ')} (3mm)
              </span>
            </div>

            <span className="text-neutral-600 hidden sm:inline">|</span>

            <span className="text-neutral-300 hidden sm:inline">
              Rhino Display: <strong className="text-amber-400 uppercase">{rhinoDisplayMode}</strong>
            </span>

            <span className="text-neutral-600 hidden md:inline">|</span>

            <span className="text-neutral-400 hidden md:inline">
              {model.monolithe.lengthMm} × {model.monolithe.depthMm} × {model.monolithe.heightMm} mm
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Demembrar ao Nível Mínimo */}
            <button
              onClick={() => setIsAtomicDecomposed(!isAtomicDecomposed)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                isAtomicDecomposed
                  ? 'bg-purple-600/90 text-white border-purple-400 shadow-md shadow-purple-500/20'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
              }`}
              title="Decompor módulos até o nível atômico mínimo (chassis, tampo, manípulos, queimadores)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAtomicDecomposed ? 'Atômico ON' : 'Demembrar'}</span>
            </button>

            {/* Estúdio Render Realístico 360° */}
            <button
              onClick={() => {
                if (activeInspectedObject) {
                  setRenderTargetObject(activeInspectedObject);
                } else if (allSceneObjects.length > 0) {
                  setRenderTargetObject(allSceneObjects[0]);
                }
                setIsRealisticStudioOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors cursor-pointer"
              title="Abrir Estúdio PBR com iluminação estúdio e controle fino de materiais"
            >
              <CameraIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Render PBR</span>
            </button>

            {/* Layout 4 Vistas Rhino */}
            <button
              onClick={() => setIsFourViewMode(!isFourViewMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                isFourViewMode
                  ? 'bg-amber-400 text-neutral-950 border-amber-300'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
              }`}
              title="Alternar entre Vista Única e Layout 4 Vistas Rhinoceros"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">4 Vistas</span>
            </button>

            {/* Grasshopper Visual Canvas */}
            <button
              onClick={() => setIsGrasshopperModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30 transition-colors cursor-pointer"
              title="Abrir canvas de nós algorítmicos Grasshopper"
            >
              <Code2 className="w-3.5 h-3.5 text-green-400" />
              <span>GH Live</span>
            </button>

            {/* Quick Rhino Interop Button */}
            <button
              onClick={() => setIsRhinoInteropOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              <span>3DM Export</span>
            </button>

            {/* Quick Collision Alert Indicator */}
            {collisions.length > 0 && (
              <button
                onClick={() => {
                  setIsCollisionOverlayActive(true);
                  setActiveCollisionId(collisions[0].id);
                  handleFocusClash(collisions[0]);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600/90 text-white hover:bg-red-500 transition-colors animate-pulse cursor-pointer shadow-lg shadow-red-500/20"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{collisions.length} Colisão(ões)</span>
              </button>
            )}

            {/* Pin Toggle */}
            <button
              onClick={() => setIsBottomPinned(!isBottomPinned)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isBottomPinned
                  ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
              title={isBottomPinned ? 'Desafixar barra inferior' : 'Fixar barra inferior'}
            >
              {isBottomPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsBottomDockOpen(false)}
              className="p-1 text-neutral-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. SUSPENDED OBJECT CLASSIFICATION INSPECTOR */}
      {activeInspectedObject && !activeInspectedCollision && (
        <div className="absolute top-20 right-6 z-40">
          <ObjectClassificationInspector
            detectedObject={activeInspectedObject}
            allObjects={allSceneObjects}
            onClose={() => setSelectedObjectId(null)}
            isIsolated={isolatedObjectId === activeInspectedObject.id}
            onIsolateObject={(objId) => {
              setIsolatedObjectId(prev => (prev === objId ? null : objId));
            }}
            onEditModule={(modId) => {
              setSelectedModuleId(modId);
              setIsRightDrawerOpen(true);
            }}
            onUpdateModule={handleUpdateModule}
            onOpenRealisticRender={(obj) => {
              setRenderTargetObject(obj);
              setIsRealisticStudioOpen(true);
            }}
            onToggleDecomposeAtomic={() => setIsAtomicDecomposed(prev => !prev)}
            isAtomicDecomposed={isAtomicDecomposed}
          />
        </div>
      )}

      {/* 7. SUSPENDED INTERACTIVE COLLISION INSPECTOR MODAL */}
      {activeInspectedCollision && (
        <div className="absolute top-20 right-6 z-40">
          <CollisionInspectorModal
            collision={activeInspectedCollision}
            allCollisions={collisions}
            onClose={() => setActiveCollisionId(null)}
            onFocusClash={handleFocusClash}
            onAutoFix={handleAutoFixClash}
            onSelectAnotherClash={(c) => {
              setActiveCollisionId(c.id);
              handleFocusClash(c);
            }}
            mepOffsetZ={mepOffsetZ}
            setMepOffsetZ={setMepOffsetZ}
            elecOffsetY={elecOffsetY}
            setElecOffsetY={setElecOffsetY}
            onResetOffsets={() => {
              setMepOffsetZ(0);
              setElecOffsetY(0);
            }}
          />
        </div>
      )}

      {/* 8. RHINOCEROS & GRASSHOPPER INTEROPERABILITY MODAL */}
      <RhinoInteropModal
        isOpen={isRhinoInteropOpen}
        onClose={() => setIsRhinoInteropOpen(false)}
        model={model}
      />

      {/* 9. REALISTIC 360° PBR STUDIO TURNTABLE RENDER MODAL */}
      <RealisticStudioRenderModal
        isOpen={isRealisticStudioOpen}
        onClose={() => setIsRealisticStudioOpen(false)}
        targetObject={renderTargetObject || activeInspectedObject || allSceneObjects[0] || null}
        targetModule={renderTargetObject?.sourceModule || activeInspectedObject?.sourceModule || null}
      />

      {/* 10. GRASSHOPPER LIVE NODE GRAPH & PARAMETRIC DEFINITION MODAL */}
      <GrasshopperNodeGraphModal
        isOpen={isGrasshopperModalOpen}
        onClose={() => setIsGrasshopperModalOpen(false)}
        model={model}
        onUpdateModelParameters={(newParams) => {
          if (setModel) {
            setModel(prev => ({
              ...prev,
              parameters: { ...prev.parameters, ...newParams }
            }));
          }
        }}
        onBakeGeometry={() => {
          setIsRhinoInteropOpen(true);
        }}
      />

      {/* 11. RHINOCEROS 4-VIEWPORT GRID OVERLAY (Top, Front, Right, Perspective) */}
      {isFourViewMode && (
        <div className="absolute inset-0 pointer-events-none z-20 grid grid-cols-2 grid-rows-2 border-2 border-neutral-700/60 divide-x-2 divide-y-2 divide-neutral-700/60">
          {/* Top View */}
          <div className="relative p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-neutral-900/90 text-amber-400 font-mono text-[11px] font-bold border border-neutral-700">
                Top (XY Ortho)
              </span>
              <span className="text-[10px] font-mono text-neutral-400">Plano Superior Z+</span>
            </div>
            <div className="text-[10px] font-mono text-neutral-500">Grade: 100mm | X: 0 Y: 0</div>
          </div>

          {/* Perspective View (Active) */}
          <div className="relative p-3 flex flex-col justify-between border-2 border-amber-400/40">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-neutral-950 font-mono text-[11px] font-bold shadow-md">
                Perspective (Active Viewport)
              </span>
              <button
                onClick={() => setIsFourViewMode(false)}
                className="pointer-events-auto px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-[10px] cursor-pointer"
              >
                Maximizar (1View)
              </button>
            </div>
            <div className="text-[10px] font-mono text-amber-300">PBR Studio | 60 FPS</div>
          </div>

          {/* Front View */}
          <div className="relative p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-neutral-900/90 text-amber-400 font-mono text-[11px] font-bold border border-neutral-700">
                Front (XZ Ortho)
              </span>
              <span className="text-[10px] font-mono text-neutral-400">Elevação Y+900mm</span>
            </div>
            <div className="text-[10px] font-mono text-neutral-500">Linha de Base: Cota 0.00</div>
          </div>

          {/* Right View */}
          <div className="relative p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-neutral-900/90 text-amber-400 font-mono text-[11px] font-bold border border-neutral-700">
                Right (YZ Ortho)
              </span>
              <span className="text-[10px] font-mono text-neutral-400">Profundidade 1000mm</span>
            </div>
            <div className="text-[10px] font-mono text-neutral-500">Plenum MEP Traseiro</div>
          </div>
        </div>
      )}
    </div>
  );
};
