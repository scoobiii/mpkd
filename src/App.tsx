import React, { useState, useEffect, useRef } from 'react';
import { DesignModel } from './types/designModel';
import { MONOLITHE_CATALOG, createModuleFromCatalog } from './catalog/monolitheCatalog';
import { generateNativeVucProof, auditKitchenDesignCorrectness } from './vuc/vucClient';
import { Header } from './components/Header';
import { StoryModal } from './components/StoryModal';
import { FloorplanEditor2D } from './components/FloorplanEditor2D';
import { Viewer3DGPU } from './components/Viewer3DGPU';
import { AIVisionMenuStudio } from './components/AIVisionMenuStudio';
import { VUCVerificationInspector } from './components/VUCVerificationInspector';
import { MEPSummaryPanel } from './components/MEPSummaryPanel';
import { DeliverablesExportModal } from './components/DeliverablesExportModal';
import { HaltonVentilationModal } from './components/HaltonVentilationModal';
import { VucDocumentationModal } from './components/VucDocumentationModal';
import { Flame, ShieldCheck, Layers, Cpu, Box, AlertTriangle, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'viewer3d' | 'editor2d' | 'ai_studio' | 'vuc_audit' | 'mep'>('viewer3d');
  const [isStoryOpen, setIsStoryOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isHaltonOpen, setIsHaltonOpen] = useState<boolean>(false);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);

  // Initial Benchmark Model Generator: Thai Mee High-Output Monolithe Suite
  const createBenchmarkModel = (): DesignModel => {
    const initialModules = [
      createModuleFromCatalog(MONOLITHE_CATALOG[0], 0, 800), // Wok Indução 8kW
      createModuleFromCatalog(MONOLITHE_CATALOG[1], 1, 800), // Frytop Cromo
      createModuleFromCatalog(MONOLITHE_CATALOG[2], 2, 600), // Fogão 2 Queimadores
      createModuleFromCatalog(MONOLITHE_CATALOG[3], 3, 600), // Cozedor Massas
      createModuleFromCatalog(MONOLITHE_CATALOG[4], 4, 800), // Banho-Maria
    ];

    const totalLength = initialModules.reduce((acc, m) => acc + m.widthMm, 0);

    return {
      schema_version: '1.0.0',
      id: 'mono-thaimee-suite-01',
      name: 'Suíte Monolithe Thai Mee High-Output',
      chefBackstory: {
        inspiredBy: 'Thai Mee · Culinária Tailandesa de Alto Padrão',
        signatureDish: 'Pad Talay Nam Prik Pao',
        originNote: 'Forjado no bunker culinário com woks de alta potência e bases refrigeradas GN',
        philosophy: 'Comida de altíssima qualidade produzida em espaços mínimos com solda contínua laser'
      },
      room: {
        widthMm: 6000,
        depthMm: 4500,
        heightMm: 3200,
        wallThicknessMm: 150,
        doors: [
          { id: 'd1', x: 200, y: 0, width: 900, wall: 'north' },
          { id: 'd2', x: 5000, y: 4500, width: 1000, wall: 'south' }
        ],
        windows: [],
        utilityRoughIns: [
          { id: 'u1', type: 'electric_400v', x: 1200, y: 1500, elevationMm: 300, capacity: '63A' },
          { id: 'u2', type: 'gas_nat', x: 2600, y: 1500, elevationMm: 300, capacity: '20kW' },
          { id: 'u3', type: 'water_cold', x: 1800, y: 1500, elevationMm: 500, capacity: '3.0 bar' },
          { id: 'u4', type: 'drain_floor', x: 3000, y: 2200, elevationMm: 0, capacity: 'DN50' }
        ]
      },
      parameters: {
        aisleWidthMinMm: 1100,
        targetCoversPerNight: 280,
        operatingHoursPerDay: 8,
        exhaustHoodOverhangMm: 250,
        ventilationCompensationRatio: 0.8
      },
      monolithe: {
        id: 'suite-tm-01',
        name: 'Angelo Po Monolithe Top Block',
        lengthMm: totalLength,
        depthMm: 1000,
        heightMm: 900,
        topThicknessMm: 3,
        materialGrade: 'AISI_304',
        xMm: 1200,
        yMm: 1600,
        rotationDeg: 0,
        modules: initialModules
      },
      haltonVentilation: {
        enabled: true,
        hoodModel: 'KVI_CAPTURE_JET',
        hasMarvelDcv: true,
        hasCaptureRayUv: false,
        hasWaterWash: false,
        hasPolluStop: true,
        captureJetReductionPct: 35,
        marvelEnergySavingsPct: 50,
        referenceProject: {
          name: 'Gianni Cocina (Brasil)',
          url: 'https://www.halton.com/references/gianni-brazil/',
          location: 'Brasil',
          description: 'Cozinha de alta gastronomia no Brasil com coifas Halton Capture Jet KVE e sistema M.A.R.V.E.L.',
          technologiesUsed: ['Capture Jet™', 'Filtros KSA', 'M.A.R.V.E.L. DCV', 'PolluStop']
        }
      },
      peripherals: [],
      derivedCalculations: {
        totalElectricKw: Number(initialModules.reduce((acc, m) => acc + m.electricKw, 0).toFixed(1)),
        totalGasKw: Number(initialModules.reduce((acc, m) => acc + m.gasKw, 0).toFixed(1)),
        totalExhaustFlowM3h: initialModules.reduce((acc, m) => acc + m.exhaustFlowM3h, 0),
        freshAirCompensationM3h: Math.round(initialModules.reduce((acc, m) => acc + m.exhaustFlowM3h, 0) * 0.8),
        linearMetersOfContinuousTop: Number((totalLength / 1000).toFixed(2)),
        sanitaryJointCount: 0,
        estimatedPlateCapacityPerHour: 180
      },
      clashes: [],
      provenance: {
        author: 'MPK Mellieri Engineering Kernel (scoobiii/vuc)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generatorMode: 'MANUAL_PARAMETRIC'
      }
    };
  };

  // State with LocalStorage Persistence
  const [model, setModel] = useState<DesignModel>(() => {
    try {
      const saved = localStorage.getItem('mpk_vuc_design_model_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.monolithe?.modules?.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar modelo persistido:', e);
    }
    return createBenchmarkModel();
  });

  // Auto-persist model on changes
  useEffect(() => {
    try {
      localStorage.setItem('mpk_vuc_design_model_v3', JSON.stringify(model));
    } catch (err) {
      console.warn('Falha na persistência do modelo:', err);
    }
  }, [model]);

  // Generate initial native VUC trace proof at load
  useEffect(() => {
    async function initTrace() {
      const promptText = `PROJETO MONOLITHE THAI MEE SUITE ${model.monolithe.lengthMm}MM PAD TALAY WOK 8KW HALTON CAPTURE JET`;
      const tokenNames = ['MONOLITHE', 'AISI_304', 'WOK', 'INDUCTION', 'PAD_TALAY', 'NAM_PRIK_PAO', 'SEAMLESS', 'HYGIENIC', 'EXHAUST'];
      const proof = await generateNativeVucProof(promptText, tokenNames);
      setModel(prev => ({
        ...prev,
        vucTrace: proof
      }));
    }
    initTrace();
  }, []);

  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(false);
  const [isHeaderPinned, setIsHeaderPinned] = useState<boolean>(false);
  const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle global mousemove to detect top extreme edge trigger (<= 28px)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isHeaderPinned) return;
      if (e.clientY <= 28) {
        if (headerTimeoutRef.current) clearTimeout(headerTimeoutRef.current);
        setIsHeaderVisible(true);
      } else if (e.clientY > 80 && isHeaderVisible) {
        if (headerTimeoutRef.current) clearTimeout(headerTimeoutRef.current);
        headerTimeoutRef.current = setTimeout(() => {
          setIsHeaderVisible(false);
        }, 1200);
      }
    };

    // Touch edge gesture support
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      if (touchStartY <= 40) {
        setIsHeaderVisible(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      if (headerTimeoutRef.current) clearTimeout(headerTimeoutRef.current);
    };
  }, [isHeaderPinned, isHeaderVisible]);

  const physicalClashes = auditKitchenDesignCorrectness(model);

  return (
    <div className="relative h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      {/* 100% Suspended Floating Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenStory={() => setIsStoryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenHalton={() => setIsHaltonOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
        isVucValid={model.vucTrace?.status === 'VERIFIED_VALID'}
        isVisible={isHeaderVisible || isHeaderPinned}
        isPinned={isHeaderPinned}
        onTogglePin={() => setIsHeaderPinned(!isHeaderPinned)}
        onMouseEnter={() => {
          if (headerTimeoutRef.current) clearTimeout(headerTimeoutRef.current);
          setIsHeaderVisible(true);
        }}
        onMouseLeave={() => {
          if (!isHeaderPinned) {
            headerTimeoutRef.current = setTimeout(() => {
              setIsHeaderVisible(false);
            }, 1000);
          }
        }}
        onReveal={() => setIsHeaderVisible(true)}
      />

      {/* Main Viewport Content Area - Full Bleed 100% Screen */}
      <main className="absolute inset-0 w-full h-full overflow-hidden">
        {activeTab === 'viewer3d' && <Viewer3DGPU model={model} setModel={setModel} />}
        {activeTab === 'editor2d' && <FloorplanEditor2D model={model} setModel={setModel} />}
        {activeTab === 'ai_studio' && <AIVisionMenuStudio model={model} setModel={setModel} />}
        {activeTab === 'vuc_audit' && <VUCVerificationInspector model={model} />}
        {activeTab === 'mep' && <MEPSummaryPanel model={model} setModel={setModel} />}
      </main>

      {/* Story & Philosophy Modal */}
      <StoryModal isOpen={isStoryOpen} onClose={() => setIsStoryOpen(false)} />

      {/* Halton Standard & References Modal */}
      <HaltonVentilationModal
        isOpen={isHaltonOpen}
        onClose={() => setIsHaltonOpen(false)}
        model={model}
        setModel={setModel}
      />

      {/* Engineering Deliverables Export Modal */}
      <DeliverablesExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        model={model}
      />

      {/* VUC Constitution, Agents & Sprints Documentation Modal */}
      <VucDocumentationModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
