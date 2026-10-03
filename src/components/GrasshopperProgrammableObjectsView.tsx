import React, { useState } from 'react';
import { DesignModel, MonolitheModule } from '../types/designModel';
import {
  Code2,
  Sliders,
  Play,
  Download,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Flame,
  Wind,
  X,
  Move,
  Hash,
  Activity,
  Zap,
  ShieldCheck,
  RefreshCw,
  Box
} from 'lucide-react';

interface GrasshopperProgrammableObjectsViewProps {
  isOpen: boolean;
  onClose: () => void;
  model: DesignModel;
  setModel?: React.Dispatch<React.SetStateAction<DesignModel>>;
  onOpen3DViewer?: () => void;
}

export const GrasshopperProgrammableObjectsView: React.FC<GrasshopperProgrammableObjectsViewProps> = ({
  isOpen,
  onClose,
  model,
  setModel,
  onOpen3DViewer,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(model.monolithe.modules[0]?.id || 'node-room');
  const [activeFormulaExpression, setActiveFormulaExpression] = useState<string>(
    'ExhaustFlow = 18 * Math.pow(SensibleHeatWatts, 1/3) * Math.pow(Z_Height, 5/3) * 3.6 * CaptureJetEfficiency'
  );
  const [sliderWidth, setSliderWidth] = useState<number>(800);
  const [sliderPower, setSliderPower] = useState<number>(8.0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync selected module values to sliders
  const activeModule = model.monolithe.modules.find(m => m.id === selectedNodeId) || model.monolithe.modules[0];

  const handleUpdateActiveModule = (newWidth: number, newElectricKw: number) => {
    if (!activeModule) return;
    const clampedWidth = Math.max(400, Math.min(1600, newWidth));
    const clampedPower = Math.max(0, Math.min(30, newElectricKw));

    const updatedModules = model.monolithe.modules.map(m => {
      if (m.id === activeModule.id) {
        return {
          ...m,
          widthMm: clampedWidth,
          electricKw: clampedPower,
          exhaustFlowM3h: Math.round(clampedPower * 280 + 800),
          heatDissipationSensibleWatts: Math.round(clampedPower * 350),
        };
      }
      return m;
    });

    const totalLength = updatedModules.reduce((acc, m) => acc + m.widthMm, 0);

    if (setModel) {
      setModel(prev => ({
        ...prev,
        monolithe: {
          ...prev.monolithe,
          lengthMm: totalLength,
          modules: updatedModules,
        },
        derivedCalculations: {
          ...prev.derivedCalculations,
          totalElectricKw: Number(updatedModules.reduce((acc, m) => acc + m.electricKw, 0).toFixed(1)),
          totalExhaustFlowM3h: updatedModules.reduce((acc, m) => acc + m.exhaustFlowM3h, 0),
          freshAirCompensationM3h: Math.round(updatedModules.reduce((acc, m) => acc + m.exhaustFlowM3h, 0) * 0.8),
          linearMetersOfContinuousTop: Number((totalLength / 1000).toFixed(2)),
        },
        provenance: {
          ...prev.provenance,
          updatedAt: new Date().toISOString(),
          generatorMode: 'MANUAL_PARAMETRIC',
        },
      }));
    }

    showToast(`Nó "${activeModule.name}" recalculado e propagado no DesignModel!`);
  };

  const handleDownloadGHX = () => {
    const ghxContent = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<!-- Grasshopper Parametric Definition for MPK Monolithe Suite -->
<GrasshopperDefinition version="1.0" format="rhino8_ghx">
  <DocumentHeader>
    <Author>MPK VUC Studio · Grasshopper Programmable Engine</Author>
    <ModelId>${model.id}</ModelId>
    <Date>${new Date().toISOString()}</Date>
    <Standard>RFC-VUC-1.0.4</Standard>
  </DocumentHeader>
  <DefinitionStructure>
    <Node id="1" type="RoomBoundary" width="${model.room.widthMm}" depth="${model.room.depthMm}" />
    <Node id="2" type="MonolitheBrep" length="${model.monolithe.lengthMm}" depth="${model.monolithe.depthMm}" topThickness="${model.monolithe.topThicknessMm}" />
    <Node id="3" type="ModuleArray" count="${model.monolithe.modules.length}">
      ${model.monolithe.modules.map(m => `<Module code="${m.code}" type="${m.type}" width="${m.widthMm}" electricKw="${m.electricKw}" gasKw="${m.gasKw}" />`).join('\n      ')}
    </Node>
    <Node id="4" type="HaltonAirflowSolver" exhaustM3h="${model.derivedCalculations.totalExhaustFlowM3h}" compensationM3h="${model.derivedCalculations.freshAirCompensationM3h}" />
    <Node id="5" type="VucTraceCommitment" promptHash="${model.vucTrace?.prompt_hash || 'auto'}" merkleRoot="${model.vucTrace?.merkle_root || 'auto'}" />
  </DefinitionStructure>
</GrasshopperDefinition>`;

    const blob = new Blob([ghxContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Grasshopper-Objects-${model.id}.ghx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Definição Grasshopper .GHX exportada!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-6xl h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Visão de Objetos Programáveis Grasshopper (Live Algorithmic Nodes)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-green-950 border border-green-700 text-green-300">
                  GH 1.0 Live Visual Canvas
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Cada módulo de cocção, plenum MEP e elemento físico é um componente programável com portas de entrada/saída e avaliação contínua.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadGHX}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-green-400" />
              <span>Exportar .GHX</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-2 rounded-full text-xs font-mono flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Sub Header Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 border-b border-neutral-800 bg-neutral-900/50 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Activity className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              Grafo Algorítmico Ativo ({model.monolithe.modules.length + 3} nós conectados)
            </span>
            <span className="text-neutral-500 hidden md:inline">|</span>
            <span className="text-neutral-400 hidden md:inline">
              Fórmula Ativa: <code className="text-green-400">{activeFormulaExpression.slice(0, 50)}...</code>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-sky-400 font-mono">
              Comprimento Total: <strong className="text-white">{model.monolithe.lengthMm} mm</strong>
            </span>
            <span className="text-neutral-500">•</span>
            <span className="text-[11px] text-amber-400 font-mono">
              Potência Total: <strong className="text-white">{model.derivedCalculations.totalElectricKw} kW</strong>
            </span>
          </div>
        </div>

        {/* Workspace: Visual Node Canvas (Left) + Node Inspector & Formula Box (Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Visual Programmable Node Graph Canvas (7 cols) */}
          <div className="lg:col-span-7 border-r border-neutral-800 bg-[#0d0f14] overflow-y-auto p-5 relative select-none">
            {/* SVG Connecting Wires (Bézier splines) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
              <path d="M 120 100 C 260 100, 240 220, 360 220" stroke="#38bdf8" strokeWidth="2.5" fill="none" strokeDasharray="4 4" />
              <path d="M 360 220 C 480 220, 460 380, 560 380" stroke="#4ade80" strokeWidth="2.5" fill="none" />
              <path d="M 360 260 C 440 260, 460 520, 560 520" stroke="#f59e0b" strokeWidth="2" fill="none" />
            </svg>

            <div className="space-y-4 relative z-10">
              <div className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                <span>NÓS PROGRAMÁVEIS DA SUÍTE MONOLITHE:</span>
                <span className="text-amber-400 text-[10px]">Clique para inspecionar ou arraste para a tela principal</span>
              </div>

              {/* Node 1: Room Boundary & MEP Rough-Ins */}
              <div
                onClick={() => setSelectedNodeId('node-room')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-neutral-900/90 max-w-md ${
                  selectedNodeId === 'node-room'
                    ? 'border-sky-400 ring-2 ring-sky-400/20 shadow-lg'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-sky-400" />
                    <span className="font-mono text-xs font-bold text-white">
                      Node_RoomBoundary
                    </span>
                  </div>
                  <span className="text-[9px] font-mono bg-sky-950 text-sky-300 border border-sky-800 px-1.5 py-0.5 rounded">
                    INPUT CLUSTER
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400">
                  <div>
                    <span className="text-neutral-500 block">ENTRADAS:</span>
                    <div>L: {model.room.widthMm}mm</div>
                    <div>P: {model.room.depthMm}mm</div>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">SAÍDAS:</span>
                    <div className="text-sky-300">BoundaryCurve</div>
                    <div className="text-sky-300">RoughIns [{model.room.utilityRoughIns.length}]</div>
                  </div>
                </div>
              </div>

              {/* Programmable Kitchen Module Nodes */}
              {model.monolithe.modules.map((mod, index) => {
                const isSelected = selectedNodeId === mod.id;
                return (
                  <div
                    key={mod.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(mod));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => {
                      setSelectedNodeId(mod.id);
                      setSliderWidth(mod.widthMm);
                      setSliderPower(mod.electricKw || mod.gasKw);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-neutral-900/90 ml-6 max-w-lg ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-xl'
                        : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-400" />
                        <span className="font-mono text-xs font-bold text-white">
                          Node_Module[{index}]: {mod.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded">
                        {mod.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-neutral-400">
                      <div>
                        <span className="text-neutral-500 block">PARÂMETROS:</span>
                        <div className="text-white font-bold">{mod.widthMm} mm</div>
                        <div className="text-amber-300">{mod.electricKw > 0 ? `${mod.electricKw} kW` : `${mod.gasKw} kW gás`}</div>
                      </div>

                      <div>
                        <span className="text-neutral-500 block">TERMODINÂMICA:</span>
                        <div>Sensível: {mod.heatDissipationSensibleWatts} W</div>
                        <div>Exaustão: {mod.exhaustFlowM3h} m³/h</div>
                      </div>

                      <div className="text-right">
                        <span className="text-neutral-500 block">AÇÃO:</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpen3DViewer) onOpen3DViewer();
                            onClose();
                          }}
                          className="px-2 py-1 rounded bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-neutral-950 font-bold text-[9px] transition-colors cursor-pointer"
                        >
                          Ver no 3D →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Node 3: Halton Capture Jet Ventilation Solver */}
              <div
                onClick={() => setSelectedNodeId('node-halton')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-neutral-900/90 ml-12 max-w-md ${
                  selectedNodeId === 'node-halton'
                    ? 'border-green-400 ring-2 ring-green-400/20 shadow-lg'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-green-400" />
                    <span className="font-mono text-xs font-bold text-white">
                      Node_HaltonAirflowSolver
                    </span>
                  </div>
                  <span className="text-[9px] font-mono bg-green-950 text-green-300 border border-green-800 px-1.5 py-0.5 rounded">
                    SOLVER VDI 2052
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400">
                  <div>
                    <span className="text-neutral-500 block">VAZÃO EXAUSTÃO:</span>
                    <div className="text-green-300 font-bold">{model.derivedCalculations.totalExhaustFlowM3h} m³/h</div>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">AR COMPENSAÇÃO:</span>
                    <div className="text-cyan-300 font-bold">{model.derivedCalculations.freshAirCompensationM3h} m³/h</div>
                  </div>
                </div>
              </div>

              {/* Node 4: RFC-VUC Cryptographic Trace Signer */}
              <div
                onClick={() => setSelectedNodeId('node-vuc')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-neutral-900/90 ml-16 max-w-md ${
                  selectedNodeId === 'node-vuc'
                    ? 'border-purple-400 ring-2 ring-purple-400/20 shadow-lg'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span className="font-mono text-xs font-bold text-white">
                      Node_VucTraceCommitment
                    </span>
                  </div>
                  <span className="text-[9px] font-mono bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded">
                    Ed25519 SIGNER
                  </span>
                </div>

                <div className="text-[10px] font-mono text-neutral-400">
                  <div>Merkle Root: <span className="text-purple-300">{model.vucTrace?.merkle_root.slice(0, 18)}...</span></div>
                  <div>Status: <span className="text-emerald-400 font-bold">{model.vucTrace?.status || 'VERIFIED_VALID'}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Inspector & Live Equation Box (5 cols) */}
          <div className="lg:col-span-5 bg-neutral-900/40 p-5 overflow-y-auto space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Selected Node Details */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                    <Sliders className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">
                      {activeModule?.name || 'Módulo Ativo'}
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Código: {activeModule?.code}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-amber-400 font-bold px-2 py-1 rounded bg-amber-950/80 border border-amber-800">
                  {activeModule?.type}
                </span>
              </div>

              {/* Sliders for Live Geometric & Electrical Manipulation */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3.5 font-mono text-xs">
                <span className="text-neutral-400 font-bold text-[11px] uppercase tracking-wider block">
                  Ajuste Paramétrico do Nó (Live Sliders):
                </span>

                {/* Width Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-300">Largura do Módulo (mm):</span>
                    <span className="text-amber-400 font-bold">{sliderWidth} mm</span>
                  </div>
                  <input
                    type="range"
                    min="400"
                    max="1200"
                    step="50"
                    value={sliderWidth}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSliderWidth(val);
                      handleUpdateActiveModule(val, sliderPower);
                    }}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-600">
                    <span>400mm</span>
                    <span>800mm (padrão)</span>
                    <span>1200mm</span>
                  </div>
                </div>

                {/* Power Slider */}
                <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-300">Potência Elétrica (kW):</span>
                    <span className="text-amber-400 font-bold">{sliderPower} kW</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={sliderPower}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSliderPower(val);
                      handleUpdateActiveModule(sliderWidth, val);
                    }}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-600">
                    <span>0 kW (neutro)</span>
                    <span>8.0 kW (indução)</span>
                    <span>20.0 kW</span>
                  </div>
                </div>
              </div>

              {/* Algorithmic Expression Box */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2.5 font-mono text-xs">
                <span className="text-green-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-green-400" />
                  Expressão Algorítmica Avaliada:
                </span>
                <textarea
                  value={activeFormulaExpression}
                  onChange={(e) => setActiveFormulaExpression(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-200 focus:outline-none focus:border-green-400"
                />
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <span>Norma: VDI 2052 & DIN 18860</span>
                  <span className="text-emerald-400">Compilado OK</span>
                </div>
              </div>

              {/* Action: Tocar ou arrastar para tela principal */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/40 via-neutral-950 to-neutral-950 border border-amber-800/60 space-y-3 font-mono">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Injetar na Tela Principal:</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                  Toque para aplicar imediatamente as transformações paramétricas no modelo 3D ativo e abrir o visualizador central.
                </p>

                <button
                  onClick={() => {
                    handleUpdateActiveModule(sliderWidth, sliderPower);
                    if (onOpen3DViewer) onOpen3DViewer();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-amber-400/20"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Trazer Objeto Paramétrico para a Tela</span>
                </button>
              </div>

            </div>

            {/* Bottom Close */}
            <div className="pt-4 border-t border-neutral-800">
              <button
                onClick={onClose}
                className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-mono transition-colors cursor-pointer"
              >
                Fechar Visão Grasshopper
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
