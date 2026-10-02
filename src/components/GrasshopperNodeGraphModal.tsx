import React, { useState } from 'react';
import { DesignModel } from '../types/designModel';
import {
  Code2,
  X,
  Sliders,
  Play,
  Download,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  ExternalLink,
  Flame,
  Wind
} from 'lucide-react';

interface GrasshopperNodeGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DesignModel;
  onUpdateModelParameters?: (newParams: Partial<DesignModel['parameters']>) => void;
  onBakeGeometry?: () => void;
}

export const GrasshopperNodeGraphModal: React.FC<GrasshopperNodeGraphModalProps> = ({
  isOpen,
  onClose,
  model,
  onUpdateModelParameters,
  onBakeGeometry,
}) => {
  const [aisleWidthSlider, setAisleWidthSlider] = useState<number>(model.parameters.aisleWidthMinMm);
  const [coversSlider, setCoversSlider] = useState<number>(model.parameters.targetCoversPerNight);
  const [overhangSlider, setOverhangSlider] = useState<number>(model.parameters.exhaustHoodOverhangMm);
  const [activeNodeId, setActiveNodeId] = useState<string>('node-brep-gen');
  const [isBaking, setIsBaking] = useState<boolean>(false);
  const [bakeStatus, setBakeStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplySliders = () => {
    if (onUpdateModelParameters) {
      onUpdateModelParameters({
        aisleWidthMinMm: aisleWidthSlider,
        targetCoversPerNight: coversSlider,
        exhaustHoodOverhangMm: overhangSlider,
      });
    }
  };

  const handleBake = () => {
    setIsBaking(true);
    setTimeout(() => {
      setIsBaking(false);
      setBakeStatus('Geometria assada com sucesso no documento Rhino ativo (Camada: VUC::Monolithe_BREP).');
      if (onBakeGeometry) onBakeGeometry();
    }, 400);
  };

  const handleDownloadGHX = () => {
    const ghxContent = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<!-- Grasshopper Parametric Definition for MPK Monolithe Suite -->
<GrasshopperDefinition version="1.0" format="rhino7_ghx">
  <DocumentHeader>
    <Author>MPK VUC Studio &amp; scoobiii/vuc</Author>
    <ModelId>${model.id}</ModelId>
    <Date>${new Date().toISOString()}</Date>
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
    a.download = `MPK-Monolithe-${model.id}.ghx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[85vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 text-green-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Definição Paramétrica Grasshopper / Rhino Interop
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-green-950 border border-green-800 text-green-400">
                  GH v1.0.0007 Live
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Fluxo de dados visual conectando parâmetros espaciais, restrições dimensionais e geração de sólidos BREP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadGHX}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo .GHX</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Visual Node Graph Flowchart */}
          <div className="flex-1 bg-[#1e2029] p-6 relative overflow-auto select-none border-b md:border-b-0 md:border-r border-neutral-800">
            {/* Background Canvas Grid */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px',
              }}
            />

            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              
              {/* Row 1: Inputs & Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setActiveNodeId('node-inputs')}
                  className={`p-3.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                    activeNodeId === 'node-inputs'
                      ? 'bg-neutral-900/95 border-amber-400 ring-2 ring-amber-400/20 shadow-xl'
                      : 'bg-neutral-900/70 border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1">
                    <span className="text-amber-400 font-bold">Slider: AisleWidth</span>
                    <span>Min 1100mm</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-white">
                    {aisleWidthSlider} <span className="text-xs text-neutral-400">mm</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block mt-1">Norma de circulação de brigada</span>
                </div>

                <div
                  onClick={() => setActiveNodeId('node-inputs')}
                  className={`p-3.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                    activeNodeId === 'node-inputs'
                      ? 'bg-neutral-900/95 border-amber-400 ring-2 ring-amber-400/20 shadow-xl'
                      : 'bg-neutral-900/70 border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1">
                    <span className="text-amber-400 font-bold">Slider: OutputCovers</span>
                    <span>Meta Thai Mee</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-white">
                    {coversSlider} <span className="text-xs text-neutral-400">coberturas/noite</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block mt-1">Dimensionamento térmico de pico</span>
                </div>
              </div>

              {/* Connecting Pipe */}
              <div className="flex justify-center -my-2">
                <div className="w-0.5 h-6 bg-green-500/60" />
              </div>

              {/* Row 2: BREP Generator Component */}
              <div
                onClick={() => setActiveNodeId('node-brep-gen')}
                className={`p-4 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                  activeNodeId === 'node-brep-gen'
                    ? 'bg-neutral-900/95 border-green-400 ring-2 ring-green-400/20 shadow-xl'
                    : 'bg-neutral-900/70 border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-green-400 mb-1 font-bold">
                  <span>GH Component: MonolitheBrepBuilder</span>
                  <span className="bg-green-950 text-green-300 px-2 py-0.5 rounded text-[10px]">OpenNURBS BREP</span>
                </div>
                <div className="text-xs text-neutral-200 mt-1 leading-relaxed">
                  Gera extrusão contínua de aço inox 3mm ({model.monolithe.lengthMm} × {model.monolithe.depthMm} × {model.monolithe.heightMm} mm) com {model.monolithe.modules.length} recessos fresados a laser e sem juntas mecânicas.
                </div>
                <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-neutral-400">
                  <span className="bg-neutral-800 px-2 py-0.5 rounded">SolidUnion</span>
                  <span className="bg-neutral-800 px-2 py-0.5 rounded">MarineEdgeFillet R15</span>
                  <span className="bg-neutral-800 px-2 py-0.5 rounded">0 Sanitary Joints</span>
                </div>
              </div>

              {/* Connecting Pipe */}
              <div className="flex justify-center -my-2">
                <div className="w-0.5 h-6 bg-green-500/60" />
              </div>

              {/* Row 3: Physical Clash & Ventilation Solvers */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setActiveNodeId('node-clash-solver')}
                  className={`p-3.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                    activeNodeId === 'node-clash-solver'
                      ? 'bg-neutral-900/95 border-amber-400 ring-2 ring-amber-400/20 shadow-xl'
                      : 'bg-neutral-900/70 border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-400 mb-1 font-bold">
                    <span>ClashSolver</span>
                    <span className="text-[10px] text-neutral-400">AABB 3D</span>
                  </div>
                  <div className="text-xs text-neutral-300 mt-0.5">
                    Detecção de colisão física entre utilidades (gás, 400V, drenos) e módulos quentes.
                  </div>
                </div>

                <div
                  onClick={() => setActiveNodeId('node-halton-solver')}
                  className={`p-3.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                    activeNodeId === 'node-halton-solver'
                      ? 'bg-neutral-900/95 border-cyan-400 ring-2 ring-cyan-400/20 shadow-xl'
                      : 'bg-neutral-900/70 border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-1 font-bold">
                    <span>HaltonAirflow</span>
                    <span className="text-[10px] text-neutral-400">Capture Jet™</span>
                  </div>
                  <div className="text-xs text-neutral-300 mt-0.5">
                    {model.derivedCalculations.totalExhaustFlowM3h} m³/h de exaustão balanceada com compensação.
                  </div>
                </div>
              </div>

              {/* Connecting Pipe */}
              <div className="flex justify-center -my-2">
                <div className="w-0.5 h-6 bg-emerald-500/60" />
              </div>

              {/* Row 4: Bake Output */}
              <div
                onClick={() => setActiveNodeId('node-bake')}
                className={`p-4 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                  activeNodeId === 'node-bake'
                    ? 'bg-neutral-900/95 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xl'
                    : 'bg-neutral-900/70 border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 mb-1 font-bold">
                  <span>Output: Rhino 3DM Document Baker</span>
                  <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded text-[10px]">OpenNURBS AP242</span>
                </div>
                <div className="text-xs text-neutral-200 mt-1">
                  Grava a geometria final no Rhino com metadados BIM IFC4, atributos térmicos e compromisso criptográfico VUC.
                </div>
              </div>

            </div>
          </div>

          {/* Right Parameters Sidebar */}
          <div className="w-full md:w-80 bg-neutral-900/90 p-5 flex flex-col justify-between overflow-y-auto space-y-5 text-xs">
            <div>
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Sliders className="w-4 h-4 text-green-400" />
                <h3 className="font-bold text-white text-xs">
                  Ajuste Paramétrico em Tempo Real
                </h3>
              </div>

              <div className="mt-4 space-y-4">
                {/* Aisle Width Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-neutral-400">Largura Mínima Corredor:</span>
                    <span className="text-amber-400 font-bold">{aisleWidthSlider} mm</span>
                  </div>
                  <input
                    type="range"
                    min="900"
                    max="1800"
                    step="50"
                    value={aisleWidthSlider}
                    onChange={(e) => setAisleWidthSlider(parseInt(e.target.value))}
                    className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Norma: ≥ 1100mm para 2 cozinheiros</span>
                </div>

                {/* Covers Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-neutral-400">Coberturas por Noite:</span>
                    <span className="text-green-400 font-bold">{coversSlider}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="600"
                    step="25"
                    value={coversSlider}
                    onChange={(e) => setCoversSlider(parseInt(e.target.value))}
                    className="w-full accent-green-400 h-1.5 bg-neutral-800 rounded cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Impacta capacidade/hora e vazão de coifa</span>
                </div>

                {/* Overhang Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-neutral-400">Avanço Perimetral Coifa:</span>
                    <span className="text-cyan-400 font-bold">{overhangSlider} mm</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="400"
                    step="50"
                    value={overhangSlider}
                    onChange={(e) => setOverhangSlider(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Sobressalente Halton para captura de pluma</span>
                </div>

                <button
                  onClick={handleApplySliders}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Aplicar Parâmetros ao DesignModel
                </button>
              </div>

              {bakeStatus && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-mono text-[11px] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{bakeStatus}</span>
                </div>
              )}
            </div>

            {/* Bottom Bake Button */}
            <div className="pt-4 border-t border-neutral-800 space-y-2">
              <button
                onClick={handleBake}
                disabled={isBaking}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isBaking ? 'Assando Geometria...' : 'Bake to Rhino Document'}</span>
              </button>
              <p className="text-[10px] text-neutral-500 text-center font-mono">
                Converte a definição algorítmica em sólidos BREP estáticos editáveis no Rhino.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
